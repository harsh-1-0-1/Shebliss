from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse, PlainTextResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import limiter
from app.db.session import get_db
from app.services import seo_service
from app.utils.redis import cache_get, cache_set

router = APIRouter(prefix="/seo", tags=["seo"])

SEO_PATH_HEADER = "X-Seo-Path"


def _request_base(request: Request) -> str:
    proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("x-forwarded-host") or request.headers.get("host") or request.url.netloc
    return f"{proto}://{host}"


@router.get("/head", response_class=HTMLResponse)
@limiter.exempt
async def page_head(
    request: Request,
    path: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> HTMLResponse:
    target = request.headers.get(SEO_PATH_HEADER) or path or "/"
    meta = await seo_service.build_page_meta(db, target, _request_base(request))
    return HTMLResponse(seo_service.render_head(meta), headers={"Cache-Control": "public, max-age=300"})


@router.get("/sitemap.xml")
@limiter.exempt
async def sitemap(request: Request, db: AsyncSession = Depends(get_db)) -> Response:
    cache_key = "seo:sitemap"
    body = await cache_get(cache_key)
    if not body:
        body = await seo_service.build_sitemap(db, _request_base(request))
        await cache_set(cache_key, body, 3600)
    return Response(body, media_type="application/xml", headers={"Cache-Control": "public, max-age=3600"})


@router.get("/robots.txt", response_class=PlainTextResponse)
@limiter.exempt
async def robots(request: Request) -> PlainTextResponse:
    return PlainTextResponse(seo_service.build_robots(_request_base(request)))
