from fastapi import APIRouter, HTTPException, Request, status, Depends
from app.database import get_supabase, get_supabase_admin
from app.models import RegisterRequest, LoginRequest, UserProfile
from app.auth import get_current_user

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest):
    supabase = get_supabase()
    admin_client = get_supabase_admin()

    try:
        auth_resp = supabase.auth.sign_up(
            {"email": payload.email, "password": payload.password}
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if not auth_resp.user:
        raise HTTPException(status_code=400, detail="Registration failed")

    user_id = auth_resp.user.id
    # Upsert profile row (created by trigger or manually)
    try:
        admin_client.table("profiles").upsert(
            {
                "id": user_id,
                "email": payload.email,
                "full_name": payload.full_name,
                "role": "user",
            }
        ).execute()
    except Exception:
        pass  # Profile may already exist via DB trigger

    return {
        "message": "Registration successful. Please check your email to confirm.",
        "user_id": user_id,
    }


@router.post("/login")
async def login(payload: LoginRequest):
    supabase = get_supabase()
    try:
        auth_resp = supabase.auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not auth_resp.session:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    session = auth_resp.session
    admin_client = get_supabase_admin()
    try:
        profile_resp = (
            admin_client.table("profiles")
            .select("*")
            .eq("id", auth_resp.user.id)
            .single()
            .execute()
        )
        profile = profile_resp.data or {}
    except Exception:
        profile = {}

    return {
        "access_token": session.access_token,
        "token_type": "bearer",
        "user": {
            "id": auth_resp.user.id,
            "email": auth_resp.user.email,
            "full_name": profile.get("full_name"),
            "role": profile.get("role", "user"),
        },
    }


@router.get("/me", response_model=UserProfile)
async def me(current_user: UserProfile = Depends(get_current_user)):
    return current_user
