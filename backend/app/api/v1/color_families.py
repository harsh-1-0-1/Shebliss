from fastapi import APIRouter

from app.core.color_families import COLOR_FAMILIES

router = APIRouter(prefix="/color-families", tags=["color-families"])


@router.get("", summary="List all active color families")
async def list_color_families() -> list[dict]:
    """
    Returns the canonical list of active color families used for filtering.
    Each entry has: slug, label, hex.
    Inactive families are excluded so the storefront only shows live colours.
    """
    return [
        {"slug": slug, "label": meta["label"], "hex": meta["hex"]}
        for slug, meta in COLOR_FAMILIES.items()
        if meta.get("active", True)
    ]


@router.get("/all", summary="List all color families including inactive (admin)")
async def list_all_color_families() -> list[dict]:
    """
    Returns all color families including inactive ones.
    Used by the admin variant editor to show retired colours on existing products.
    """
    return [
        {
            "slug": slug,
            "label": meta["label"],
            "hex": meta["hex"],
            "active": meta.get("active", True),
        }
        for slug, meta in COLOR_FAMILIES.items()
    ]
