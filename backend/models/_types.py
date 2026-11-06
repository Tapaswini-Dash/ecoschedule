from sqlalchemy import Enum as SAEnum


def enum_col(enum_cls):
    """Store enums as plain strings (no native PG enum), easier for Alembic later."""
    return SAEnum(
        enum_cls,
        native_enum=False,
        length=20,
        values_callable=lambda e: [m.value for m in e],
    )
