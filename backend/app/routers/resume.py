from fastapi import APIRouter, UploadFile, File, Form
import io
import PyPDF2
from ..services.ai_service import analyze_ats_resume

router = APIRouter()

@router.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    target_role: str = Form("Frontend Developer")
):
    try:
        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
            
        ats_result = analyze_ats_resume(text, target_role)
        
        return {
            "filename": file.filename,
            **ats_result
        }
    except Exception as e:
        print(f"Error parsing resume: {e}")
        return {
            "filename": file.filename,
            "ats_score": 0,
            "skills_extracted": [],
            "missing_keywords": [],
            "suggestions": ["Could not parse the PDF file."]
        }
