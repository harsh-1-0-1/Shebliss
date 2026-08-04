"""No-op: legacy plant-specific product fields removed in the generic template.

Revision ID: d4e5f6a7b8c9
Revises: 88ec900b98a3
Create Date: 2026-07-29 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = '88ec900b98a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # No-op: plant-specific column removed in the generic e-commerce template.
    pass


def downgrade() -> None:
    pass
