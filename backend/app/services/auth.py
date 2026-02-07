from fastapi import HTTPException, Request, status

from app.services.database import supabase


async def get_current_user(request: Request) -> dict:
    """Validate Supabase JWT. Supports local development fallback via X-Dev-User header."""
    auth_header = request.headers.get("Authorization")
    dev_user = request.headers.get("X-Dev-User")

    if dev_user:
        return {"email": dev_user, "mode": "dev"}

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated: Authorization header is missing or malformed.",
        )

    token = auth_header.split(" ", 1)[1]

    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is unavailable. Configure Supabase credentials.",
        )

    try:
        response = supabase.auth.get_user(token)
        user = response.user
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
        return user.dict()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid credentials: {exc}",
        )
