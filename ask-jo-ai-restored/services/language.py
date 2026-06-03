def detect_language(text: str) -> str:
    """
    Detect if text is French or English.
    Returns 'fr' or 'en'.
    """
    text_lower = text.lower()

    french_indicators = [
        'je ', 'tu ', 'il ', 'elle ', 'nous ', 'vous ', 'ils ', 'elles ',
        'le ', 'la ', 'les ', 'un ', 'une ', 'des ',
        'est ', 'sont ', 'avoir ', 'être ',
        'bonjour', 'bonsoir', 'merci', 'oui', 'non', 'salut',
        'comment', 'pourquoi', 'quand', 'où', 'qui', 'quoi',
        'avec', 'pour', 'dans', 'sur', 'par', 'que ', 'qui ',
        'mon ', 'ma ', 'mes ', 'ton ', 'ta ', 'ses ', 'son ',
        "j'ai", "j'", "c'est", "qu'", "n'", "d'", "l'",
        'veux', 'peux', 'dois', 'aide', 'besoin', 'faire',
        'ça', 'très', 'aussi', 'mais', 'donc', 'alors',
    ]

    french_count = sum(1 for word in french_indicators if word in text_lower)

    return 'fr' if french_count >= 2 else 'en'