# --- EDIT: Applying authentication to all employee endpoints ---

from fastapi import APIRouter, HTTPException, Query, Path, Depends # Import Depends
from typing import List, Optional
from app.models.employee_model import Employee, EmployeeStats
from app.services.database import db_service
# Import our security guard
from app.services.auth import get_current_user

router = APIRouter()

# --- Apply `user: dict = Depends(get_current_user)` to every route ---

@router.get("", response_model=List[Employee])
async def get_employees(
    role: Optional[str] = Query(None, description="Filter by employee role"),
    availability: Optional[str] = Query(None, description="Filter by availability"),
    user: dict = Depends(get_current_user)
):
    try:
        employees = db_service.get_all_employees()
        return employees
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@router.get("/stats", response_model=EmployeeStats)
async def get_employee_statistics(user: dict = Depends(get_current_user)):
    try:
        stats = db_service.get_employee_statistics()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting employee stats: {str(e)}")

@router.get("/{employee_id}", response_model=Employee)
async def get_employee(
    employee_id: str = Path(..., description="The ID of the employee to retrieve"),
    user: dict = Depends(get_current_user)
):
    try:
        employee = db_service.get_employee_by_id(employee_id)
        if not employee:
            raise HTTPException(status_code=404, detail=f"Employee with ID '{employee_id}' not found")
        return employee
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting employee {employee_id}: {str(e)}")
