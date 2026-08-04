"""add_news_to_blogcategory

Revision ID: g1h2i3j4k5l6
Revises: 88048ae8077c
Create Date: 2026-08-04 10:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "g1h2i3j4k5l6"
down_revision: Union[str, Sequence[str], None] = "88048ae8077c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostgreSQL requires ALTER TYPE to add a new enum value.
    # This is a no-op on SQLite (used in dev/tests) because SQLite
    # stores enums as VARCHAR and doesn't enforce enum constraints.
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TYPE blogcategory ADD VALUE IF NOT EXISTS 'NEWS'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values natively.
    # A full type recreation would be needed; skipping for safety.
    pass
