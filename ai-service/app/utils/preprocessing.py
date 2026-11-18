import re
from typing import List, Set, Dict

# Comprehensive standard skill taxonomy
TAXONOMY_LANGUAGES: Set[str] = {
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "golang",
    "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "dart", "sql", "bash", "html", "css"
}

TAXONOMY_FRAMEWORKS: Set[str] = {
    "react", "react.js", "next.js", "vue", "vue.js", "angular", "node.js", "express", "express.js",
    "fastapi", "django", "flask", "spring", "spring boot", "asp.net", "laravel",
    "tailwind", "tailwind css", "bootstrap", "redux", "graphql", "rest api"
}

TAXONOMY_DATABASES: Set[str] = {
    "postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite",
    "cassandra", "dynamodb", "elasticsearch", "oracle", "mariadb", "firebase", "supabase", "prisma"
}

TAXONOMY_DEVOPS_CLOUD: Set[str] = {
    "docker", "kubernetes", "k8s", "aws", "amazon web services", "azure", "gcp",
    "google cloud platform", "ci/cd", "github actions", "gitlab ci", "terraform",
    "ansible", "jenkins", "linux", "nginx", "webrtc", "socket.io"
}

TAXONOMY_TOOLS: Set[str] = {
    "git", "github", "gitlab", "jira", "postman", "figma", "jest", "pytest", "vitest", "docker compose"
}

ALL_KNOWN_SKILLS: Set[str] = TAXONOMY_LANGUAGES | TAXONOMY_FRAMEWORKS | TAXONOMY_DATABASES | TAXONOMY_DEVOPS_CLOUD | TAXONOMY_TOOLS

STOPWORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
    "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
    "but", "by", "can", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does",
    "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had",
    "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her",
    "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd",
    "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself",
    "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off",
    "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
    "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some",
    "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then",
    "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those",
    "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll",
    "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's",
    "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't",
    "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"
}

def clean_text(text: str) -> str:
    """Normalize text: lowercase, strip extra whitespace, retain alphanumerics and essential symbols."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'[\r\n\t]+', ' ', text)
    text = re.sub(r'[^\w\s\.\+\#\-]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def tokenize(text: str) -> List[str]:
    """Tokenize and remove common stopwords."""
    cleaned = clean_text(text)
    tokens = [t.strip('.,-') for t in cleaned.split() if t.strip('.,-')]
    return [t for t in tokens if t not in STOPWORDS and len(t) > 1]

def extract_ngrams(tokens: List[str], n: int = 2) -> List[str]:
    """Generate n-grams from token list."""
    return [" ".join(tokens[i:i+n]) for i in range(len(tokens) - n + 1)]
