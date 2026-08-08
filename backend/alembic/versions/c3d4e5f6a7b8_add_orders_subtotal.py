"""Add subtotal column to orders

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-08-07 00:10:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add orders.subtotal; backfill existing rows with total_amount."""
    with op.batch_alter_table("orders", schema=None) as batch_op:
        batch_op.add_column(sa.Column("subtotal", sa.Float(), nullable=False, server_default="0"))
    op.execute("UPDATE orders SET subtotal = total_amount")


def downgrade() -> None:
    """Drop orders.subtotal."""
    with op.batch_alter_table("orders", schema=None) as batch_op:
        batch_op.drop_column("subtotal")
