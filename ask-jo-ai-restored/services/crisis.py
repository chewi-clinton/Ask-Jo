import json
import os
from typing import Optional

# Load keywords at module level
_keywords_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'crisis_keywords.json')
with open(_keywords_path, 'r', encoding='utf-8') as f:
    CRISIS_KEYWORDS = json.load(f)

CAMEROON_RESOURCES = {
    "en": [
        {
            "name": "Cameroon Mental Health Line",
            "type": "hotline",
            "phone": "+237 222 22 15 00",
            "description": "National mental health support line"
        },
        {
            "name": "Yaoundé Central Hospital - Psychiatry",
            "type": "hospital",
            "address": "Yaoundé Central Hospital, Yaoundé",
            "phone": "+237 222 23 40 12"
        },
        {
            "name": "Douala General Hospital - Mental Health",
            "type": "hospital",
            "address": "Douala General Hospital, Douala",
            "phone": "+237 233 42 35 35"
        },
        {
            "name": "Emergency Services",
            "type": "emergency",
            "phone": "117",
            "description": "National emergency number"
        }
    ],
    "fr": [
        {
            "name": "Ligne de Santé Mentale du Cameroun",
            "type": "hotline",
            "phone": "+237 222 22 15 00",
            "description": "Ligne nationale de soutien en santé mentale"
        },
        {
            "name": "Hôpital Central de Yaoundé - Psychiatrie",
            "type": "hospital",
            "address": "Hôpital Central de Yaoundé, Yaoundé",
            "phone": "+237 222 23 40 12"
        },
        {
            "name": "Hôpital Général de Douala - Santé Mentale",
            "type": "hospital",
            "address": "Hôpital Général de Douala, Douala",
            "phone": "+237 233 42 35 35"
        },
        {
            "name": "Services d'Urgence",
            "type": "emergency",
            "phone": "117",
            "description": "Numéro d'urgence national"
        }
    ]
}


def check_crisis(message: str, recent_history: list) -> dict:
    """
    Scan message and recent history for crisis signals.
    Returns: { flagged: bool, category: str|None, severity: str }
    """
    # Combine current message with last 3 history messages
    texts_to_scan = [message.lower()]
    for msg in recent_history[-3:]:
        texts_to_scan.append(msg.get('content', '').lower())

    combined_text = ' '.join(texts_to_scan)

    for category, keywords_by_lang in CRISIS_KEYWORDS.items():
        for lang, keywords in keywords_by_lang.items():
            for keyword in keywords:
                if keyword.lower() in combined_text:
                    severity = 'high' if category == 'suicidal' else 'medium'
                    return {
                        'flagged': True,
                        'category': category,
                        'severity': severity,
                    }

    return {
        'flagged': False,
        'category': None,
        'severity': 'none',
    }


def get_crisis_resources(language: str) -> list:
    """Return crisis resources in the appropriate language."""
    return CAMEROON_RESOURCES.get(language, CAMEROON_RESOURCES['en'])