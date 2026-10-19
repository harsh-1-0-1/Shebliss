import secrets
from typing import Callable

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.gzip import GZipMiddleware
from starlette.responses import JSONResponse, Response
from starlette.types import ASGIApp, Receive, Scope, Send

from app.core.config import settings

ORIGIN_VERIFY_HEADER = "X-Origin-Verify"
EXEMPT_PATHS = frozenset({"/api/v1/health"})


class CloudFrontGateMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not settings.REQUIRE_CLOUDFRONT or request.url.path in EXEMPT_PATHS:
            return await call_next(request)

        supplied_secret = request.headers.get(ORIGIN_VERIFY_HEADER, "")
        if not secrets.compare_digest(supplied_secret, settings.CLOUDFRONT_SECRET):
            return JSONResponse(
                status_code=403,
                content={"detail": "Direct access forbidden"},
            )

        return await call_next(request)


class StaticAwareGZipMiddleware:

    def __init__(self, app: ASGIApp, minimum_size: int = 1000, compresslevel: int = 6) -> None:
        self.app = app
        self.gzip = GZipMiddleware(app, minimum_size=minimum_size, compresslevel=compresslevel)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http" and scope["path"].startswith("/static/"):
            await self.app(scope, receive, send)
            return
        await self.gzip(scope, receive, send)
