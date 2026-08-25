from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.storage.ws_manager import manager

router = APIRouter()

@router.websocket("/ws/jobs")
async def jobs_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
