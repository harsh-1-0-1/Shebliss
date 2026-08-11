from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.config import settings
from app.core.exceptions import MaintenanceModeError
from app.core.security import hash_password
from app.db.models import User
from app.services import auth_service
from tests.conftest import test_session_factory


@pytest.mark.asyncio
async def test_health_includes_maintenance(client: AsyncClient):
    with patch("app.api.v1.health.settings.MAINTENANCE", True):
        resp = await client.get("/api/v1/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["maintenance"] is True

    with patch("app.api.v1.health.settings.MAINTENANCE", False):
        resp = await client.get("/api/v1/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["maintenance"] is False


@pytest.mark.asyncio
async def test_maintenance_blocks_registration_and_guest(client: AsyncClient):
    with patch("app.api.v1.auth.settings.MAINTENANCE", True):
        # Register block
        resp = await client.post("/api/v1/auth/register", json={
            "email": "new_user@example.com",
            "password": "Password123!",
            "full_name": "New User"
        })
        assert resp.status_code == 503
        assert "maintenance" in resp.json()["detail"].lower()

        # Guest block
        resp = await client.post("/api/v1/auth/guest", json={
            "email": "guest@example.com",
            "full_name": "Guest User"
        })
        assert resp.status_code == 503
        assert "maintenance" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_maintenance_login_admin_vs_non_admin(client: AsyncClient):
    # Create non-admin and admin users in the database
    async with test_session_factory() as db:
        non_admin = User(
            email="user_non_admin@example.com",
            hashed_password=hash_password("Password123!"),
            full_name="Non Admin",
            is_admin=False,
            is_active=True
        )
        admin = User(
            email="user_admin@example.com",
            hashed_password=hash_password("Password123!"),
            full_name="Admin User",
            is_admin=True,
            is_active=True
        )
        db.add(non_admin)
        db.add(admin)
        await db.commit()

    with patch("app.api.v1.auth.settings.MAINTENANCE", True):
        # Admin login works
        resp = await client.post("/api/v1/auth/login", json={
            "email": "user_admin@example.com",
            "password": "Password123!"
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

        # Non-admin login fails
        resp = await client.post("/api/v1/auth/login", json={
            "email": "user_non_admin@example.com",
            "password": "Password123!"
        })
        assert resp.status_code == 503
        assert "maintenance" in resp.json()["detail"].lower()
        assert "access_token" not in resp.json()


@pytest.mark.asyncio
async def test_google_callback_maintenance(client: AsyncClient):
    async with test_session_factory() as db:
        # Create existing admin
        admin = User(
            email="google_admin@example.com",
            full_name="Google Admin",
            google_id="admin-google-id",
            is_admin=True,
            is_active=True
        )
        # Create existing non-admin
        non_admin = User(
            email="google_non_admin@example.com",
            full_name="Google Non-Admin",
            google_id="non-admin-google-id",
            is_admin=False,
            is_active=True
        )
        db.add(admin)
        db.add(non_admin)
        await db.commit()

    # 1. Existing Admin
    async with test_session_factory() as db:
        mock_token_resp = MagicMock()
        mock_token_resp.json.return_value = {"access_token": "g-tok", "refresh_token": "g-ref"}
        mock_token_resp.raise_for_status = MagicMock()

        mock_profile_resp = MagicMock()
        mock_profile_resp.json.return_value = {"id": "admin-google-id", "email": "google_admin@example.com", "name": "Google Admin"}
        mock_profile_resp.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_token_resp)
        mock_client.get = AsyncMock(return_value=mock_profile_resp)

        with (
            patch("app.services.auth_service.settings.MAINTENANCE", True),
            patch("app.services.auth_service.validate_oauth_state", return_value=True),
            patch("httpx.AsyncClient", return_value=mock_client)
        ):
            user = await auth_service.google_callback(db, "code", "state")
            assert user.email == "google_admin@example.com"
            assert user.is_admin is True

    # 2. Existing Non-Admin (should raise MaintenanceModeError and have no side effects)
    async with test_session_factory() as db:
        mock_token_resp = MagicMock()
        mock_token_resp.json.return_value = {"access_token": "g-tok", "refresh_token": "g-ref"}
        mock_token_resp.raise_for_status = MagicMock()

        mock_profile_resp = MagicMock()
        mock_profile_resp.json.return_value = {"id": "non-admin-google-id", "email": "google_non_admin@example.com", "name": "Google Non-Admin"}
        mock_profile_resp.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_token_resp)
        mock_client.get = AsyncMock(return_value=mock_profile_resp)

        with (
            patch("app.services.auth_service.settings.MAINTENANCE", True),
            patch("app.services.auth_service.validate_oauth_state", return_value=True),
            patch("httpx.AsyncClient", return_value=mock_client)
        ):
            with pytest.raises(MaintenanceModeError) as exc_info:
                await auth_service.google_callback(db, "code", "state")
            assert "only administrator login is allowed" in str(exc_info.value).lower()

    # 3. New User Registration attempt (should raise MaintenanceModeError and NOT write to DB)
    async with test_session_factory() as db:
        mock_token_resp = MagicMock()
        mock_token_resp.json.return_value = {"access_token": "g-tok", "refresh_token": "g-ref"}
        mock_token_resp.raise_for_status = MagicMock()

        mock_profile_resp = MagicMock()
        mock_profile_resp.json.return_value = {"id": "new-google-id", "email": "google_new@example.com", "name": "Google New"}
        mock_profile_resp.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client.post = AsyncMock(return_value=mock_token_resp)
        mock_client.get = AsyncMock(return_value=mock_profile_resp)

        with (
            patch("app.services.auth_service.settings.MAINTENANCE", True),
            patch("app.services.auth_service.validate_oauth_state", return_value=True),
            patch("httpx.AsyncClient", return_value=mock_client)
        ):
            with pytest.raises(MaintenanceModeError) as exc_info:
                await auth_service.google_callback(db, "code", "state")
            assert "new registrations are currently disabled" in str(exc_info.value).lower()

            # Check DB to confirm no user with google_new@example.com or new-google-id was created
            result = await db.execute(select(User).where(User.email == "google_new@example.com"))
            assert result.scalar_one_or_none() is None
