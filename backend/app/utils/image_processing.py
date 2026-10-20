"""Server-side image processing: WebP conversion and responsive thumbnail generation.

When a product image is uploaded it is:
1. Converted to WebP (25-50% smaller than JPEG/PNG at equivalent quality).
2. Downscaled to a maximum width for the "base" image (1600px; 2400px for
   product photos so zoom stays sharp on high-density phone screens).
3. Thumbnail variants generated at 400, 800, and 1200px widths.

Variant files are named by convention so the frontend can derive them from the
base URL without extra API calls:

  base:     store/products/42/{uuid}.webp
  variants: store/products/42/{uuid}_400w.webp, _800w.webp, _1200w.webp

The frontend builds a responsive ``srcset`` from these, letting the browser pick
the smallest image that still looks crisp for the viewport — a product card
thumbnail downloads a 50 KB 400w file instead of a 2 MB original.
"""

import io
from dataclasses import dataclass

from loguru import logger
from PIL import Image, ImageOps

# Maximum width for the base (full-size) image. Larger originals are downscaled.
MAX_BASE_WIDTH = 1600

# Product photos keep more detail for the zoom and fullscreen viewer.
PRODUCT_MAX_BASE_WIDTH = 2400
PRODUCT_BASE_QUALITY = 85

# Responsive thumbnail widths in pixels. These match the srcset descriptors
# the frontend uses. Variants are only downscaled, never upscaled.
VARIANT_WIDTHS: list[int] = [400, 800, 1200]

# WebP quality (0-100). 82 is a good balance for product photography.
WEBP_QUALITY = 82

# WebP encoding effort (0-6). Higher = better compression, slower encode.
WEBP_METHOD = 4


@dataclass
class ProcessedImage:
    """Result of processing an uploaded image."""

    base_bytes: bytes
    base_width: int
    variants: dict[int, bytes]  # target width -> webp bytes


def _save_webp(img: Image.Image, quality: int = WEBP_QUALITY) -> bytes:
    """Encode a PIL Image to WebP bytes."""
    output = io.BytesIO()
    img.save(output, format="WEBP", quality=quality, method=WEBP_METHOD)
    return output.getvalue()


def _resize_to_width(img: Image.Image, target_width: int) -> Image.Image:
    """Resize image to *target_width*, keeping aspect ratio. Never upscales."""
    if img.width <= target_width:
        return img
    new_height = round(img.height * target_width / img.width)
    return img.resize((target_width, new_height), Image.LANCZOS)


def process_image_upload(
    image_bytes: bytes,
    max_base_width: int = MAX_BASE_WIDTH,
    base_quality: int = WEBP_QUALITY,
) -> ProcessedImage | None:
    """Convert an uploaded image to WebP and generate responsive variants.

    Returns ``ProcessedImage`` with base + variant bytes, or ``None`` if the
    image could not be opened (caller should store the original bytes as-is).
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
    except Exception as exc:
        logger.warning("Could not open image with Pillow, will store as-is: {}", exc)
        return None

    # Auto-rotate based on EXIF data (important for mobile photos)
    img = ImageOps.exif_transpose(img)

    # Normalize color mode — preserve alpha for PNGs with transparency
    has_alpha = img.mode in ("RGBA", "LA") or (
        img.mode == "P" and "transparency" in img.info
    )
    img = img.convert("RGBA" if has_alpha else "RGB")

    # Base image (capped at max_base_width)
    base_img = _resize_to_width(img, max_base_width)
    base_bytes = _save_webp(base_img, base_quality)

    # Responsive variants
    variants: dict[int, bytes] = {}
    for width in VARIANT_WIDTHS:
        variant_img = _resize_to_width(img, width)
        variants[width] = _save_webp(variant_img)

    logger.info(
        "Processed image: base {}px, {} variants",
        base_img.width,
        len(variants),
    )
    return ProcessedImage(
        base_bytes=base_bytes,
        base_width=base_img.width,
        variants=variants,
    )
