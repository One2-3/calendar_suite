"""add user status fields

Revision ID: add_user_status_fields
Revises: c8a4d5924688
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_user_status_fields'
down_revision = 'c8a4d5924688'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'))
    op.add_column('users', sa.Column('is_banned', sa.Boolean(), nullable=False, server_default='0'))
    op.create_index(op.f('ix_users_is_active'), 'users', ['is_active'], unique=False)
    op.create_index(op.f('ix_users_is_banned'), 'users', ['is_banned'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_users_is_banned'), table_name='users')
    op.drop_index(op.f('ix_users_is_active'), table_name='users')
    op.drop_column('users', 'is_banned')
    op.drop_column('users', 'is_active')






