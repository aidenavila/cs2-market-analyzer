from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.database import Skin, PriceHistory

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

app = FastAPI()

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
    return [{"id": s.id, "name": s.name, "category": s.category} for s in skins]

@app.get("/skins/{skin_id}/history")
def get_price_history(skin_id: int, db: Session = Depends(get_db)):
    history = db.query(PriceHistory).filter_by(skin_id=skin_id).order_by(PriceHistory.recorded_at).all()
    return [{"price": h.price_usd, "volume": h.volume, "recorded_at": str(h.recorded_at)} for h in history]