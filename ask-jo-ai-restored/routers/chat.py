from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.language import detect_language
from services.crisis import check_crisis, get_crisis_resources
from services.search import should_search, search_resources
from services.groq_client import generate_response
from services.prompt_builder import build_system_prompt

router = APIRouter()


class Message(BaseModel):
    role: str
    content: str


class UserContext(BaseModel):
    preferred_language: Optional[str] = 'en'
    location: Optional[str] = ''
    age_range: Optional[str] = ''


class ChatRequest(BaseModel):
    message: str
    conversation_history: list[Message] = []
    user_context: Optional[UserContext] = None


class Source(BaseModel):
    title: str
    url: str
    snippet: str = ''


class ChatResponse(BaseModel):
    reply: str
    language_detected: str
    crisis_flagged: bool
    sources: list[Source] = []
    resources: list[dict] = []


@router.post('/chat/', response_model=ChatResponse)
async def chat(request: ChatRequest):
    message = request.message
    history = [{'role': m.role, 'content': m.content} for m in request.conversation_history]
    user_context = request.user_context.model_dump() if request.user_context else {}

    # Step 1: Detect language
    language = detect_language(message)
    # Override with user preference if set
    if user_context.get('preferred_language') and language == 'en':
        language = user_context.get('preferred_language', 'en')

    # Step 2: Crisis detection
    crisis_result = check_crisis(message, history)
    crisis_flagged = crisis_result['flagged']

    # Step 3: Web search if needed
    sources = []
    if should_search(message):
        location = user_context.get('location', '')
        sources = search_resources(message, location)

    # Step 4: Build system prompt
    system_prompt = build_system_prompt(
        user_context=user_context,
        crisis_flagged=crisis_flagged,
        language=language,
        sources=sources,
    )

    # Step 5: Build messages for LLM
    llm_messages = history + [{'role': 'user', 'content': message}]

    # Step 6: Generate response
    reply = generate_response(system_prompt, llm_messages)

    # Step 7: Append crisis resources if flagged
    resources = []
    if crisis_flagged:
        resources = get_crisis_resources(language)

    return ChatResponse(
        reply=reply,
        language_detected=language,
        crisis_flagged=crisis_flagged,
        sources=[Source(**s) for s in sources],
        resources=resources,
    )