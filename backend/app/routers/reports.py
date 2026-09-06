import io
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from openpyxl import Workbook
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch

from app.database import get_db
from app.models.job import Job
from app.auth.dependencies import require_manager

router = APIRouter(prefix="/reports", tags=["reports"])

def get_filtered_jobs(db: Session, status: str | None, start_date: str | None, end_date: str | None):
    query = db.query(Job)
    if status:
        query = query.filter(Job.status == status)
    if start_date:
        query = query.filter(Job.created_at >= start_date)
    if end_date:
        query = query.filter(Job.created_at <= end_date)
    return query.order_by(Job.created_at.desc()).all()

@router.get("/jobs/export")
def export_jobs(
    format: str = Query("xlsx", pattern="^(xlsx|pdf)$"),
    status: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(require_manager),
):
    jobs = get_filtered_jobs(db, status, start_date, end_date)

    if format == "xlsx":
        return export_xlsx(jobs)
    else:
        return export_pdf(jobs)

def export_xlsx(jobs: list[Job]):
    wb = Workbook()
    ws = wb.active
    ws.title = "Jobs Report"

    headers = ["Job Number", "Customer", "Phone", "Issue Type", "Priority", "Status", "Technician", "Created At"]
    ws.append(headers)

    for job in jobs:
        ws.append([
            job.job_number,
            job.customer.name if job.customer else "",
            job.customer.phone if job.customer else "",
            job.issue_type.value.replace("_", " ").title(),
            job.priority.value.title(),
            job.status.value.replace("_", " ").title(),
            job.assigned_technician.name if job.assigned_technician else "Unassigned",
            job.created_at.strftime("%Y-%m-%d %H:%M") if job.created_at else "",
        ])

    for col in ws.columns:
        max_length = max(len(str(cell.value)) for cell in col if cell.value)
        ws.column_dimensions[col[0].column_letter].width = max_length + 2

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    filename = f"fieldforce_jobs_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

def export_pdf(jobs: list[Job]):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("FieldForce — Jobs Report", styles["Title"]))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles["Normal"]))
    elements.append(Spacer(1, 0.3 * inch))

    data = [["Job #", "Customer", "Issue", "Priority", "Status", "Technician"]]
    for job in jobs:
        data.append([
            job.job_number,
            job.customer.name if job.customer else "",
            job.issue_type.value.replace("_", " ").title(),
            job.priority.value.title(),
            job.status.value.replace("_", " ").title(),
            job.assigned_technician.name if job.assigned_technician else "Unassigned",
        ])

    table = Table(data, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 0.3 * inch))
    elements.append(Paragraph(f"Total jobs: {len(jobs)}", styles["Normal"]))

    doc.build(elements)
    buffer.seek(0)

    filename = f"fieldforce_jobs_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
