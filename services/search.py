from decouple import config
from tavily import TavilyClient

_client = None


def get_client():
    global _client
    if _client is None:
        _client = TavilyClient(api_key=config('TAVILY_API_KEY'))
    return _client


def should_search(message: str) -> bool:
    """
    Determine if this message needs a live web search.
    Only search for location/resource/program specific queries.
    """
    message_lower = message.lower()

    search_triggers = [
        # English
        'office', 'ngo', 'organization', 'centre', 'center', 'agency',
        'program', 'programme', 'government', 'ministry', 'register',
        'registration', 'scholarship', 'loan', 'fund', 'grant',
        'employment', 'job', 'work', 'business', 'start', 'create',
        'hospital', 'clinic', 'health', 'counsellor', 'counselor',
        'where', 'how to', 'how do', 'nearest', 'close to', 'near',
        # French
        'bureau', 'organisation', 'centre', 'agence', 'ministère',
        'programme', 'gouvernement', 'inscrire', 'inscription',
        'bourse', 'prêt', 'financement', 'subvention',
        'emploi', 'travail', 'entreprise', 'créer', 'démarrer',
        'hôpital', 'clinique', 'santé', 'conseiller',
        'où', 'comment', 'près de', 'proche',
    ]

    return any(trigger in message_lower for trigger in search_triggers)


def search_resources(query: str, location: str = '') -> list:
    """
    Search for relevant resources using Tavily.
    Returns list of { title, url, snippet } dicts.
    """
    try:
        search_query = f"{query} Cameroun {location}".strip() if location else f"{query} Cameroun"
        client = get_client()
        response = client.search(
            query=search_query,
            search_depth="basic",
            max_results=3,
        )
        results = []
        for r in response.get('results', []):
            results.append({
                'title': r.get('title', ''),
                'url': r.get('url', ''),
                'snippet': r.get('content', '')[:300],
            })
        return results
    except Exception:
        return []