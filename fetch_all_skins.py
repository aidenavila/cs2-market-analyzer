import httpx
import json
import time

def fetch_all_skins():
    url = "https://steamcommunity.com/market/search/render/"
    params = {
        "appid": 730,
        "norender": 1,
        "count": 100,
        "start": 0
    }
    
    all_skins = []
    
    while True:
        try:
            response = httpx.get(url, params=params, timeout=10)
            data = response.json()
        except Exception as e:
            print(f"Request failed: {e}, retrying in 30 seconds...")
            time.sleep(30)
            continue

        if data is None or not data.get("results"):
            print("No results returned, likely rate limited. Waiting 60 seconds...")
            time.sleep(60)
            continue
            
        results = data.get("results", [])
        
        for item in results:
            all_skins.append(item["hash_name"])
            print(item["hash_name"])
        
        params["start"] += 100
        print(f"Fetched {len(all_skins)} skins so far...")

        # Save progress after every batch so you don't lose data
        with open("skins_list.json", "w") as f:
            json.dump(all_skins, f, indent=2)
        
        if len(all_skins) >= data.get("total_count", 0):
            break

        time.sleep(5)  # slightly longer delay to avoid rate limits
    
    print(f"Done! Saved {len(all_skins)} skins to skins_list.json")

if __name__ == "__main__":
    fetch_all_skins()