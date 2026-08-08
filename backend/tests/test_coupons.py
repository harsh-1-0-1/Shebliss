import pytest
from httpx import AsyncClient

from tests.conftest import (
    _register_and_make_admin,
    _register_user,
    _seed_address,
    _seed_product_and_category,
)

pytestmark = pytest.mark.asyncio


async def _create_coupon(client: AsyncClient, admin_token: str, **overrides) -> dict:
    body = {
        "code": "SAVE10",
        "discount_type": "percent",
        "value": 10,
        "min_order_amount": 100,
        "max_discount_amount": 50,
        "usage_limit": 5,
        "is_active": True,
    }
    body.update(overrides)
    resp = await client.post(
        "/api/v1/admin/coupons",
        json=body,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


async def _seed_cart(client: AsyncClient, token: str, product_id: int, quantity: int = 2) -> int:
    resp = await client.post(
        "/api/v1/cart/items",
        json={"product_id": product_id, "quantity": quantity},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    return resp.json()["id"]


async def test_admin_coupon_crud(client: AsyncClient):
    admin = await _register_and_make_admin(client)

    coupon = await _create_coupon(client, admin)
    assert coupon["code"] == "SAVE10"
    assert coupon["times_used"] == 0

    # list
    resp = await client.get(
        "/api/v1/admin/coupons", headers={"Authorization": f"Bearer {admin}"}
    )
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    # update
    resp = await client.put(
        f"/api/v1/admin/coupons/{coupon['id']}",
        json={"value": 15},
        headers={"Authorization": f"Bearer {admin}"},
    )
    assert resp.status_code == 200
    assert resp.json()["value"] == 15

    # toggle off
    resp = await client.patch(
        f"/api/v1/admin/coupons/{coupon['id']}/toggle",
        headers={"Authorization": f"Bearer {admin}"},
    )
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False

    # delete
    resp = await client.delete(
        f"/api/v1/admin/coupons/{coupon['id']}",
        headers={"Authorization": f"Bearer {admin}"},
    )
    assert resp.status_code == 200


async def test_admin_coupon_requires_admin(client: AsyncClient):
    token = await _register_user(client)
    resp = await client.post(
        "/api/v1/admin/coupons",
        json={"code": "SAVE10", "discount_type": "percent", "value": 10},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403


async def test_validate_coupon_public(client: AsyncClient):
    admin = await _register_and_make_admin(client)
    await _create_coupon(client, admin)

    resp = await client.post(
        "/api/v1/coupons/validate",
        json={"code": "save10", "subtotal": 1000},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["valid"] is True
    assert data["discount"] == 50  # capped by max_discount_amount

    # invalid code
    resp = await client.post(
        "/api/v1/coupons/validate",
        json={"code": "NOPE", "subtotal": 1000},
    )
    assert resp.json()["valid"] is False
    assert "Invalid" in resp.json()["message"]


async def test_validate_coupon_errors(client: AsyncClient):
    admin = await _register_and_make_admin(client)
    await _create_coupon(client, admin, code="MIN100", min_order_amount=100)

    # below min order
    resp = await client.post(
        "/api/v1/coupons/validate",
        json={"code": "MIN100", "subtotal": 50},
    )
    assert resp.json()["valid"] is False
    assert "at least" in resp.json()["message"]

    # inactive
    inactive = await _create_coupon(client, admin, code="INACTIVE", is_active=False)
    resp = await client.post(
        "/api/v1/coupons/validate",
        json={"code": "INACTIVE", "subtotal": 500},
    )
    assert resp.json()["valid"] is False
    assert "active" in resp.json()["message"].lower()

    # expired
    from datetime import datetime, timedelta, timezone
    await _create_coupon(
        client, admin,
        code="EXPIRED",
        valid_until=(datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
    )
    resp = await client.post(
        "/api/v1/coupons/validate",
        json={"code": "EXPIRED", "subtotal": 500},
    )
    assert resp.json()["valid"] is False
    assert "expired" in resp.json()["message"].lower()


async def test_checkout_applies_coupon_and_increments_usage(client: AsyncClient):
    admin = await _register_and_make_admin(client)
    product = await _seed_product_and_category(client, admin, stock=10)
    coupon = await _create_coupon(client, admin, code="SAVE10", value=10, max_discount_amount=50)

    token = await _register_user(client)
    address = await _seed_address(client, token)
    cart_id = await _seed_cart(client, token, product["id"], quantity=2)

    resp = await client.post(
        "/api/v1/orders/checkout",
        json={"address_id": address["id"], "cart_id": cart_id, "coupon_code": "save10"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201, resp.text
    order_id = resp.json()["order_id"]

    detail = await client.get(
        f"/api/v1/orders/{order_id}", headers={"Authorization": f"Bearer {token}"}
    )
    order = detail.json()
    subtotal = 2 * product["price"]
    assert order["subtotal"] == subtotal
    assert order["discount_amount"] == 50  # capped
    assert order["total_amount"] == subtotal - 50
    assert order["coupon_code"] == "SAVE10"

    # usage counter incremented
    list_resp = await client.get(
        "/api/v1/admin/coupons", headers={"Authorization": f"Bearer {admin}"}
    )
    listed = [c for c in list_resp.json() if c["id"] == coupon["id"]][0]
    assert listed["times_used"] == 1


async def test_checkout_invalid_coupon_fails(client: AsyncClient):
    admin = await _register_and_make_admin(client)
    product = await _seed_product_and_category(client, admin, stock=10)
    token = await _register_user(client)
    address = await _seed_address(client, token)
    cart_id = await _seed_cart(client, token, product["id"], quantity=1)

    resp = await client.post(
        "/api/v1/orders/checkout",
        json={"address_id": address["id"], "cart_id": cart_id, "coupon_code": "BOGUS"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400
    assert "Invalid" in resp.json()["detail"]
