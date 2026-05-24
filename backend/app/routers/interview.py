from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime
from ..services.ai_service import generate_interview_questions, evaluate_interview_answer, generate_interview_hint
from ..database import get_db

router = APIRouter()

class InterviewRequest(BaseModel):
    role: str
    experience: str
    skills: list[str] = []
    interview_type: str = "Mixed"
    github_projects: Optional[str] = None
    round_number: Optional[int] = None

class AnswerRequest(BaseModel):
    question_text: str
    answer: str
    hint_used: bool = False

class HintRequest(BaseModel):
    question_text: str

class ExecuteRequest(BaseModel):
    language: str
    code: str

@router.post("/generate")
async def generate_interview(req: InterviewRequest):
    try:
        questions = generate_interview_questions(
            req.role, 
            req.experience, 
            req.skills, 
            req.interview_type,
            req.github_projects,
            req.round_number
        )
        
        if not questions:
            raise HTTPException(status_code=500, detail="Failed to generate interview questions")
            
        return {
            "interview_id": str(uuid.uuid4()),
            "questions": questions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/github/{username}")
async def fetch_github_projects(username: str):
    import httpx
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://api.github.com/users/{username}/repos?sort=updated&per_page=5",
                headers={"Accept": "application/vnd.github.v3+json"}
            )
        if response.status_code == 404:
            return {"error": "User not found"}
        if response.status_code != 200:
            return {"error": f"GitHub API error: {response.status_code}"}
            
        repos = response.json()
        if not repos:
            return {"projects_summary": "No public repositories found."}
            
        project_details = []
        for repo in repos:
            if not repo.get("fork", False):
                desc = repo.get("description") or "No description"
                lang = repo.get("language") or "Unknown language"
                project_details.append(f"- {repo['name']} ({lang}): {desc}")
                
        summary = "\n".join(project_details)
        return {"projects_summary": summary if summary else "No non-forked repositories found."}
    except Exception as e:
        import traceback
        print(f"GitHub API Error: {traceback.format_exc()}")
        return {"error": str(e)}

@router.post("/evaluate")
async def evaluate_answer(req: AnswerRequest):
    evaluation = evaluate_interview_answer(req.question_text, req.answer, req.hint_used)
    return evaluation

@router.post("/hint")
async def get_hint(req: HintRequest):
    hint_data = generate_interview_hint(req.question_text)
    return hint_data

class SaveReportRequest(BaseModel):
    user_id: str = "guest_user"
    interview_id: str
    role: str
    average_score: int
    evaluations: list

@router.post("/save")
async def save_interview(req: SaveReportRequest):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    report_doc = req.dict()
    # We only set created_at on insert, so we use $setOnInsert
    update_data = {
        "$set": {
            "user_id": req.user_id,
            "role": req.role,
            "average_score": req.average_score,
            "evaluations": req.evaluations
        },
        "$setOnInsert": {
            "created_at": datetime.utcnow()
        }
    }
    
    await db["interviews"].update_one(
        {"interview_id": req.interview_id},
        update_data,
        upsert=True
    )
    return {"message": "Interview saved successfully"}

@router.get("/stats")
async def get_dashboard_stats(user_id: str = "guest_user"):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    pipeline = [
        {"$match": {"user_id": user_id}},
        {
            "$group": {
                "_id": None,
                "total_interviews": {"$sum": 1},
                "average_score": {"$avg": "$average_score"}
            }
        }
    ]
    
    cursor = db["interviews"].aggregate(pipeline)
    result = await cursor.to_list(length=1)
    
    # Fetch actual history and evaluations for the chart and strengths
    history_cursor = db["interviews"].find(
        {"user_id": user_id}, 
        {"average_score": 1, "role": 1, "created_at": 1, "evaluations": 1}
    ).sort("created_at", 1)
    history_docs = await history_cursor.to_list(length=100)
    
    history_data = []
    metric_totals = {"technical": 0, "communication": 0, "confidence": 0, "grammar": 0, "fluency": 0}
    metric_counts = {"technical": 0, "communication": 0, "confidence": 0, "grammar": 0, "fluency": 0}
    
    for i, doc in enumerate(history_docs):
        created_at = doc.get("created_at")
        date_str = ""
        if created_at:
            if hasattr(created_at, "strftime"):
                date_str = created_at.strftime("%Y-%m-%d")
            else:
                date_str = str(created_at)[:10]

        history_data.append({
            "name": f"Int {i+1}", 
            "score": doc.get("average_score") or 0,
            "role": doc.get("role") or "Unknown",
            "date": date_str
        })
        
        # Aggregate metrics
        evals = doc.get("evaluations")
        if not isinstance(evals, list):
            evals = []
            
        for ev in evals:
            if not isinstance(ev, dict):
                continue
            metrics = ev.get("metrics")
            if not isinstance(metrics, dict):
                continue
            for k in metric_totals.keys():
                if k in metrics and isinstance(metrics[k], (int, float)):
                    metric_totals[k] += metrics[k]
                    metric_counts[k] += 1
                    
    # Calculate top 2 strengths based on highest average metrics
    avg_metrics = {}
    for k in metric_totals.keys():
        if metric_counts[k] > 0:
            avg_metrics[k] = metric_totals[k] / metric_counts[k]
            
    sorted_metrics = sorted(avg_metrics.items(), key=lambda x: x[1], reverse=True)
    top_skills_str = "No data yet"
    if sorted_metrics:
        top_2 = [m[0].capitalize() for m in sorted_metrics[:2] if m[1] > 0]
        if top_2:
            top_skills_str = ", ".join(top_2)
    
    if result:
        stats = result[0]
        user_avg = stats.get("average_score") or 0
        
        # Calculate percentile
        all_users_pipeline = [
            {"$group": {"_id": "$user_id", "avg": {"$avg": "$average_score"}}}
        ]
        all_users_cursor = db["interviews"].aggregate(all_users_pipeline)
        all_users = await all_users_cursor.to_list(length=10000)
        
        lower_scores = sum(1 for u in all_users if (u.get("avg") or 0) < user_avg)
        total_users = len(all_users)
        percentile = (lower_scores / max(1, total_users)) * 100 if total_users > 1 else 100
        
        return {
            "total_interviews": stats.get("total_interviews") or 0,
            "average_score": round(user_avg),
            "strengths": top_skills_str,
            "history": history_data,
            "percentile": round(percentile)
        }
    else:
        return {
            "total_interviews": 0,
            "average_score": 0,
            "strengths": "No data yet",
            "history": [],
            "percentile": 0
        }

@router.get("/debug_db")
async def debug_db():
    try:
        db = get_db()
        if db is None:
            return {"error": "DB not connected"}
        
        docs = await db["interviews"].find({}).to_list(length=100)
        for d in docs:
            d["_id"] = str(d["_id"])
        return {"count": len(docs), "docs": docs}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}
