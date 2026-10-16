"""Application settings."""

from __future__ import annotations

from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_name: str = "fastapi"
    app_version: str = "0.1.0"
    app_env: Literal["development", "production", "test"] = "development"
    log_format: Literal["text", "json"] = "text"
    cors_origins: list[str] = ["*"]
    database_url: str


settings = Settings()
