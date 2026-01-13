from fastapi import APIRouter, HTTPException, Query, Path, Depends, status
from typing import List, Optional
import uuid

# FIX: Import the new LeadCreate model
from app.models.lead_model import Lead, LeadStats, LeadCreate
from app.services.database import db_service
from app.services.auth import get_current_user

router = APIRouter()

# FIX: The create_lead function now uses the LeadCreate model for automatic validation.
# This is more secure and robust than manually parsing a request.
@router.post("", response_model=Lead, status_code=status.HTTP_201_CREATED)
async def create_lead(lead_data: LeadCreate, user: dict = Depends(get_current_user)):
    try:
        # Convert the Pydantic model to a dictionary that the database service can use.
        lead_dict = lead_data.model_dump()
        lead_dict['id'] = f"lead_{uuid.uuid4().hex[:10]}"
        
        new_lead = db_service.create_lead(lead_dict)
        if not new_lead:
            raise HTTPException(status_code=500, detail="Failed to create lead in database.")
        
        # The database returns a dictionary, which FastAPI will automatically
        # convert back into a `Lead` model for the response.
        return new_lead
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Error creating lead: {str(e)}")

# This endpoint is now correct and needs no changes.
@router.get("", response_model=List[Lead])
async def get_leads(
    status: Optional[str] = Query(None, description="Filter by lead stage"),
    source: Optional[str] = Query(None, description="Filter by lead source"),
    user: dict = Depends(get_current_user)
):
    try:
        leads = db_service.get_all_leads(status=status, source=source)
        return leads
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

# This endpoint is correct and needs no changes.
@router.get("/stats", response_model=LeadStats)
async def get_lead_statistics(user: dict = Depends(get_current_user)):
    try:
        stats = db_service.get_lead_statistics()
        if not stats:
            raise HTTPException(status_code=500, detail="Could not calculate lead statistics.")
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting lead stats: {str(e)}")

# The remaining endpoints for update, delete, and get-by-id need to be added.
# We will reuse the code from our successful implementation in `projects.py`

@router.get("/{lead_id}", response_model=Lead)
async def get_lead(
    lead_id: str = Path(..., description="The ID of the lead to retrieve"),
    user: dict = Depends(get_current_user)
):
    lead = db_service.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail=f"Lead with ID '{lead_id}' not found")
    return lead

# We use the full `Lead` model for updates, as the ID is already known.
@router.put("/{lead_id}", response_model=Lead)
async def update_lead(
    lead_id: str,
    lead_data: dict, # Using a generic dict for flexibility on updates
    user: dict = Depends(get_current_user)
):
    existing_lead = db_service.get_lead_by_id(lead_id)
    if not existing_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    updated_lead = db_service.update_lead(lead_id, lead_data)
    if not updated_lead:
        raise HTTPException(status_code=500, detail="Failed to update lead")
    return updated_lead

@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(
    lead_id: str,
    user: dict = Depends(get_current_user)
):
    success = db_service.delete_lead(lead_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Lead with ID '{lead_id}' not found.")
    return None

