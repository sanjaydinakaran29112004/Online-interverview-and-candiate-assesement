from typing import List, Dict, Set, Any
from app.utils.preprocessing import (
    clean_text, tokenize, extract_ngrams,
    ALL_KNOWN_SKILLS, TAXONOMY_LANGUAGES, TAXONOMY_FRAMEWORKS,
    TAXONOMY_DATABASES, TAXONOMY_DEVOPS_CLOUD, TAXONOMY_TOOLS
)
from app.models.schemas import SkillExtractionResult

class SkillExtractor:
    @staticmethod
    def extract_skills(text: str) -> SkillExtractionResult:
        if not text:
            return SkillExtractionResult(all_skills=[])

        cleaned = clean_text(text)
        tokens = tokenize(cleaned)
        bigrams = extract_ngrams(tokens, 2)
        trigrams = extract_ngrams(tokens, 3)

        found_skills: Set[str] = set()

        # Check 1-grams
        for token in tokens:
            if token in ALL_KNOWN_SKILLS:
                found_skills.add(token)

        # Check 2-grams (e.g. "react js", "node js", "tailwind css", "spring boot", "rest api")
        for bg in bigrams:
            if bg in ALL_KNOWN_SKILLS:
                found_skills.add(bg)

        # Check 3-grams (e.g. "amazon web services", "google cloud platform")
        for tg in trigrams:
            if tg in ALL_KNOWN_SKILLS:
                found_skills.add(tg)

        # Additional regex patterns for C++, C#, .NET
        raw_lower = text.lower()
        if re_match := ["c++" if "c++" in raw_lower else None,
                        "c#" if "c#" in raw_lower else None,
                        ".net" if ".net" in raw_lower else None]:
            for r in re_match:
                if r:
                    found_skills.add(r)

        languages = sorted(list(found_skills & TAXONOMY_LANGUAGES))
        frameworks = sorted(list(found_skills & TAXONOMY_FRAMEWORKS))
        databases = sorted(list(found_skills & TAXONOMY_DATABASES))
        devops_cloud = sorted(list(found_skills & TAXONOMY_DEVOPS_CLOUD))
        tools = sorted(list(found_skills & TAXONOMY_TOOLS))
        all_skills = sorted(list(found_skills))

        return SkillExtractionResult(
            all_skills=all_skills,
            languages=languages,
            frameworks=frameworks,
            databases=databases,
            devops_cloud=devops_cloud,
            tools=tools
        )

    @staticmethod
    def compare_skills(candidate_skills: List[str], required_skills: List[str]) -> Dict[str, Any]:
        cand_set = {s.lower().strip() for s in candidate_skills}
        req_set = {s.lower().strip() for s in required_skills}

        matched = sorted(list(cand_set & req_set))
        missing = sorted(list(req_set - cand_set))

        coverage = (len(matched) / len(req_set) * 100.0) if req_set else 100.0

        return {
            "matched_skills": matched,
            "missing_skills": missing,
            "coverage_pct": round(coverage, 2)
        }
