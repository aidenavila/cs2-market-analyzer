WEAPON_CATEGORIES = {
    "pistol": ["glock", "usp-s", "p2000", "p250", "five-seven", "tec-9",
               "cz75", "desert eagle", "dual berettas", "r8 revolver", "zeus x27"],
    "smg": ["mac-10", "mp9", "mp7", "mp5-sd", "ump-45", "p90", "pp-bizon"],
    "heavy": ["nova", "xm1014", "sawed-off", "mag-7", "m249", "negev"],
    "rifle": ["ak-47", "m4a4", "m4a1-s", "galil", "famas", "sg 553",
              "aug", "awp", "ssg 08", "scar-20", "g3sg1"],
}

# category for non-weapon items (order matters, checked top to bottom)
KEYWORD_CATEGORIES = [
    ("charm", "charm"),
    ("graffiti", "graffiti"),
    ("music kit", "music_kit"),
    ("capsule", "container"),
    ("package", "container"),
    ("agent", "agent"),
    ("pin", "pin"),
    ("holo-foil", "sticker")
]

def categorize_skin(name: str) -> str:
    name_lower = name.lower()

    # Knives and gloves start with star symbol
    if name.startswith("★"):
        return "gloves" if ("gloves" in name_lower or "hand wraps" in name_lower) else "knife"

    # Prefix-based items
    if name_lower.startswith("sticker"):
        return "sticker"
    if name_lower.startswith("patch"):
        return "patch"

    # Cases (but not "Case Hardened" which is a skin finish to fix a possible bug)
    if "case" in name_lower and "hardened" not in name_lower:
        return "case"

    # Keyword matches
    for keyword, category in KEYWORD_CATEGORIES:
        if keyword in name_lower:
            return category

    # Weapon matches
    for category, weapons in WEAPON_CATEGORIES.items():
        if any(weapon in name_lower for weapon in weapons):
            return category

    return "other"