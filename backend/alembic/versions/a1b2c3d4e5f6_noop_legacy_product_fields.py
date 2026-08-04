"""No-op: legacy plant-specific product fields removed in the generic template.

Revision ID: a1b2c3d4e5f6
Revises: 322a87e1e369
Create Date: 2026-07-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '322a87e1e369'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # No-op: plant-specific columns removed in the generic e-commerce template.
    pass


def downgrade() -> None:
    pass
