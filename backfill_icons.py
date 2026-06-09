import httpx
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.database import Skin
import os
from dotenv import load_dotenv

load_dotenv()

engine = create_engine(os.getenv("DATABASE_URL"))
Session = sessionmaker(bind=engine)
session = Session()

url = "https://steamcommunity.com/market/search/render/"
params = {"appid": 730, "norender": 1, "count": 100, "start": 0}

updated = 0
total_skins = session.query(Skin).count()
print(f"Backfilling icons for {total_skins} skins...")

while True:
    try:
        response = httpx.get(url, params=params, timeout=10)
        data = response.json()
    except Exception as e:
        print(f"Request failed: {e}, waiting 30s...")
        time.sleep(30)
        continue

    if data is None or not data.get("results"):
        print("No results (rate limited), waiting 60s...")
        time.sleep(60)
        continue

    for item in data["results"]:
        name = item["hash_name"]
        icon = item.get("asset_description", {}).get("icon_url")
        if not icon:
            continue
        skin = session.query(Skin).filter_by(name=name).first()
        if skin and not skin.icon_url:
            skin.icon_url = icon
            updated += 1

    session.commit()
    params["start"] += 100
    print(f"Processed up to {params['start']}, updated {updated} icons so far...")

    if params["start"] >= data.get("total_count", 0):
        break

    time.sleep(5)

session.close()
print(f"Done! Updated {updated} skins with icon URLs.")