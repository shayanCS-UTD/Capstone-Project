from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID
from enum import Enum


# ── Enums ────────────────────────────────────────────────────────────────────

class RequestType(str, Enum):
    room_booking = "room_booking"
    access_permission = "access_permission"
    equipment_checkout = "equipment_checkout"
    other = "other"


class RequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ESCALATED = "ESCALATED"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class AuditAction(str, Enum):
    SUBMITTED = "SUBMITTED"
    AUTO_APPROVED = "AUTO_APPROVED"
    ESCALATED = "ESCALATED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


# ── Auth Models ───────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str = "user"
    created_at: Optional[datetime] = None


# ── Request Models ────────────────────────────────────────────────────────────

class RequestCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    request_type: RequestType


class RequestResponse(BaseModel):
    id: str
    title: str
    description: str
    request_type: str
    requester_id: str
    requester_email: str
    status: str
    risk_level: str
    risk_score: int
    risk_factors: List[str]
    decision_reason: Optional[str] = None
    decided_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class RiskAnalysis(BaseModel):
    risk_level: RiskLevel
    risk_score: int
    risk_factors: List[str]


# ── Approval Models ───────────────────────────────────────────────────────────

class ApprovalAction(BaseModel):
    reason: Optional[str] = None


class RejectionAction(BaseModel):
    reason: str = Field(..., min_length=5)


# ── Audit Log Models ──────────────────────────────────────────────────────────

class AuditLogResponse(BaseModel):
    id: str
    request_id: str
    action: str
    performed_by: str
    performed_by_role: str
    details: Optional[Any] = None
    created_at: Optional[datetime] = None
