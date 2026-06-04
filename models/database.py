from sqlalchemy import Column, Integer, String, Float, DateTime, create_engine
from sqlalchemy.orm import declarative_base
import datetime

Base = declarative_base()

class Skin(Base):
    __tablename__ = "skins"
    id = Column(Integer, primary_key = True)
    name = Column(String, unique = True)
    category = Column(String)

class PriceHistory(Base):
    __tablename__ = "price_history"
    id = Column(Integer, primary_key = True)
    skin_id = Column(Integer)
    price_usd = Column(Float)
    volume = Column(Integer)
    source = Column(String)
    recorded_at = Column(DateTime, default = datetime.datetime.utcnow)