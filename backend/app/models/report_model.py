from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

class ReportCreate(BaseModel):
    """Defines the data required from the user to create a new report."""
    name: str = Field(..., description="The name for the new report")
    type: str = Field(..., description="The type of report, e.g., 'Executive Summary'")
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "name": "Q4 Financial Summary",
                "type": "Executive Summary"
            }
        }

class Report(BaseModel):
    """
    Defines the final structure of a Report record as returned to the user.
    This model now perfectly aligns with the database schema and frontend expectations.
    """
    id: str
    name: str 
    type: str
    status: str
    generated_on: date
    generated_by: Optional[str] = None
    download_url: Optional[str] = Field(None, description="Public URL to the generated PDF in Supabase Storage")
    
    class Config:
        from_attributes = True
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "rep_a1b2c3d4",
                "name": "Monthly Sales Funnel Analysis - September",
                "type": "Sales Funnel",
                "status": "Success",
                "generated_on": "2025-10-02",
                "generated_by": "Anjali Joshi",
                "download_url": "https://<...>.supabase.co/storage/v1/object/public/reports/generated/rep_a1b2c3d4.pdf"
            }
        }
