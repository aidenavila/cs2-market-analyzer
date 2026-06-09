from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.database import Skin
from categorize import categorize_skin
import os
from dotenv import load_dotenv

load_dotenv()

engine = create_engine(os.getenv("DATABASE_URL"))
Session = sessionmaker(bind=engine)
session = Session()

skins = session.query(Skin).all()
print(f"Recategorizing {len(skins)} skins...")

counts = {}
for skin in skins:
    category = categorize_skin(skin.name)
    skin.category = category
    counts[category] = counts.get(category, 0) + 1

session.commit()
session.close()

print("Done! Category breakdown:")
for cat, count in sorted(counts.items(), key=lambda x: -x[1]):
    print(f"  {cat}: {count}")