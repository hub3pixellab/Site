"""
API tests for HUB3 PixelLab Next.js app.
Endpoints under test:
  - POST /api/ai/chat (streaming)
  - POST /api/ai/idea
  - POST /api/careers (multipart)
Also checks page routes return 200.
"""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("APP_BASE_URL", "http://localhost:3000")


# ---------------- Page routes (GET) ----------------
@pytest.mark.parametrize("path", ["/", "/fliperama", "/loja", "/ia", "/contato"])
def test_page_route_200(path):
    r = requests.get(f"{BASE_URL}{path}", timeout=30)
    assert r.status_code == 200, f"{path} -> {r.status_code}"
    # rough sanity check for HTML
    assert "<html" in r.text.lower() or "next" in r.text.lower()


# ---------------- /api/ai/chat streaming ----------------
def test_api_ai_chat_streaming():
    url = f"{BASE_URL}/api/ai/chat"
    payload = {"mode": "chat", "messages": [{"role": "user", "content": "Diga OK HUB3 em uma palavra"}]}
    r = requests.post(url, json=payload, stream=True, timeout=60)
    assert r.status_code == 200, f"status={r.status_code} body={r.text[:300]}"
    ctype = r.headers.get("Content-Type", "")
    assert "text/plain" in ctype or "text/event-stream" in ctype or "application/octet-stream" in ctype, f"ctype={ctype}"

    collected = ""
    start = time.time()
    for chunk in r.iter_content(chunk_size=64, decode_unicode=True):
        if chunk:
            collected += chunk
        if time.time() - start > 45:
            break
    assert len(collected.strip()) > 0, f"empty stream. headers={dict(r.headers)}"


# ---------------- /api/ai/idea ----------------
def test_api_ai_idea():
    url = f"{BASE_URL}/api/ai/idea"
    payload = {"prompt": "app de bar em AR"}
    r = requests.post(url, json=payload, timeout=60)
    assert r.status_code == 200, f"status={r.status_code} body={r.text[:500]}"
    data = r.json()
    assert data.get("ok") is True, f"payload={data}"
    assert "idea" in data and isinstance(data["idea"], str) and len(data["idea"]) > 10, f"payload={data}"
    # mailer is no-op (RESEND not set) → mailed should be False/undefined
    assert data.get("mailed", False) is False


# ---------------- /api/careers multipart ----------------
def test_api_careers_multipart_ok():
    url = f"{BASE_URL}/api/careers"
    data = {
        "name": "TEST_Candidate",
        "email": "test@example.com",
        "area": "Engineering",
        "linkedin": "https://linkedin.com/in/test",
        "message": "I love pixel art.",
    }
    files = {"cv": ("cv.txt", b"dummy cv content", "text/plain")}
    r = requests.post(url, data=data, files=files, timeout=30)
    assert r.status_code == 200, f"status={r.status_code} body={r.text[:500]}"
    body = r.json()
    assert body.get("ok") is True, body
    assert body.get("mailed", False) is False, body


def test_api_careers_missing_required_returns_error():
    url = f"{BASE_URL}/api/careers"
    r = requests.post(url, data={"name": ""}, timeout=15)
    # Should reject; either 400 or {ok:false}
    if r.status_code == 200:
        body = r.json()
        assert body.get("ok") is False, f"Should not accept empty payload: {body}"
    else:
        assert r.status_code in (400, 422), r.status_code
