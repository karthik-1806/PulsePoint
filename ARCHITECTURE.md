# Architecture

PulsePoint employs a dual-agent architecture operating over a shared real-time data layer.

## Two-Agent Design

1.  **Ops Agent (Staff/Volunteer Copilot):**
    *   **Purpose:** Assists stadium personnel with logistical queries, incident management, and crowd control.
    *   **Capabilities:** Accesses internal metrics, security feeds, task queues, and staff directories.
    *   **Interface:** Prioritizes actionable intelligence and rapid data entry.

2.  **Fan Agent (Attendee Assistant):**
    *   **Purpose:** Helps fans navigate the stadium, understand policies, and find amenities.
    *   **Capabilities:** Accesses public schedules, wayfinding data, and general FAQs.
    *   **Interface:** Prioritizes conversational, user-friendly responses.

## Venue Pulse (Real-Time Data Layer)

Both agents share the **Venue Pulse**, a centralized real-time data layer.
*   **Function:** Acts as the single source of truth for stadium state (e.g., gate wait times, concession inventory, incident statuses).
*   **Benefits:** Ensures the Fan Agent provides accurate information while the Ops Agent has complete visibility into the stadium's operational health.
