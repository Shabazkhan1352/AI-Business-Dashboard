import time
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
# --- FIX: Import the utility to generate the OpenAPI schema ---
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel, Field

# Routers for all application modules
from app.routes import projects, leads, employees, reports
# The single service for all database interactions
from app.services.database import db_service
# Import the AI generation function
from app.services.ai_module import generate_deep_dive_insights, generate_copilot_response
# Import our security guard
from app.services.auth import get_current_user

# --- App Initialization (Unchanged) ---
app = FastAPI(
    title="AI Business Dashboard API",
    description="""
    ## Advanced API for AI-Powered Business Insights & Workflow Dashboard

    This API provides comprehensive business management capabilities including:

    * **Projects Management** - Full CRUD operations with analytics
    * **Leads Management** - Complete lead tracking and conversion analytics
    * **Employee Management** - Staff performance and availability tracking
    * **Statistics & Analytics** - Real-time business metrics from the live database
    * **Data Validation** - Robust input validation and error handling
    * **Performance Monitoring** - Request timing and health checks

    ### Key Endpoints:
    * `GET /health` - Check the health of the API.
    * `GET /api/projects` - Get all projects.
    * `GET /api/leads` - Get all leads.
    * `GET /api/employees` - Get all employees.
    * `GET /api/reports` - Get report history.
    """,
    version="1.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    contact={
        "name": "AI Business Dashboard Team",
        "email": "support@ai-dashboard.com",
    },
)

# --- Middleware Configuration (Unchanged) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time"]
)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Adds a custom X-Process-Time header to all responses."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}"
    return response

# --- Routers (Unchanged) ---
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"], responses={404: {"description": "Project not found"}})
app.include_router(leads.router, prefix="/api/leads", tags=["Leads"], responses={404: {"description": "Lead not found"}})
app.include_router(employees.router, prefix="/api/employees", tags=["Employees"], responses={404: {"description": "Employee not found"}})
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"], responses={404: {"description": "Report not found"}})

# --- API Endpoints (Unchanged) ---

class CopilotRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=1000)


@app.post("/api/ai/copilot", tags=["AI Insights"])
async def ai_copilot_chat(payload: CopilotRequest, user: dict = Depends(get_current_user)):
    try:
        all_projects = db_service.get_all_projects()
        all_leads = db_service.get_all_leads()
        all_employees = db_service.get_all_employees()
        return generate_copilot_response(payload.question, all_projects, all_leads, all_employees)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Copilot error: {exc}")

@app.post("/api/insights/deep-dive", tags=["AI Insights"])
async def get_deep_dive_ai_insights(user: dict = Depends(get_current_user)):
    try:
        all_projects = db_service.get_all_projects()
        all_leads = db_service.get_all_leads()
        all_employees = db_service.get_all_employees()

        insights = generate_deep_dive_insights(
            projects=all_projects,
            leads=all_leads,
            employees=all_employees
        )
        
        if "error" in insights:
             raise HTTPException(status_code=500, detail=insights["error"])

        return insights
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@app.get("/", tags=["System"])
def read_root():
    return {
        "message": "Welcome to the AI Business Dashboard API",
        "version": "1.1.0",
        "status": "running",
        "documentation": { "swagger_ui": "/docs", "redoc": "/redoc" }
    }

@app.get("/health", tags=["System"])
def health_check():
    db_status = "connected" if db_service else "disconnected"
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": { "database": db_status, "api": "active" }
    }

@app.get("/api/metrics", tags=["System"])
async def get_api_metrics(user: dict = Depends(get_current_user)):
    try:
        project_stats = db_service.get_project_statistics()
        lead_stats = db_service.get_lead_statistics()
        employee_stats = db_service.get_employee_statistics()
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "database_metrics": {
                "project_stats": project_stats,
                "lead_stats": lead_stats,
                "employee_stats": employee_stats,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving API metrics: {str(e)}")

# --- THIS IS THE FIX FOR SWAGGER UI ---
# This function customizes the auto-generated OpenAPI (Swagger) documentation.
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    # Generate the default schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Add the security scheme definition for JWT Bearer tokens
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter your bearer token in the format: Bearer &lt;token&gt;"
        }
    }

    # Apply the security requirement to all protected API routes
    for path in openapi_schema["paths"]:
        if path.startswith("/api/"):
            for method in openapi_schema["paths"][path]:
                openapi_schema["paths"][path][method]["security"] = [{"BearerAuth": []}]
                
    app.openapi_schema = openapi_schema
    return app.openapi_schema

# Assign the custom function to the app
app.openapi = custom_openapi
