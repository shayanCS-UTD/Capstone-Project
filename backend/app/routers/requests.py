from fastapi import APIRouter, HTTPException, Depends, status
from app.database import get_supabase_admin
from app.models import (
    RequestCreate,
    RequestResponse,
    UserProfile,
    RequestStatus,
    RiskLevel,
    AuditAction,
)
from app.auth import get_current_user
from app.risk_engine import classify_risk
from datetime import datetime, timezone
import uuid

router = APIRouter()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/", response_model=RequestResponse, status_code=status.HTTP_201_CREATED)
async def create_request(
    payload: RequestCreate,
    current_user: UserProfile = Depends(get_current_user),
):
    admin_client = get_supabase_admin()
    risk = classify_risk(payload.title, payload.description)

    # Determine initial status based on risk level
    if risk.risk_level == RiskLevel.LOW:
        initial_status = RequestStatus.APPROVED
        audit_action = AuditAction.AUTO_APPROVED
    else:
        initial_status = RequestStatus.ESCALATED
        audit_action = AuditAction.ESCALATED

    request_id = str(uuid.uuid4())
    request_data = {
        "id": request_id,
        "title": payload.title,
        "description": payload.description,
        "request_type": payload.request_type.value,
        "requester_id": current_user.id,
        "requester_email": current_user.email,
        "status": initial_status.value,
        "risk_level": risk.risk_level.value,
        "risk_score": risk.risk_score,
        "risk_factors": risk.risk_factors,
        "created_at": _now(),
        "updated_at": _now(),
    }

    if initial_status == RequestStatus.APPROVED:
        request_data["decided_by"] = "system"
        request_data["decision_reason"] = "Auto-approved: low risk classification"

    try:
        resp = admin_client.table("requests").insert(request_data).execute()
        created = resp.data[0]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to create request: {exc}")

    # Write audit log
    audit_details: dict = {
        "risk_level": risk.risk_level.value,
        "risk_score": risk.risk_score,
        "risk_factors": risk.risk_factors,
    }
    _write_audit_log(
        admin_client,
        request_id=request_id,
        action=audit_action.value,
        performed_by=current_user.email,
        performed_by_role=current_user.role,
        details=audit_details,
    )

    # Also write SUBMITTED log
    _write_audit_log(
        admin_client,
        request_id=request_id,
        action=AuditAction.SUBMITTED.value,
        performed_by=current_user.email,
        performed_by_role=current_user.role,
        details={"request_type": payload.request_type.value},
    )

    return _serialize(created)


@router.get("/", response_model=list[RequestResponse])
async def list_my_requests(
    current_user: UserProfile = Depends(get_current_user),
):
    admin_client = get_supabase_admin()
    try:
        resp = (
            admin_client.table("requests")
            .select("*")
            .eq("requester_id", current_user.id)
            .order("created_at", desc=True)
            .execute()
        )
        return [_serialize(r) for r in (resp.data or [])]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{request_id}", response_model=RequestResponse)
async def get_request(
    request_id: str,
    current_user: UserProfile = Depends(get_current_user),
):
    admin_client = get_supabase_admin()
    try:
        resp = (
            admin_client.table("requests")
            .select("*")
            .eq("id", request_id)
            .single()
            .execute()
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Request not found")

    row = resp.data
    if not row:
        raise HTTPException(status_code=404, detail="Request not found")

    if current_user.role != "admin" and row["requester_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return _serialize(row)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _serialize(row: dict) -> RequestResponse:
    return RequestResponse(
        id=row["id"],
        title=row["title"],
        description=row["description"],
        request_type=row["request_type"],
        requester_id=row["requester_id"],
        requester_email=row["requester_email"],
        status=row["status"],
        risk_level=row["risk_level"],
        risk_score=row["risk_score"],
        risk_factors=row.get("risk_factors") or [],
        decision_reason=row.get("decision_reason"),
        decided_by=row.get("decided_by"),
        created_at=row.get("created_at"),
        updated_at=row.get("updated_at"),
    )


def _write_audit_log(client, *, request_id, action, performed_by, performed_by_role, details=None):
    try:
        client.table("audit_logs").insert(
            {
                "id": str(uuid.uuid4()),
                "request_id": request_id,
                "action": action,
                "performed_by": performed_by,
                "performed_by_role": performed_by_role,
                "details": details,
                "created_at": _now(),
            }
        ).execute()
    except Exception:
        pass  # Audit failures should not block main flow
