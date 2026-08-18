"""add_products_tag_to_banners

Revision ID: 5b4f9c2d7e1a
Revises: 9d3a5f1c2b8e
Create Date: 2026-08-17 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '5b4f9c2d7e1a'
down_revision: Union[str, Sequence[str], None] = '9d3a5f1c2b8e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'banners',
        sa.Column('products_tag', sa.String(length=100), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('banners', 'products_tag')