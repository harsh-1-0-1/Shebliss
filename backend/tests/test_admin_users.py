"""Admin user management: lock/unlock accounts and grant/revoke admin role."""

import pytest
from httpx import AsyncClient

from tests.conftest import _register_and_make_admin, _register_user

pytestmark = pytest.mark.asyncio

ADMIN_HEADERS = {}


async def _admin_headers(client: AsyncClient) -> dict:
    token = await _register_and_make_admin(client)
    return {"Authorization": f"Bearer {token}"}


async def _target_user_id(client: AsyncClient, admin_headers: dict, email: str) -> int:
    resp = await client.get("/api/v1/admin/users", headers=admin_headers)
    assert resp.status_code == 200
    for item in resp.json()["items"]:
        if item["email"] == email:
            return item["id"]
    raise AssertionError(f"User {email} not found in admin user list")


async def test_non_admin_cannot_update_user(client: AsyncClient):
    user_headers = {"Authorization": f"Bearer {await _register_user(client)}"}
    resp = await client.patch(
        "/api/v1/admin/users/1",
        json={"is_active": False},
        headers=user_headers,
    )
    assert resp.status_code == 403


async def test_admin_can_lock_and_unlock_user(client: AsyncClient):
    await _register_user(client)
    admin_headers = await _admin_headers(client)
    user_id = await _target_user_id(client, admin_headers, "user@test.com")

    lock = await client.patch(
        f"/api/v1/admin/users/{user_id}",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert lock.status_code == 200
    assert lock.json()["is_active"] is False

    unlock = await client.patch(
        f"/api/v1/admin/users/{user_id}",
        json={"is_active": True},
        headers=admin_headers,
    )
    assert unlock.status_code == 200
    assert unlock.json()["is_active"] is True


async def test_admin_can_grant_and_revoke_admin_role(client: AsyncClient):
    await _register_user(client)
    admin_headers = await _admin_headers(client)
    user_id = await _target_user_id(client, admin_headers, "user@test.com")

    grant = await client.patch(
        f"/api/v1/admin/users/{user_id}",
        json={"is_admin": True},
        headers=admin_headers,
    )
    assert grant.status_code == 200
    assert grant.json()["is_admin"] is True

    revoke = await client.patch(
        f"/api/v1/admin/users/{user_id}",
        json={"is_admin": False},
        headers=admin_headers,
    )
    assert revoke.status_code == 200
    assert revoke.json()["is_admin"] is False


async def test_admin_cannot_modify_own_account(client: AsyncClient):
    admin_headers = await _admin_headers(client)
    admin_id = await _target_user_id(client, admin_headers, "admin@test.com")

    resp = await client.patch(
        f"/api/v1/admin/users/{admin_id}",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert resp.status_code == 400


async def test_invalid_body_rejected(client: AsyncClient):
    await _register_user(client)
    admin_headers = await _admin_headers(client)
    user_id = await _target_user_id(client, admin_headers, "user@test.com")

    empty = await client.patch(f"/api/v1/admin/users/{user_id}", json={}, headers=admin_headers)
    assert empty.status_code == 400

    bad_type = await client.patch(
        f"/api/v1/admin/users/{user_id}",
        json={"is_admin": "yes"},
        headers=admin_headers,
    )
    assert bad_type.status_code == 400


async def test_update_missing_user_returns_404(client: AsyncClient):
    admin_headers = await _admin_headers(client)
    resp = await client.patch(
        "/api/v1/admin/users/999999",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert resp.status_code == 404
