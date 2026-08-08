"""Corporate gifting inquiries: public submission + admin management."""

import pytest
from httpx import AsyncClient

from tests.conftest import _register_and_make_admin

pytestmark = pytest.mark.asyncio

PAYLOAD = {
    "full_name": "Rajesh Sharma",
    "phone": "+919876543210",
    "email": "rajesh@reliance.com",
    "company_name": "Reliance Industries",
    "customisation": "Need 500 branded gift hampers for Diwali gifting.",
    "qty_requested": 500,
}


async def test_submit_inquiry_public(client: AsyncClient):
    resp = await client.post("/api/v1/corporate-inquiries", json=PAYLOAD)
    assert resp.status_code == 201
    data = resp.json()
    assert data["full_name"] == "Rajesh Sharma"
    assert data["status"] == "new"
    assert data["id"] > 0


async def test_submit_inquiry_validation(client: AsyncClient):
    bad = await client.post("/api/v1/corporate-inquiries", json={**PAYLOAD, "email": "nope"})
    assert bad.status_code == 422


async def test_admin_list_requires_admin(client: AsyncClient):
    resp = await client.get("/api/v1/corporate-inquiries/admin")
    assert resp.status_code == 401


async def test_admin_list_and_status_flow(client: AsyncClient):
    await client.post("/api/v1/corporate-inquiries", json=PAYLOAD)
    token = await _register_and_make_admin(client)
    headers = {"Authorization": f"Bearer {token}"}

    listing = await client.get("/api/v1/corporate-inquiries/admin", headers=headers)
    assert listing.status_code == 200
    assert listing.json()["total"] == 1
    inquiry_id = listing.json()["items"][0]["id"]

    update = await client.patch(
        f"/api/v1/corporate-inquiries/admin/{inquiry_id}/status",
        json={"status": "quoted"},
        headers=headers,
    )
    assert update.status_code == 200
    assert update.json()["status"] == "quoted"

    filtered = await client.get(
        "/api/v1/corporate-inquiries/admin?status=quoted", headers=headers
    )
    assert filtered.json()["total"] == 1

    empty = await client.get(
        "/api/v1/corporate-inquiries/admin?status=approved", headers=headers
    )
    assert empty.json()["total"] == 0


async def test_admin_status_update_validation(client: AsyncClient):
    await client.post("/api/v1/corporate-inquiries", json=PAYLOAD)
    token = await _register_and_make_admin(client)
    headers = {"Authorization": f"Bearer {token}"}
    listing = await client.get("/api/v1/corporate-inquiries/admin", headers=headers)
    inquiry_id = listing.json()["items"][0]["id"]

    bad = await client.patch(
        f"/api/v1/corporate-inquiries/admin/{inquiry_id}/status",
        json={"status": "nonsense"},
        headers=headers,
    )
    assert bad.status_code == 422

    missing = await client.patch(
        "/api/v1/corporate-inquiries/admin/999999/status",
        json={"status": "approved"},
        headers=headers,
    )
    assert missing.status_code == 404
