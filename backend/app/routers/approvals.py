from fastapi import APIRouter, HTTPException, Depends, status
from app.database import get_supabase_admin
from app.models import (
    RequestResponse,
    ApprovalAction,
    RejectionAction,
    UserProfile,
    AuditAction,
    RequestStatus,
)
from app.auth import get_admin_user
from app.routers.requests import _serialize, _write_audit_log, _now
import uuid

router = APIRouter()


@router.get("/requests", response_model=list[RequestResponse])
async def list_pending_requests(
    current_admin: UserProfile = Depends(get_admin_user),
):
    """Return all requests that are PENDING or ESCALATED (admin only)."""
    admin_client = get_supabase_admin()
    try:
        resp = (
            admin_client.table("requests")
            .select("*")
            .in_("status", ["PENDING", "ESCALATED"])
            .order("created_at", desc=True)
            .execute()
        )
        return [_serialize(r) for r in (resp.data or [])]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/requests/{request_id}/approve", response_model=RequestResponse)
async def approve_request(
    request_id: str,
    payload: ApprovalAction,
    current_admin: UserProfile = Depends(get_admin_user),
):
    admin_client = get_supabase_admin()
    row = _fetch_or_404(admin_client, request_id)

    if row["status"] not in ("PENDING", "ESCALATED"):
        raise HTTPException(
            status_code=400, detail="Only PENDING or ESCALATED requests can be approved"
        )

    update_data = {
        "status": RequestStatus.APPROVED.value,
        "decided_by": current_admin.email,
        "decision_reason": payload.reason or "Approved by admin",
        "updated_at": _now(),
    }
    try:
        resp = (
            admin_client.table("requests")
            .update(update_data)
            .eq("id", request_id)
            .execute()
        )
        updated = resp.data[0]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    _write_audit_log(
        admin_client,
        request_id=request_id,
        action=AuditAction.APPROVED.value,
        performed_by=current_admin.email,
        performed_by_role="admin",
        details={"reason": payload.reason},
    )

    return _serialize(updated)


@router.put("/requests/{request_id}/reject", response_model=RequestResponse)
async def reject_request(
    request_id: str,
    payload: RejectionAction,
    current_admin: UserProfile = Depends(get_admin_user),
):
    admin_client = get_supabase_admin()
    row = _fetch_or_404(admin_client, request_id)

    if row["status"] not in ("PENDING", "ESCALATED"):
        raise HTTPException(
            status_code=400, detail="Only PENDING or ESCALATED requests can be rejected"
        )

    update_data = {
        "status": RequestStatus.REJECTED.value,
        "decided_by": current_admin.email,
        "decision_reason": payload.reason,
        "updated_at": _now(),
    }
    try:
        resp = (
            admin_client.table("requests")
            .update(update_data)
            .eq("id", request_id)
            .execute()
        )
        updated = resp.data[0]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    _write_audit_log(
        admin_client,
        request_id=request_id,
        action=AuditAction.REJECTED.value,
        performed_by=current_admin.email,
        performed_by_role="admin",
        details={"reason": payload.reason},
    )

    return _serialize(updated)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _fetch_or_404(client, request_id: str) -> dict:
    try:
        resp = (
            client.table("requests")
            .select("*")
            .eq("id", request_id)
            .single()
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=404, detail="Request not found")
        return resp.data
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=404, detail="Request not found")
