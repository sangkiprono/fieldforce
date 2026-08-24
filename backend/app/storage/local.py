import os
import uuid
from fastapi import UploadFile
from app.config import settings

async def save_upload_file(file: UploadFile, job_id: str) -> str:
    job_dir = os.path.join(settings.upload_dir, job_id)
    os.makedirs(job_dir, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(job_dir, filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    return f"/uploads/{job_id}/{filename}"
