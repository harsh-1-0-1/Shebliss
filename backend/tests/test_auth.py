import pytest
from httpx import AsyncClient

REGISTER_URL = "/api/v1/auth/register"
LOGIN_URL = "/api/v1/auth/login"
REFRESH_URL = "/api/v1/auth/refresh"
LOGOUT_URL = "/api/v1/auth/logout"

SAMPLE_USER = {
    "email": "test@example.com",
    "password": "Str0ngP@ss!",
    "full_name": "Test User",
}


# ---- Register ----------------------------------------------------------

@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    resp = await client.post(REGISTER_URL, json=SAMPLE_USER)
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {**SAMPLE_USER, "email": "dupe@example.com"}
    resp1 = await client.post(REGISTER_URL, json=payload)
    assert resp1.status_code == 201

    resp2 = await client.post(REGISTER_URL, json=payload)
    assert resp2.status_code == 409
    assert "already registered" in resp2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_short_password(client: AsyncClient):
    payload = {**SAMPLE_USER, "email": "short@example.com", "password": "abc"}
    resp = await client.post(REGISTER_URL, json=payload)
    assert resp.status_code == 422


# ---- Login -------------------------------------------------------------

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    reg_email = "login_ok@example.com"
    await client.post(REGISTER_URL, json={**SAMPLE_USER, "email": reg_email})

    resp = await client.post(LOGIN_URL, json={"email": reg_email, "password": SAMPLE_USER["password"]})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    reg_email = "wrongpw@example.com"
    await client.post(REGISTER_URL, json={**SAMPLE_USER, "email": reg_email})

    resp = await client.post(LOGIN_URL, json={"email": reg_email, "password": "WrongPassword!"})
    assert resp.status_code == 401
    assert "invalid" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_unknown_email(client: AsyncClient):
    resp = await client.post(LOGIN_URL, json={"email": "nobody@example.com", "password": "whatever"})
    assert resp.status_code == 401


# ---- Token refresh ------------------------------------------------------

@pytest.mark.asyncio
async def test_refresh_success(client: AsyncClient):
    reg_email = "refresh@example.com"
    reg_resp = await client.post(REGISTER_URL, json={**SAMPLE_USER, "email": reg_email})
    refresh_token = reg_resp.json()["refresh_token"]

    resp = await client.post(REFRESH_URL, json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["refresh_token"] != refresh_token  # rotated


@pytest.mark.asyncio
async def test_refresh_reuse_old_token(client: AsyncClient):
    reg_email = "reuse_rt@example.com"
    reg_resp = await client.post(REGISTER_URL, json={**SAMPLE_USER, "email": reg_email})
    old_refresh = reg_resp.json()["refresh_token"]

    # Rotate once
    await client.post(REFRESH_URL, json={"refresh_token": old_refresh})

    # Old token should now be invalid
    resp = await client.post(REFRESH_URL, json={"refresh_token": old_refresh})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_refresh_invalid_token(client: AsyncClient):
    resp = await client.post(REFRESH_URL, json={"refresh_token": "garbage.token.value"})
    assert resp.status_code == 401


# ---- Logout -------------------------------------------------------------

@pytest.mark.asyncio
async def test_logout_flow(client: AsyncClient):
    reg_email = "logout@example.com"
    reg_resp = await client.post(REGISTER_URL, json={**SAMPLE_USER, "email": reg_email})
    refresh_token = reg_resp.json()["refresh_token"]

    resp = await client.post(LOGOUT_URL, json={"refresh_token": refresh_token})
    assert resp.status_code == 204

    # Refresh should now fail
    resp2 = await client.post(REFRESH_URL, json={"refresh_token": refresh_token})
    assert resp2.status_code == 401


# ---- Inactive / locked account ---------------------------------------------

async def _lock_user(email: str) -> None:
    from sqlalchemy import update

    from app.db.models import User
    from tests.conftest import test_session_factory

    async with test_session_factory() as db:
        await db.execute(update(User).where(User.email == email).values(is_active=False))
        await db.commit()


@pytest.mark.asyncio
async def test_login_blocked_for_inactive_user(client: AsyncClient):
    reg_email = "locked@example.com"
    await client.post(REGISTER_URL, json={**SAMPLE_USER, "email": reg_email})
    await _lock_user(reg_email)

    resp = await client.post(LOGIN_URL, json={"email": reg_email, "password": SAMPLE_USER["password"]})
    assert resp.status_code == 403
    assert "deactivated" in resp.json()["detail"].lower()
    assert "access_token" not in resp.json()


@pytest.mark.asyncio
async def test_refresh_blocked_for_inactive_user(client: AsyncClient):
    reg_email = "refresh_locked@example.com"
    reg_resp = await client.post(REGISTER_URL, json={**SAMPLE_USER, "email": reg_email})
    refresh_token = reg_resp.json()["refresh_token"]
    await _lock_user(reg_email)

    resp = await client.post(REFRESH_URL, json={"refresh_token": refresh_token})
    assert resp.status_code == 401
    assert "deactivated" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_guest_blocked_for_inactive_user(client: AsyncClient):
    reg_email = "guest_locked@example.com"
    await client.post(REGISTER_URL, json={**SAMPLE_USER, "email": reg_email})
    await _lock_user(reg_email)

    resp = await client.post(
        "/api/v1/auth/guest",
        json={"email": reg_email, "full_name": "Guest User", "phone": "9876500000"},
    )
    assert resp.status_code == 403
    assert "deactivated" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_locked_user_access_token_rejected_on_protected_endpoint(client: AsyncClient):
    reg_email = "access_locked@example.com"
    await client.post(REGISTER_URL, json={**SAMPLE_USER, "email": reg_email})
    reg_resp = await client.post(LOGIN_URL, json={"email": reg_email, "password": SAMPLE_USER["password"]})
    access_token = reg_resp.json()["access_token"]
    await _lock_user(reg_email)

    resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert resp.status_code == 403


# ---- Protected endpoint --------------------------------------------------

@pytest.mark.asyncio
async def test_access_token_works(client: AsyncClient):
    reg_email = "access@example.com"
    reg_resp = await client.post(REGISTER_URL, json={**SAMPLE_USER, "email": reg_email})
    access_token = reg_resp.json()["access_token"]

    resp = await client.get(
        "/api/v1/health",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert resp.status_code == 200
