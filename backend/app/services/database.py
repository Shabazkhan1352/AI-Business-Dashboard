import os
import logging
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import List, Dict, Optional
from datetime import date, datetime, timedelta

from app.models.report_model import Report

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
supabase_url: str = os.environ.get("SUPABASE_URL")
supabase_key: str = os.environ.get("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Supabase credentials not found.")

# Create Supabase client
try:
    supabase: Client = create_client(supabase_url, supabase_key)
    logger.info("✅ Successfully connected to Supabase.")
except Exception as e:
    supabase = None
    logger.critical(f"🔥 Failed to connect to Supabase: {e}")

class SupabaseService:
    # --- THIS FUNCTION IS THE FIX ---
    # The logic has been updated to match the behavior you discovered.
    def _calculate_project_status(self, completion_pct: int, deadline_str: str) -> str:
        """
        Calculates a project's status with improved logic that considers completion pace.
        """
        # Rule 1: If a project is done, it's always 'Completed'.
        if completion_pct and completion_pct >= 100:
            return "Completed"

        if not deadline_str:
            return "On Track"

        try:
            deadline_date = datetime.strptime(deadline_str, '%Y-%m-%d').date()
            today = date.today()
            days_until_deadline = (deadline_date - today).days

            # Rule 2: If the deadline has passed, it's always 'Delayed'.
            if days_until_deadline < 0:
                return "Delayed"
            
            # Rule 3: This is the NEW, intelligent logic.
            # If the deadline is close (within 7 days)...
            if days_until_deadline <= 7:
                # ...but the project is nearly done (>= 75%), it's still considered 'On Track'.
                if completion_pct and completion_pct >= 75:
                    return "On Track"
                else:
                    # Otherwise, it is truly 'At Risk'.
                    return "At Risk"
            
            # Rule 4: If none of the above, it's 'On Track'.
            return "On Track"
            
        except (ValueError, TypeError):
            return "On Track"

    # -------- Project Methods (Unchanged) --------

    def update_project(self, project_id: str, data: dict) -> Optional[Dict]:
        if not supabase: return None
        try:
            existing_project = self.get_project_by_id(project_id)
            if not existing_project:
                return None

            # This part now correctly uses the updated logic above
            updated_view = {**existing_project, **data}
            completion = updated_view.get('completion_pct', 0)
            deadline = updated_view.get('deadline')
            new_status = self._calculate_project_status(completion, deadline)
            data['status'] = new_status
            
            response = supabase.table('projects').update(data).eq('id', project_id).execute()
            logger.info(f"Project {project_id} updated. New status: {new_status}")
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error updating project {project_id}: {e}")
            return None

    def create_project(self, project_data: dict) -> Optional[Dict]:
        if not supabase: return None
        try:
            project_data.pop('created_at', None)
            project_data.pop('updated_at', None)
            if 'completion' in project_data and 'completion_pct' not in project_data:
                project_data['completion_pct'] = project_data.pop('completion')
            for key, value in project_data.items():
                if isinstance(value, date):
                    project_data[key] = value.isoformat()
            
            # This part now correctly uses the updated logic above
            completion = project_data.get('completion_pct', 0)
            deadline = project_data.get('deadline')
            initial_status = self._calculate_project_status(completion, deadline)
            project_data['status'] = initial_status

            response = supabase.table('projects').insert(project_data).execute()
            logger.info(f"Project created. Initial status: {initial_status}")
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error creating project: {e}")
            return None

    def get_all_projects(self, status: Optional[str] = None, client: Optional[str] = None) -> List[Dict]:
        if not supabase: return []
        try:
            query = supabase.table('projects').select("*").order('created_at', desc=True)
            if status: query = query.eq('status', status)
            if client: query = query.ilike('client_name', f'%{client}%')
            return query.execute().data
        except Exception as e:
            logger.error(f"Error fetching projects: {e}")
            return []

    def get_project_by_id(self, project_id: str) -> Optional[Dict]:
        if not supabase: return None
        try:
            response = supabase.table('projects').select("*").eq('id', project_id).single().execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching project by ID {project_id}: {e}")
            return None

    def delete_project(self, project_id: str) -> bool:
        if not supabase: return False
        try:
            response = supabase.table('projects').delete().eq('id', project_id).execute()
            return bool(response.data)
        except Exception as e:
            logger.error(f"Error deleting project {project_id}: {e}")
            return False

    def get_project_statistics(self) -> Dict:
        if not supabase: return {}
        try:
            response = supabase.table('projects').select("status, budget").execute()
            projects = response.data
            
            if not projects:
                return {"total_projects": 0, "active_projects": 0, "on_track": 0, "at_risk": 0, "delayed": 0, "completed": 0, "total_budget": 0}
            
            total_projects = len(projects)
            on_track = len([p for p in projects if p.get("status") == "On Track"])
            at_risk = len([p for p in projects if p.get("status") == "At Risk"])
            delayed = len([p for p in projects if p.get("status") == "Delayed"])
            active_projects = on_track + at_risk + delayed

            return {
                "total_projects": total_projects, "active_projects": active_projects,
                "on_track": on_track, "at_risk": at_risk, "delayed": delayed,
                "completed": len([p for p in projects if p.get("status") == "Completed"]),
                "total_budget": sum(p.get("budget", 0) or 0 for p in projects),
            }
        except Exception as e:
            logger.error(f"Error calculating project statistics: {e}")
            return {}

    # --- LEAD METHODS (Unchanged) ---
    
    def create_lead(self, lead_data: dict) -> Optional[Dict]:
        if not supabase: return None
        try:
            lead_data.pop('created_at', None); lead_data.pop('updated_at', None)
            response = supabase.table('leads').insert(lead_data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error creating lead: {e}"); return None

    def get_all_leads(self, status: Optional[str] = None, source: Optional[str] = None) -> List[Dict]:
        if not supabase: return []
        try:
            query = supabase.table("leads").select("*").order('created_at', desc=True)
            if status: query = query.eq('status', status)
            if source: query = query.ilike('source', f'%{source}%')
            return query.execute().data
        except Exception as e:
            logger.error(f"Error fetching leads: {e}"); return []

    def get_lead_by_id(self, lead_id: str) -> Optional[Dict]:
        if not supabase: return None
        try:
            response = supabase.table('leads').select("*").eq('id', lead_id).single().execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching lead by ID {lead_id}: {e}"); return None

    def update_lead(self, lead_id: str, data: dict) -> Optional[Dict]:
        if not supabase: return None
        try:
            response = supabase.table('leads').update(data).eq('id', lead_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error updating lead {lead_id}: {e}"); return None

    def delete_lead(self, lead_id: str) -> bool:
        if not supabase: return False
        try:
            response = supabase.table('leads').delete().eq('id', lead_id).execute()
            return bool(response.data)
        except Exception as e:
            logger.error(f"Error deleting lead {lead_id}: {e}"); return False

    def get_lead_statistics(self) -> Dict:
        if not supabase: return {}
        try:
            response = supabase.table('leads').select("status, value").execute()
            leads = response.data
            if not leads: return {"total_leads": 0, "active_leads": 0, "won_leads": 0, "lost_leads": 0, "pipeline_value": 0, "total_revenue": 0, "conversion_rate": 0.0}
            total_leads = len(leads)
            active_leads_list = [l for l in leads if l.get("status") == "Active"]
            won_leads_list = [l for l in leads if l.get("status") == "Won"]
            lost_leads_list = [l for l in leads if l.get("status") == "Lost"]
            pipeline_value = sum(l.get("value", 0) or 0 for l in active_leads_list)
            total_revenue = sum(l.get("value", 0) or 0 for l in won_leads_list)
            conversion_rate = round((len(won_leads_list) / total_leads) * 100, 1) if total_leads > 0 else 0.0
            return {
                "total_leads": total_leads, "active_leads": len(active_leads_list),
                "won_leads": len(won_leads_list), "lost_leads": len(lost_leads_list),
                "pipeline_value": pipeline_value, "total_revenue": total_revenue,
                "conversion_rate": conversion_rate,
            }
        except Exception as e:
            logger.error(f"Error calculating lead statistics: {e}"); return {}

    # -------- Employee Methods (Unchanged) --------
    def get_all_employees(self) -> List[Dict]:
        if not supabase: return []
        try:
            return supabase.table("employees").select("*").order('created_at', desc=True).execute().data
        except Exception as e:
            logger.error(f"Error fetching employees: {e}"); return []

    def get_employee_statistics(self) -> Dict:
        if not supabase: return {}
        try:
            response = supabase.table('employees').select('id', count='exact').execute()
            return { "total_employees": response.count }
        except Exception as e:
            logger.error(f"Error calculating employee statistics: {e}"); return {}

    # -------- Report Methods --------
    def get_all_reports(self) -> List[Dict]:
        if not supabase: return []
        try:
            return supabase.table("reports").select("*").order("generated_on", desc=True).execute().data
        except Exception as e:
            logger.error(f"Error fetching reports from Supabase: {e}"); return []

    def get_report_by_id(self, report_id: str) -> Optional[Report]:
        if not supabase: return None
        try:
            resp = supabase.table("reports").select("*").eq("id", report_id).single().execute()
            if not resp.data: return None
            return Report.model_validate(resp.data)
        except Exception as e:
            logger.error(f"Error fetching report by id {report_id}: {e}"); return None

    def create_report_record(self, data: dict) -> Optional[Dict]:
        if not supabase: return None
        try:
            resp = supabase.table("reports").insert(data).execute()
            return (resp.data or [None])[0]
        except Exception as e:
            logger.error(f"Error creating report record: {e}"); return None

    def update_report_record(self, report_id: str, data: dict) -> Optional[Dict]:
        if not supabase: return None
        try:
            response = supabase.table('reports').update(data).eq('id', report_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error updating report record {report_id}: {e}"); return None
            
    # --- NEW: Function to delete a report from the database and storage ---
    def delete_report(self, report_id: str) -> bool:
        """Deletes a report file from storage and its record from the database."""
        if not supabase: 
            logger.error("Supabase client not initialized for delete operation.")
            return False
        try:
            # Step 1: Attempt to remove the file from storage first.
            try:
                file_path = f"generated/{report_id}.pdf"
                supabase.storage.from_("reports").remove([file_path])
                logger.info(f"Report file removed from storage: {file_path}")
            except Exception as storage_e:
                # Log a warning but don't stop the process if the file doesn't exist.
                logger.warning(f"Could not remove report file from storage for {report_id}. It might not exist. Error: {storage_e}")

            # Step 2: Delete the record from the database.
            response = supabase.table('reports').delete().eq('id', report_id).execute()
            
            # If the response has data, the deletion was successful.
            if response.data:
                logger.info(f"Successfully deleted report record: {report_id}")
                return True
            else:
                logger.warning(f"Report record not found for deletion: {report_id}")
                # Return False if the DB record wasn't found to be deleted.
                return False

        except Exception as e:
            logger.error(f"An unexpected error occurred during report deletion for {report_id}: {e}")
            return False

db_service = SupabaseService()
