"""
Canonical color families for the Shebliss jewellery store.

Each color family is a lowercase slug used for filtering and URLs.
The hex values are for display only (swatches).
"""

#: Canonical color families with display labels and hex values.
#: Set 'active' to False to retire a color (won't appear in new selections
#: but existing products using it can still be saved).
COLOR_FAMILIES = {
    "emerald": {
        "label": "Emerald",
        "hex": "#046c48",
        "active": True,
    },
    "rani-pink": {
        "label": "Rani Pink",
        "hex": "#c2185b",
        "active": True,
    },
    "ivory": {
        "label": "Ivory",
        "hex": "#f5f5dc",
        "active": True,
    },
    "turquoise": {
        "label": "Turquoise",
        "hex": "#40e0d0",
        "active": True,
    },
    "ruby": {
        "label": "Ruby",
        "hex": "#9b111e",
        "active": True,
    },
    "wine": {
        "label": "Wine",
        "hex": "#722f37",
        "active": True,
    },
    "mint": {
        "label": "Mint",
        "hex": "#98ff98",
        "active": True,
    },
    "rama": {
        "label": "Rama",
        "hex": "#009B77",
        "active": True,
    },
    "blush": {
        "label": "Blush",
        "hex": "#de5d83",
        "active": True,
    },
    "lemon": {
        "label": "Lemon",
        "hex": "#fff44f",
        "active": True,
    },
    "lilac": {
        "label": "Lilac",
        "hex": "#c8a2c8",
        "active": True,
    },
    "navy": {
        "label": "Navy",
        "hex": "#000080",
        "active": True,
    },
    "gold": {
        "label": "Gold",
        "hex": "#ffd700",
        "active": True,
    },
    "silver": {
        "label": "Silver",
        "hex": "#c0c0c0",
        "active": True,
    },
    "multicolor": {
        "label": "Multicolour",
        "hex": "#b0b0b0",
        "active": True,
    },
    "pearl": {
        "label": "Pearl",
        "hex": "#f0ead6",
        "active": True,
    },
    "rose-gold": {
        "label": "Rose Gold",
        "hex": "#b76e79",
        "active": True,
    },
    "oxblood": {
        "label": "Oxblood",
        "hex": "#4a0000",
        "active": True,
    },
    "teal": {
        "label": "Teal",
        "hex": "#008080",
        "active": True,
    },
    "coral": {
        "label": "Coral",
        "hex": "#ff7f50",
        "active": True,
    },
}


def get_active_color_families() -> dict:
    """Return only active color families for dropdowns."""
    return {k: v for k, v in COLOR_FAMILIES.items() if v.get("active", True)}


def get_color_family(slug: str) -> dict | None:
    """Get a color family by slug."""
    return COLOR_FAMILIES.get(slug.lower())


def get_all_color_families() -> dict:
    """Return all color families (including inactive) for validation."""
    return COLOR_FAMILIES