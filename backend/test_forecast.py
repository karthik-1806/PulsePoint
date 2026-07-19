import json
import urllib.request

t = json.loads(
    urllib.request.urlopen(
        urllib.request.Request(
            "http://localhost:8000/login",
            data=b'{"role":"commander"}',
            headers={"Content-Type": "application/json"},
        )
    )
    .read()
    .decode()
)["access_token"]

print(
    urllib.request.urlopen(
        urllib.request.Request(
            "http://localhost:8000/forecast", headers={"Authorization": "Bearer " + t}
        )
    )
    .read()
    .decode()
)
