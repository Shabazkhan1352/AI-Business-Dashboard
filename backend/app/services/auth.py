# --- This file is brand new. It contains our security logic. ---

from fastapi import Request, HTTPException, status
from app.services.database import supabase # We import the Supabase client you already configured.

async def get_current_user(request: Request) -> dict:
    """
    This function is a FastAPI dependency that acts as a security guard.
    It inspects the incoming request for a valid Supabase JWT (session token).

    If the token is valid, it returns the user's data.
    If the token is missing or invalid, it raises an HTTP 401 Unauthorized error,
    immediately stopping the request from proceeding.
    """
    # 1. Extract the Authorization header from the incoming request.
    auth_header = request.headers.get("Authorization")
    
    # 2. Check if the header is missing or doesn't start with "Bearer ".
    # This is the standard format for sending JWTs.
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated: Authorization header is missing or malformed."
        )
    
    # 3. Isolate the token from the "Bearer " prefix.
    token = auth_header.split(" ")[1]
    
    try:
        # 4. Use the Supabase client to validate the token.
        # This is a secure server-to-server call to Supabase to verify the user's session.
        response = supabase.auth.get_user(token)
        user = response.user
        
        if not user:
            # This case handles if the token is valid but the user doesn't exist.
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
            
        # 5. If successful, return the user object. The request can now proceed.
        return user.dict()
        
    except Exception as e:
        # 6. If `get_user` fails (e.g., token is expired or invalid), it throws an error.
        # We catch it and raise our own 401 error.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid credentials: {str(e)}"
        )
