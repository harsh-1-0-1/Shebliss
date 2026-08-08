"""Add coupons table and order discount columns

Revision ID: b2c3d4e5f6a7
Revises: a9c8b7d6e5f4
Create Date: 2026-08-07 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a9c8b7d6e5f4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create coupons table and add discount columns to orders."""
    op.create_table(
        "coupons",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column(
            "discount_type",
            sa.Enum("percent", "fixed", name="coupontype"),
            nullable=False,
        ),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("min_order_amount", sa.Float(), nullable=False),
        sa.Column("max_discount_amount", sa.Float(), nullable=True),
        sa.Column("usage_limit", sa.Integer(), nullable=True),
        sa.Column("times_used", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("valid_from", sa.DateTime(timezone=True), nullable=True),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_coupons_code"),
    )
    with op.batch_alter_table("coupons", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_coupons_id"), ["id"], unique=False)
        batch_op.create_index(batch_op.f("ix_coupons_code"), ["code"], unique=True)

    with op.batch_alter_table("orders", schema=None) as batch_op:
        batch_op.add_column(sa.Column("coupon_code", sa.String(length=50), nullable=True))
        batch_op.add_column(
            sa.Column("discount_amount", sa.Float(), nullable=False, server_default="0")
        )


def downgrade() -> None:
    """Drop coupons table and order discount columns."""
    with op.batch_alter_table("orders", schema=None) as batch_op:
        batch_op.drop_column("discount_amount")
        batch_op.drop_column("coupon_code")

    with op.batch_alter_table("coupons", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_coupons_code"))
        batch_op.drop_index(batch_op.f("ix_coupons_id"))

    op.drop_table("coupons")
    # Drop the enum type (PostgreSQL only — SQLite ignores this)
    op.execute("DROP TYPE IF EXISTS coupontype")
