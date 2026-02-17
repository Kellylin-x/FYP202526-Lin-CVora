from typing import List


def match_keywords(text: str, keywords: List[str]) -> List[str]:
    """Return list of keywords found in text (simple, case-insensitive)."""
    found = []
    lower = text.lower()
    for kw in keywords:
        if kw.lower() in lower:
            found.append(kw)
    return found
