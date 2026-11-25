"""User session table (one row per active login token)."""

from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user_login import UserLogin

SESSION_LIFETIME = timedelta(hours=24)


def _default_expiry() -> datetime:
    return datetime.now(timezone.utc) + SESSION_LIFETIME


class UserSession(Base):
    __tablename__ = "user_session"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user_login.id", ondelete="CASCADE"), index=True
    )
    token: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, default=lambda: secrets.token_urlsafe(32)
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_default_expiry
    )
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_revoked: Mapped[bool] = mapped_column(default=False)

    user: Mapped[UserLogin] = relationship(back_populates="sessions")
