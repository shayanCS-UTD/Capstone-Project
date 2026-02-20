from fastapi import APIRouter, HTTPException, Depends
from app.database import get_supabase_admin
from app.models import AuditLogResponse, UserProfile
from app.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=list[AuditLogResponse])
async def get_logs(current_user: UserProfile = Depends(get_current_user)):
    admin_client = get_supabase_admin()
    try:
        if current_user.role == "admin":
            resp = (
                admin_client.table("audit_logs")
                .select("*")
                .order("created_at", desc=True)
                .execute()
            )
        else:
            # Only logs for requests owned by this user
            requests_resp = (
                admin_client.table("requests")
                .select("id")
                .eq("requester_id", current_user.id)
                .execute()
            )
            request_ids = [r["id"] for r in (requests_resp.data or [])]
            if not request_ids:
                return []
            resp = (
                admin_client.table("audit_logs")
                .select("*")
                .in_("request_id", request_ids)
                .order("created_at", desc=True)
                .execute()
            )

        return [
            AuditLogResponse(
                id=row["id"],
                request_id=row["request_id"],
                action=row["action"],
                performed_by=row["performed_by"],
                performed_by_role=row["performed_by_role"],
                details=row.get("details"),
                created_at=row.get("created_at"),
            )
            for row in (resp.data or [])
        ]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
