# Triggering uvicorn reload
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import asyncio
from contextlib import asynccontextmanager
from state import venue_state
from seed import generate_mock_venue_snapshot
from simulator import run_simulator
from agent import setup_gemini, get_fan_agent_response
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

load_dotenv(override=True)

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed data and start simulator
    venue_state.snapshot = generate_mock_venue_snapshot()
    setup_gemini()
    simulator_task = asyncio.create_task(run_simulator())
    yield
    # Shutdown
    simulator_task.cancel()


app = FastAPI(
    title="PulsePoint Backend",
    description="GenAI operations copilot for stadium staff/volunteers and secondary fan assistant.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


class SecureHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        return response


app.add_middleware(SecureHeadersMiddleware)


@app.get("/")
def read_root() -> dict:
    return {"status": "ok", "message": "PulsePoint API is running"}


@app.get("/venue-pulse/snapshot")
def get_venue_snapshot():
    return venue_state.snapshot


class FanRequest(BaseModel):
    query: str
    language: str = "English"
    step_free: bool = False


@app.post("/fan-agent")
def fan_agent_endpoint(req: FanRequest):
    snapshot_json = (
        venue_state.snapshot.model_dump_json() if venue_state.snapshot else "{}"
    )
    result = get_fan_agent_response(
        query=req.query,
        step_free=req.step_free,
        language=req.language,
        venue_data=snapshot_json,
    )
    return result


@app.websocket("/ws/venue-pulse")
async def websocket_endpoint(websocket: WebSocket):
    await venue_state.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await venue_state.disconnect(websocket)


# --- Ops Copilot Endpoints ---

from auth import create_access_token, require_role
from pydantic import Field
import re
from ops_agent import classify_incident, generate_daily_briefing
from matching import find_best_volunteer


class LoginRequest(BaseModel):
    role: str


@app.post("/login")
def login(req: LoginRequest):
    """Mock login returning a JWT for the requested role."""
    if req.role not in ["volunteer", "marshal", "commander"]:
        return {"error": "Invalid role"}
    token = create_access_token(data={"sub": "demo_user", "role": req.role})
    return {"access_token": token, "token_type": "bearer"}


class IncidentReport(BaseModel):
    description: str = Field(..., max_length=1000)
    location: str

    @property
    def sanitized_description(self):
        # Strip simple anomalous control characters (basic sanitization)
        return re.sub(r"[\x00-\x1F\x7F-\x9F]", "", self.description)


from fastapi import Depends


@app.post("/ops-agent/incident")
def report_incident(
    req: IncidentReport,
    user: dict = Depends(require_role(["volunteer", "marshal", "commander"])),
):
    # 1. AI Classification
    classification = classify_incident(req.sanitized_description, req.location)

    # 2. Deterministic Matching
    roster = venue_state.snapshot.roster if venue_state.snapshot else None
    volunteer_match = None
    if roster:
        volunteer_match = find_best_volunteer(
            req.location, req.sanitized_description, roster
        )

    return {"classification": classification, "assigned_volunteer": volunteer_match}


import time
import json

briefing_cache = {"data": None, "timestamp": 0}


@app.post("/ops-agent/daily-briefing")
def get_daily_briefing(user: dict = Depends(require_role(["commander", "marshal"]))):
    global briefing_cache
    now = time.time()
    if briefing_cache["data"] and (
        now - briefing_cache["timestamp"] < 900
    ):  # 15 minutes
        return briefing_cache["data"]

    snapshot_dict = venue_state.snapshot.model_dump() if venue_state.snapshot else {}

    from forecast import calculate_gate_forecasts

    history_list = list(venue_state.history)
    forecasts = calculate_gate_forecasts(history_list)

    full_payload = {"snapshot": snapshot_dict, "forecasts": forecasts}

    briefing = generate_daily_briefing(json.dumps(full_payload, default=str))

    briefing_cache["data"] = briefing
    briefing_cache["timestamp"] = now

    return briefing


from forecast import calculate_gate_forecasts
from ops_agent import generate_forecast_recommendations
import json


@app.get("/forecast")
@limiter.limit("20/minute")
def get_forecast(
    request: Request, user: dict = Depends(require_role(["marshal", "commander"]))
):
    # Convert history deque to list
    history_list = list(venue_state.history)
    forecasts = calculate_gate_forecasts(history_list)

    recommendations = []
    if forecasts:
        recommendations = generate_forecast_recommendations(json.dumps(forecasts))

    return {"forecasts": forecasts, "recommendations": recommendations}


from sustainability import calculate_green_score
from sustainability_agent import generate_sustainability_suggestions


@app.get("/sustainability")
def get_sustainability():
    transit_lines = venue_state.snapshot.transit if venue_state.snapshot else []
    score_data = calculate_green_score(transit_lines)

    # Generate suggestions
    suggestions = generate_sustainability_suggestions(score_data)

    return {"score_data": score_data, "suggestions": suggestions}
