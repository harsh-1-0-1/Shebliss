"""No-op: legacy plant-specific product fields removed in the generic template.

Revision ID: d5e6f7a8b9c0
Revises: e3b51137e8ce
Create Date: 2026-07-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd5e6f7a8b9c0'
down_revision: Union[str, Sequence[str], None] = 'e3b51137e8ce'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # No-op: plant-specific column was never added in the generic template.
    pass


def downgrade() -> None:
    pass
