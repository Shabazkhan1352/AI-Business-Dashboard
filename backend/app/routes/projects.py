from fastapi import APIRouter, HTTPException, status, Depends, Body, Path, Query
from typing import List, Optional
from app.services.database import db_service
from app.models.project_model import Project
import uuid

# This import is the security guard for our routes
from app.services.auth import get_current_user

router = APIRouter()

# --- FIX 1 of 2: The POST endpoint ---
# We change the function signature to let FastAPI handle validation automatically.
# This is a more robust and standard way to work with Pydantic models.
@router.post("", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(project: Project, user: dict = Depends(get_current_user)):
    """
    Creates a new project. FastAPI will automatically validate the incoming JSON
    against the `Project` model using its aliases ('name', 'client', etc.).
    """
    try:
        # The `.model_dump(by_alias=True)` method is the key fix. It creates a dictionary
        # using the model's aliases (e.g., 'name', 'client'), which match your
        # Supabase database columns exactly.
        project_data = project.model_dump(by_alias=True)
        
        # We manually add a new ID for the project, as before.
        project_data['id'] = f"proj_{uuid.uuid4().hex[:12]}"
        
        new_proj = db_service.create_project(project_data)
        
        if not new_proj:
            raise HTTPException(status_code=500, detail="Failed to create project in database")
        return new_proj
    except Exception as e:
        # This will catch any other unexpected errors during the process.
        raise HTTPException(status_code=422, detail=f"Error processing project data: {str(e)}")

# --- FIX 2 of 2: The PUT endpoint ---
# We apply a similar fix here to ensure updates also use the correct column names.
@router.put("/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    project_data: dict = Body(...),
    user: dict = Depends(get_current_user)
):
    """
    Updates an existing project.
    """
    if not db_service.get_project_by_id(project_id):
        raise HTTPException(status_code=404, detail="Project not found")

    # We manually map the frontend field names (aliases) to the database column names
    # to ensure the update payload is correct.
    update_payload = {}
    if 'name' in project_data:
        update_payload['name'] = project_data['name']

    if 'start_date' in project_data:
        update_payload['start_date'] = project_data['start_date']    
    if 'client' in project_data:
        update_payload['client'] = project_data['client']
    if 'completion' in project_data:
        update_payload['completion_pct'] = project_data['completion']
    if 'deadline' in project_data:
        update_payload['deadline'] = project_data['deadline']
    if 'budget' in project_data:
        update_payload['budget'] = project_data['budget']
    
    updated_project = db_service.update_project(project_id, update_payload)
    if not updated_project:
        raise HTTPException(status_code=500, detail="Failed to update project")
    return updated_project

# --- The GET and DELETE endpoints remain unchanged, but are included for completeness ---

@router.get("", response_model=List[Project])
async def get_projects(
    status: Optional[str] = Query(None),
    client: Optional[str] = Query(None),
    user: dict = Depends(get_current_user)
):
    try:
        projects = db_service.get_all_projects(status=status, client=client)
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@router.get("/stats")
async def get_project_stats(user: dict = Depends(get_current_user)):
    try:
        stats = db_service.get_project_statistics()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: str = Path(...), user: dict = Depends(get_current_user)):
    project = db_service.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project not found")
    return project

@router.get("/{project_id}/analytics")
async def get_project_analytics(project_id: str = Path(...), user: dict = Depends(get_current_user)):
    project = db_service.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project with ID '{project_id}' not found")

    completion = project.get('completion_pct', 0) or 0
    budget = project.get('budget', 0) or 0
    budget_used = round((budget * completion) / 100, 2)
    return {
        "project_id": project_id,
        "project_name": project.get('name'), # Match db column
        "completion_percentage": completion,
        "status": project.get('status'),
        "budget_total": budget,
        "budget_utilized": budget_used,
        "budget_remaining": budget - budget_used,
        "client_name": project.get('client'), # Match db column
        "risk_level": "High" if completion < 50 and project.get('status') not in ['Completed', 'On Track'] else "Low"
    }

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    user: dict = Depends(get_current_user)
):
    success = db_service.delete_project(project_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Project with ID '{project_id}' not found.")
    return None

