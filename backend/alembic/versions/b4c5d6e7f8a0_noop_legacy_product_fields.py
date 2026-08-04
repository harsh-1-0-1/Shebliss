"""No-op: legacy plant-specific product fields removed in the generic template.

Revision ID: b4c5d6e7f8a0
Revises: a3b4c5d6e7f8
Create Date: 2026-07-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b4c5d6e7f8a0'
down_revision: Union[str, Sequence[str], None] = 'a3b4c5d6e7f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # No-op: plant-specific column removed in the generic e-commerce template.
    pass


def downgrade() -> None:
    pass
