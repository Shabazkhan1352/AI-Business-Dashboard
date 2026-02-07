import json
import os
from typing import Any, Dict, List


def _safe_float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _generate_local_insights(projects: List[dict], leads: List[dict], employees: List[dict]) -> Dict[str, Any]:
    total_projects = len(projects)
    at_risk_or_delayed = [p for p in projects if p.get("status") in {"At Risk", "Delayed"}]
    completed = [p for p in projects if p.get("status") == "Completed"]

    active_leads = [l for l in leads if l.get("status") == "Active"]
    won_leads = [l for l in leads if l.get("status") == "Won"]
    pipeline_value = int(sum(_safe_float(l.get("value", 0)) for l in active_leads))
    won_revenue = int(sum(_safe_float(l.get("value", 0)) for l in won_leads))

    avg_efficiency = round(
        sum(_safe_float(e.get("efficiency", 0)) for e in employees) / len(employees), 2
    ) if employees else 0
    low_availability = [e for e in employees if e.get("availability") in {"Busy", "On Leave"}]

    completion_rate = round((len(completed) / total_projects) * 100, 2) if total_projects else 0

    return {
        "source": "local-fallback",
        "executive_summary": (
            f"Delivery completion is {completion_rate}% with {len(at_risk_or_delayed)} project(s) needing attention. "
            f"Sales pipeline is ₹{pipeline_value:,}, with won revenue at ₹{won_revenue:,}."
        ),
        "project_analysis": {
            "title": "Project Health Analysis",
            "observation": (
                f"{len(at_risk_or_delayed)} out of {total_projects} projects are marked At Risk/Delayed."
            ),
            "recommendation": "Prioritize weekly risk review for delayed projects and re-allocate high-efficiency staff.",
        },
        "sales_analysis": {
            "title": "Sales & Lead Funnel Analysis",
            "observation": (
                f"There are {len(active_leads)} active leads with pipeline value of ₹{pipeline_value:,}."
            ),
            "recommendation": "Create stage-based follow-up automations and focus on high-value negotiation opportunities.",
        },
        "workforce_analysis": {
            "title": "Workforce & Productivity Analysis",
            "observation": (
                f"Average efficiency is {avg_efficiency}%. {len(low_availability)} team members are currently constrained."
            ),
            "recommendation": "Balance workload and reserve focused blocks for top performers on high-risk deliverables.",
        },
    }


def _call_gemini(prompt: str) -> Dict[str, Any]:
    google_api_key = os.environ.get("GOOGLE_API_KEY")
    if not google_api_key:
        raise RuntimeError("GOOGLE_API_KEY is not configured")

    try:
        import google.generativeai as genai
    except ImportError as exc:
        raise RuntimeError("google-generativeai dependency is not installed") from exc

    genai.configure(api_key=google_api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)
    cleaned = (response.text or "").strip().replace("```json", "").replace("```", "")
    return json.loads(cleaned)


def generate_deep_dive_insights(projects: list, leads: list, employees: list) -> dict:
    """Generate structured insights with Gemini when available; otherwise deterministic local insights."""
    prompt = f"""
    You are a business analyst. Return ONLY valid JSON with keys:
    executive_summary, project_analysis, sales_analysis, workforce_analysis.

    Projects: {json.dumps(projects[:10], default=str)}
    Leads: {json.dumps(leads[:10], default=str)}
    Employees: {json.dumps(employees[:10], default=str)}
    """

    try:
        insights = _call_gemini(prompt)
        insights["source"] = "gemini"
        return insights
    except Exception:
        return _generate_local_insights(projects, leads, employees)


def generate_copilot_response(question: str, projects: List[dict], leads: List[dict], employees: List[dict]) -> Dict[str, Any]:
    """Conversational AI assistant endpoint with fallback."""
    if not question.strip():
        return {"answer": "Please ask a question related to your business metrics.", "source": "local-fallback"}

    context = {
        "projects": projects[:20],
        "leads": leads[:20],
        "employees": employees[:20],
    }

    prompt = f"""
    You are an AI business copilot. Answer succinctly with actionable guidance.
    Question: {question}
    Data context: {json.dumps(context, default=str)}
    """

    try:
        result = _call_gemini(prompt)
        if isinstance(result, dict) and result.get("answer"):
            return {"answer": result["answer"], "source": "gemini"}
        return {"answer": str(result), "source": "gemini"}
    except Exception:
        local = _generate_local_insights(projects, leads, employees)
        return {
            "answer": (
                f"Based on current data, focus on {local['project_analysis']['observation']} "
                f"Also, {local['sales_analysis']['observation']}"
            ),
            "source": "local-fallback",
        }
