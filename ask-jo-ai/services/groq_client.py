from groq import Groq
from decouple import config

_client = None


def get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=config('GROQ_API_KEY'))
    return _client


def generate_response(system_prompt: str, messages: list) -> str:
    """
    Call Groq API with Llama 3.3 70B.
    Falls back to a safe error message if it fails.
    """
    try:
        client = get_client()
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                *messages
            ],
            max_tokens=1024,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        return (
            "I'm having a little trouble right now, but I'm here for you. "
            "Please try again in a moment. / "
            "J'ai un petit problème en ce moment, mais je suis là pour vous. "
            "Veuillez réessayer dans un instant."
        )