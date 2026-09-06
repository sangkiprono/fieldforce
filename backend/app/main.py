from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import Base, engine
from app import models
from app.routers import auth, customers, jobs, dashboard, websocket, inventory, portal, notifications

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FieldForce API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(jobs.router)
app.include_router(dashboard.router)
app.include_router(websocket.router)
app.include_router(inventory.router)
app.include_router(portal.router)
app.include_router(notifications.router)

@app.get("/")
def root():
    return {"status": "FieldForce API running"}
