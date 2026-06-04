import httpx
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.database import Base, Skin, PriceHistory
import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind = engine)
Base.metadata.create_all(engine)

SKINS = [
    "AK-47 | Redline (Field-Tested)",
    "AWP | Asiimov (Field-Tested)",
    "M4A4 | Howl (Minimal Wear)"
]

def fetch_price(skin_name: str) -> dict:
    url = "https://steamcommunity.com/market/priceoverview/"
    params = {
        "appid": 730,
        "currency": 1, #us dollars
        "market_hash_name": skin_name
    }

    response = httpx.get(url, params=params)
    return response.json()

def save_price(session, skin_name: str, data: dict):
    skin = session.query(Skin).filter_by(name = skin_name).first()
    if not skin:
        skin = Skin(name = skin_name, category = "rifle")
        session.add(skin)
        session.commit()

    price_str = data.get("median_price") or data.get("lowest_price", "0")
    price = float(price_str.replace("$", "").replace(",", ""))

    volume = int(data.get("volume", "0").replace(",", ""))

    entry = PriceHistory(
        skin_id = skin.id,
        price_usd = price,
        volume = volume,
        source = "steam",
        recorded_at = datetime.datetime.utcnow()
    )
    session.add(entry)
    session.commit()
    print(f"Saved: {skin_name} at ${price}")

def run():
    print("Script started")
    session = Session()
    print(f"Fetching {len(SKINS)} skins...")
    for skin_name in SKINS:
        print(f"Fetching {skin_name}...")
        try:
            data = fetch_price(skin_name)
            print(f"Got data: {data}")
            save_price(session, skin_name, data)
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Error fetching {skin_name}: {e}")
        time.sleep(3)
    session.close()
    print("Done!")

if __name__ == "__main__":
    run()
