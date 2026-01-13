from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Employee(BaseModel):
    """
    This Pydantic model defines the structure for an Employee.
    The 'created_at' field has been removed to match the source data.
    """
    id: str = Field(..., description="Unique employee ID from Supabase")

    # --- Field Aliases to match Supabase's returned JSON keys ---
    emp_name: str = Field(..., alias='name', description="Name of the employee")
    role: str = Field(..., alias='role', description="The employee's job title")
    tasks_completed: int = Field(..., alias='tasks_completed', description="Total tasks completed")
    efficiency: float = Field(..., alias='efficiency', description="Employee efficiency score")
    availability: str = Field(..., alias='availability', description="Current availability status")

    manager: Optional[str] = Field(None, description="The employee's manager")
    email: Optional[str] = Field(None, description="The employee's email address")

    class Config:
        populate_by_name = True
        from_attributes = True

class EmployeeStats(BaseModel):
    """
    Defines the structure for the employee statistics response.
    """
    total_employees: int
    average_efficiency: float
    total_tasks_completed: int

