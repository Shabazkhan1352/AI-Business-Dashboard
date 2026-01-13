from typing import List, Optional, Dict
from datetime import datetime
import uuid

class MockDatabase:
    def __init__(self):
        self._projects = [
            {
                "id": "proj_001",
                "project_name": "Website Redesign",
                "client_name": "TechCorp Inc",
                "start_date": "2024-01-15",
                "deadline": "2024-03-15",
                "completion": 85,
                "status": "On Track",
                "budget": 50000,
                "created_at": "2024-01-15T09:00:00",
                "updated_at": "2024-08-21T15:30:00"
            },
            {
                "id": "proj_002",
                "project_name": "Mobile App Development",
                "client_name": "StartupXYZ",
                "start_date": "2024-02-01",
                "deadline": "2024-04-30",
                "completion": 45,
                "status": "At Risk",
                "budget": 75000,
                "created_at": "2024-02-01T10:00:00",
                "updated_at": "2024-08-20T14:20:00"
            },
            {
                "id": "proj_003",
                "project_name": "Data Migration Project",
                "client_name": "Enterprise Ltd",
                "start_date": "2024-01-01",
                "deadline": "2024-02-28",
                "completion": 100,
                "status": "Completed",
                "budget": 30000,
                "created_at": "2024-01-01T08:00:00",
                "updated_at": "2024-02-28T17:00:00"
            },
            {
                "id": "proj_004",
                "project_name": "E-commerce Platform",
                "client_name": "RetailCorp",
                "start_date": "2024-03-01",
                "deadline": "2024-06-30",
                "completion": 25,
                "status": "Delayed",
                "budget": 120000,
                "created_at": "2024-03-01T09:30:00",
                "updated_at": "2024-08-20T11:45:00"
            }
        ]
        
        self._leads = [
            {
                "id": "lead_001",
                "lead_name": "John Smith",
                "company": "ABC Corp",
                "source": "LinkedIn",
                "stage": "Qualified",
                "revenue": 25000,
                "status": "Active",
                "owner": "Sales Rep 1",
                "contact_email": "john@abccorp.com",
                "contact_phone": "+1-555-0101",
                "created_at": "2024-07-15T10:00:00",
                "updated_at": "2024-08-21T14:30:00"
            },
            {
                "id": "lead_002",
                "lead_name": "Jane Doe",
                "company": "XYZ Industries",
                "source": "Referral",
                "stage": "Proposal Sent",
                "revenue": 40000,
                "status": "Active",
                "owner": "Sales Rep 2",
                "contact_email": "jane@xyzind.com",
                "contact_phone": "+1-555-0102",
                "created_at": "2024-07-20T11:00:00",
                "updated_at": "2024-08-21T16:15:00"
            },
            {
                "id": "lead_003",
                "lead_name": "Mike Wilson",
                "company": "Tech Solutions Inc",
                "source": "Website",
                "stage": "Closed",
                "revenue": 60000,
                "status": "Won",
                "owner": "Sales Rep 1",
                "contact_email": "mike@techsol.com",
                "contact_phone": "+1-555-0103",
                "created_at": "2024-06-01T09:00:00",
                "updated_at": "2024-07-30T18:00:00"
            }
        ]
        
        self._employees = [
            {
                "id": "emp_001",
                "emp_name": "Alice Johnson",
                "role": "Developer",
                "tasks_completed": 25,
                "efficiency": 92.5,
                "availability": "Available",
                "email": "alice@company.com",
                "manager": "Bob Manager",
                "created_at": "2024-01-15T09:00:00"
            },
            {
                "id": "emp_002",
                "emp_name": "Bob Smith",
                "role": "Designer",
                "tasks_completed": 18,
                "efficiency": 88.0,
                "availability": "Busy",
                "email": "bob@company.com",
                "manager": "Carol Director",
                "created_at": "2024-01-15T09:00:00"
            },
            {
                "id": "emp_003",
                "emp_name": "Carol Brown",
                "role": "Project Manager",
                "tasks_completed": 30,
                "efficiency": 95.0,
                "availability": "Available",
                "email": "carol@company.com",
                "manager": "David CEO",
                "created_at": "2024-01-15T09:00:00"
            }
        ]

    # ==================== PROJECT METHODS ====================
    def get_all_projects(self, status: Optional[str] = None, client: Optional[str] = None, 
                        limit: int = 100, offset: int = 0) -> List[Dict]:
        projects = self._projects.copy()
        if status:
            projects = [p for p in projects if p.get('status') == status]
        if client:
            projects = [p for p in projects if client.lower() in p.get('client_name', '').lower()]
        return projects[offset:offset + limit]

    def get_project_by_id(self, project_id: str) -> Optional[Dict]:
        return next((p for p in self._projects if p.get('id') == project_id), None)

    def create_project(self, project_data: Dict) -> Dict:
        new_project = project_data.copy()
        new_project['id'] = f"proj_{uuid.uuid4().hex[:8]}"
        new_project['created_at'] = datetime.now().isoformat()
        new_project['updated_at'] = datetime.now().isoformat()
        
        if isinstance(new_project.get('start_date'), str):
            pass  # Already string
        elif hasattr(new_project.get('start_date'), 'isoformat'):
            new_project['start_date'] = new_project['start_date'].isoformat()
            
        if isinstance(new_project.get('deadline'), str):
            pass  # Already string
        elif hasattr(new_project.get('deadline'), 'isoformat'):
            new_project['deadline'] = new_project['deadline'].isoformat()
            
        self._projects.append(new_project)
        return new_project

    def update_project(self, project_id: str, update_data: Dict) -> Optional[Dict]:
        project = self.get_project_by_id(project_id)
        if project:
            if isinstance(update_data.get('start_date'), str):
                pass  # Already string
            elif hasattr(update_data.get('start_date'), 'isoformat'):
                update_data['start_date'] = update_data['start_date'].isoformat()
                
            if isinstance(update_data.get('deadline'), str):
                pass  # Already string
            elif hasattr(update_data.get('deadline'), 'isoformat'):
                update_data['deadline'] = update_data['deadline'].isoformat()
                
            project.update(update_data)
            project['updated_at'] = datetime.now().isoformat()
            return project
        return None

    def delete_project(self, project_id: str) -> bool:
        project = self.get_project_by_id(project_id)
        if project:
            self._projects.remove(project)
            return True
        return False

    def get_project_statistics(self) -> Dict:
        total = len(self._projects)
        on_track = len([p for p in self._projects if p.get('status') == 'On Track'])
        at_risk = len([p for p in self._projects if p.get('status') == 'At Risk'])
        delayed = len([p for p in self._projects if p.get('status') == 'Delayed'])
        completed = len([p for p in self._projects if p.get('status') == 'Completed'])
        
        total_budget = sum(p.get('budget', 0) for p in self._projects)
        avg_completion = sum(p.get('completion', 0) for p in self._projects) / total if total > 0 else 0
        
        return {
            "total_projects": total,
            "on_track": on_track,
            "at_risk": at_risk,
            "delayed": delayed,
            "completed": completed,
            "total_budget": total_budget,
            "average_completion": round(avg_completion, 2)
        }

    # ==================== LEAD METHODS ====================
    def get_all_leads(self, stage: Optional[str] = None, source: Optional[str] = None, 
                     owner: Optional[str] = None, status: Optional[str] = None,
                     limit: int = 100, offset: int = 0) -> List[Dict]:
        leads = self._leads.copy()
        if stage:
            leads = [l for l in leads if l.get('stage') == stage]
        if source:
            leads = [l for l in leads if l.get('source') == source]
        if owner:
            leads = [l for l in leads if l.get('owner') == owner]
        if status:
            leads = [l for l in leads if l.get('status') == status]
        return leads[offset:offset + limit]

    def get_lead_by_id(self, lead_id: str) -> Optional[Dict]:
        return next((l for l in self._leads if l.get('id') == lead_id), None)

    def create_lead(self, lead_data: Dict) -> Dict:
        new_lead = lead_data.copy()
        new_lead['id'] = f"lead_{uuid.uuid4().hex[:8]}"
        new_lead['created_at'] = datetime.now().isoformat()
        new_lead['updated_at'] = datetime.now().isoformat()
        self._leads.append(new_lead)
        return new_lead

    def update_lead(self, lead_id: str, update_data: Dict) -> Optional[Dict]:
        lead = self.get_lead_by_id(lead_id)
        if lead:
            lead.update(update_data)
            lead['updated_at'] = datetime.now().isoformat()
            return lead
        return None

    def delete_lead(self, lead_id: str) -> bool:
        lead = self.get_lead_by_id(lead_id)
        if lead:
            self._leads.remove(lead)
            return True
        return False

    def get_lead_statistics(self) -> Dict:
        total = len(self._leads)
        active = len([l for l in self._leads if l.get('status') == 'Active'])
        won = len([l for l in self._leads if l.get('status') == 'Won'])
        lost = len([l for l in self._leads if l.get('status') == 'Lost'])
        
        total_revenue = sum(l.get('revenue', 0) for l in self._leads if l.get('status') == 'Won')
        avg_deal_size = total_revenue / won if won > 0 else 0
        conversion_rate = (won / total * 100) if total > 0 else 0
        
        return {
            "total_leads": total,
            "active_leads": active,
            "won_leads": won,
            "lost_leads": lost,
            "total_revenue": total_revenue,
            "average_deal_size": round(avg_deal_size, 2),
            "conversion_rate": round(conversion_rate, 2)
        }

    # ==================== EMPLOYEE METHODS ====================
    def get_all_employees(self, role: Optional[str] = None, availability: Optional[str] = None,
                         manager: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[Dict]:
        employees = self._employees.copy()
        if role:
            employees = [e for e in employees if e.get('role') == role]
        if availability:
            employees = [e for e in employees if e.get('availability') == availability]
        if manager:
            employees = [e for e in employees if e.get('manager') == manager]
        return employees[offset:offset + limit]

    def get_employee_by_id(self, employee_id: str) -> Optional[Dict]:
        return next((e for e in self._employees if e.get('id') == employee_id), None)

    def create_employee(self, employee_data: Dict) -> Dict:
        new_employee = employee_data.copy()
        new_employee['id'] = f"emp_{uuid.uuid4().hex[:8]}"
        new_employee['created_at'] = datetime.now().isoformat()
        self._employees.append(new_employee)
        return new_employee

    def update_employee(self, employee_id: str, update_data: Dict) -> Optional[Dict]:
        employee = self.get_employee_by_id(employee_id)
        if employee:
            employee.update(update_data)
            return employee
        return None

    def delete_employee(self, employee_id: str) -> bool:
        employee = self.get_employee_by_id(employee_id)
        if employee:
            self._employees.remove(employee)
            return True
        return False

    def get_employee_statistics(self) -> Dict:
        total = len(self._employees)
        available = len([e for e in self._employees if e.get('availability') == 'Available'])
        busy = len([e for e in self._employees if e.get('availability') == 'Busy'])
        on_leave = len([e for e in self._employees if e.get('availability') == 'On Leave'])
        
        avg_efficiency = sum(e.get('efficiency', 0) for e in self._employees) / total if total > 0 else 0
        total_tasks = sum(e.get('tasks_completed', 0) for e in self._employees)
        
        top_performer = None
        if self._employees:
            top_emp = max(self._employees, key=lambda e: e.get('efficiency', 0))
            top_performer = top_emp.get('emp_name')
        
        return {
            "total_employees": total,
            "available_employees": available,
            "busy_employees": busy,
            "on_leave_employees": on_leave,
            "average_efficiency": round(avg_efficiency, 2),
            "total_tasks_completed": total_tasks,
            "top_performer": top_performer
        }

# Global database instance
mock_db = MockDatabase()
