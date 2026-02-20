from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import get_supabase_admin
from app.models import UserProfile

security = HTTPBearer(auto_error=False)


async def get_current_user(request: Request) -> UserProfile:
    """Dependency: require authenticated user. Raises 401 if missing/invalid."""
    credentials: HTTPAuthorizationCredentials | None = await security(request)
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return await _resolve_user(credentials.credentials)


async def get_optional_user(request: Request) -> UserProfile | None:
    """Dependency: return user if authenticated, else None."""
    credentials: HTTPAuthorizationCredentials | None = await security(request)
    if not credentials:
        return None
    try:
        return await _resolve_user(credentials.credentials)
    except HTTPException:
        return None


async def get_admin_user(request: Request) -> UserProfile:
    """Dependency: require admin role."""
    user = await get_current_user(request)
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


async def _resolve_user(token: str) -> UserProfile:
    """Verify token with Supabase and return enriched profile."""
    admin_client = get_supabase_admin()
    try:
        response = admin_client.auth.get_user(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    if not response or not response.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    supabase_user = response.user
    # Fetch extended profile (role, full_name)
    try:
        profile_resp = (
            admin_client.table("profiles")
            .select("*")
            .eq("id", supabase_user.id)
            .single()
            .execute()
        )
        profile_data = profile_resp.data or {}
    except Exception:
        profile_data = {}

    return UserProfile(
        id=supabase_user.id,
        email=supabase_user.email or profile_data.get("email", ""),
        full_name=profile_data.get("full_name"),
        role=profile_data.get("role", "user"),
        created_at=profile_data.get("created_at"),
    )
