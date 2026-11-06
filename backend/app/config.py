from pydantic import EmailStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_ignore_empty=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "EcoSchedule API"
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CORS_ORIGINS: str = "http://localhost:5173"
    SEED_ADMIN_EMAIL: EmailStr
    SEED_ADMIN_PASSWORD: str
    DEMO_COLLECTOR_RASHMI_PASSWORD: str | None = None
    DEMO_COLLECTOR_MEHTA_PASSWORD: str | None = None

    @field_validator("DATABASE_URL")
    @classmethod
    def require_postgresql(cls, value: str) -> str:
        if not value.startswith(("postgresql://", "postgresql+psycopg2://")):
            raise ValueError("DATABASE_URL must point to PostgreSQL")
        if "YOUR_DB_USER" in value or "URL_ENCODED_PASSWORD" in value:
            raise ValueError("Replace the PostgreSQL username and password placeholders in DATABASE_URL")
        return value

    @field_validator("SECRET_KEY")
    @classmethod
    def require_strong_secret(cls, value: str) -> str:
        if (
            len(value) < 32
            or value.lower() in {"change-me-use-a-long-random-string", "dev-secret-key-change-me"}
            or "GENERATE_A_RANDOM_SECRET" in value
        ):
            raise ValueError("SECRET_KEY must be a unique random value of at least 32 characters")
        return value

    @field_validator("SEED_ADMIN_PASSWORD")
    @classmethod
    def require_non_default_admin_password(cls, value: str) -> str:
        if len(value) < 12 or value == "ChangeMe123!" or "SET_A_UNIQUE_PASSWORD" in value:
            raise ValueError("SEED_ADMIN_PASSWORD must be at least 12 characters and not the development default")
        return value

    @field_validator("DEMO_COLLECTOR_RASHMI_PASSWORD", "DEMO_COLLECTOR_MEHTA_PASSWORD")
    @classmethod
    def validate_demo_collector_password(cls, value: str | None) -> str | None:
        if value is not None and (len(value) < 8 or len(value.encode()) > 72):
            raise ValueError("Demo collector passwords must be at least 8 characters and at most 72 UTF-8 bytes")
        return value

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()