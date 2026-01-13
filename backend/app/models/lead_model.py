from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# NEW: A model specifically for CREATING leads.
# It includes only the fields the user should provide.
class LeadCreate(BaseModel):
    name: str = Field(..., description="Name of the lead")
    source: str = Field(..., description="The source of the lead")
    stage: Optional[str] = Field("Prospect", description="Current stage in the sales funnel")
    value: int = Field(..., description="Potential revenue from the lead")
    status: str = Field("Active", description="Current status of the lead")
    owner: Optional[str] = Field(None, description="The sales representative owning the lead")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "New Website for TechCorp",
                "source": "Referral",
                "value": 50000,
                "status": "Active",
                "owner": "Jane Doe"
            }
        }

# This is the main Lead model, representing a full lead record from the database.
class Lead(BaseModel):
    id: str = Field(..., description="Unique lead ID from Supabase")
    name: str = Field(..., description="Name of the lead")
    source: Optional[str] = Field(None, description="The source of the lead")
    stage: Optional[str] = Field(None, description="Current stage in the sales funnel")
    value: Optional[int] = Field(None, description="Potential revenue from the lead")
    status: Optional[str] = Field(None, description="Current status of the lead")
    owner: Optional[str] = Field(None, description="The sales representative owning the lead")
    created_at: Optional[datetime] = Field(None, description="Timestamp of creation")
    updated_at: Optional[datetime] = Field(None, description="Timestamp of last update")

    class Config:
        from_attributes = True # Allows creating this model from a database object

# This model is for the statistics endpoint and remains unchanged.
class LeadStats(BaseModel):
    total_leads: int
    active_leads: int
    won_leads: int
    lost_leads: int
    pipeline_value: int
    total_revenue: int
    conversion_rate: float

