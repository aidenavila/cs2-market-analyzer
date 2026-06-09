from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from signals import compute_signal
from models.database import Skin, PriceHistory

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "CS2 Market Analyzer API"}

@app.get("/skins")
def get_skins(db: Session = Depends(get_db)):
    skins = db.query(Skin).all()
    return [{"id": s.id, "name": s.name, "category": s.category, "icon_url": s.icon_url} for s in skins]

@app.get("/skins/{skin_id}/history")
def get_price_history(skin_id: int, db: Session = Depends(get_db)):
    history = db.query(PriceHistory).filter_by(skin_id=skin_id).order_by(PriceHistory.recorded_at).all()
    return [{"price": h.price_usd, "volume": h.volume, "recorded_at": str(h.recorded_at)} for h in history]

@app.get("/skins/{skin_id}/signal")
def get_skin_signal(skin_id: int, db: Session = Depends(get_db)):
    history = db.query(PriceHistory).filter_by(skin_id=skin_id).order_by(PriceHistory.recorded_at).all()
    prices = [h.price_usd for h in history]
    skin = db.query(Skin).filter_by(id=skin_id).first()
    result = compute_signal(prices)
    result["skin_id"] = skin_id
    result["name"] = skin.name if skin else None
    return result

@app.get("/signals")
def get_all_signals(db: Session = Depends(get_db)):
    skins = db.query(Skin).all()
    flagged = []
    for skin in skins:
        history = db.query(PriceHistory).filter_by(skin_id=skin.id).order_by(PriceHistory.recorded_at).all()
        prices = [h.price_usd for h in history]
        result = compute_signal(prices)
        if result["signal"] in ("buy", "sell"):
            result["skin_id"] = skin.id
            result["name"] = skin.name
            result["category"] = skin.category
            flagged.append(result)
    # Sort by absolute z-score, strongest signals first
    flagged.sort(key=lambda x: abs(x["z_score"]), reverse=True)
    return flagged