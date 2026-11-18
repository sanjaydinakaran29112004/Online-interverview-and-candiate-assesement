import os
import re
from typing import List, Dict, Optional, Tuple
from app.services.skill_extractor import SkillExtractor
from app.models.schemas import ResumeParseResponse, SkillExtractionResult

# Try importing PDF and DOCX parsers
try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

try:
    import docx
except ImportError:
    docx = None

class ResumeParser:
    @staticmethod
    def extract_text_from_file(file_path: str) -> str:
        if not os.path.exists(file_path):
            return ""

        ext = os.path.splitext(file_path)[1].lower()

        if ext == ".pdf" and PdfReader is not None:
            text = ""
            try:
                reader = PdfReader(file_path)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                return text.strip()
            except Exception as e:
                print(f"Error parsing PDF: {e}")
                return ""

        elif ext in [".docx", ".doc"] and docx is not None:
            try:
                doc = docx.Document(file_path)
                text = [p.text for p in doc.paragraphs if p.text]
                return "\n".join(text).strip()
            except Exception as e:
                print(f"Error parsing DOCX: {e}")
                return ""

        elif ext in [".txt", ".md"]:
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    return f.read().strip()
            except Exception as e:
                print(f"Error reading text file: {e}")
                return ""

        return ""

    @staticmethod
    def extract_education(text: str) -> List[str]:
        edu_patterns = [
            r"(?:b\.?\s?tech|bachelor of technology|b\.?\s?e|bachelor of engineering)",
            r"(?:b\.?\s?s\.?c?|bachelor of science)",
            r"(?:m\.?\s?tech|master of technology|m\.?\s?s\.?c?|master of science)",
            r"(?:m\.?\s?c\.?\s?a|b\.?\s?c\.?\s?a)",
            r"(?:ph\.?\s?d|doctor of philosophy)",
            r"(?:m\.?\s?b\.?\s?a|master of business administration)",
            r"(?:computer science|information technology|software engineering|data science)"
        ]
        found = []
        text_lower = text.lower()
        for pat in edu_patterns:
            matches = re.findall(pat, text_lower)
            if matches:
                found.append(matches[0].upper().replace("OF", "of"))
        return list(set(found))

    @staticmethod
    def extract_experience_years(text: str) -> float:
        # e.g., "5 years of experience", "3+ years", "over 4 years"
        patterns = [
            r'(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s*of)?\s*(?:experience|exp)',
            r'(?:experience|exp)\s*:\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)',
            r'(?:over|more than)\s*(\d+(?:\.\d+)?)\s*years?'
        ]
        for pat in patterns:
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                try:
                    return float(match.group(1))
                except ValueError:
                    pass
        return 0.0

    @staticmethod
    def extract_certifications(text: str) -> List[str]:
        cert_keywords = [
            "AWS Certified", "Solutions Architect", "Developer Associate",
            "Azure Certified", "Google Cloud Certified", "GCP Professional",
            "CKA", "Certified Kubernetes Administrator", "PMP", "Scrum Master",
            "CompTIA", "CISSP", "TensorFlow Developer"
        ]
        certs = []
        for ck in cert_keywords:
            if ck.lower() in text.lower():
                certs.append(ck)
        return certs

    @staticmethod
    def extract_contact_info(text: str) -> Dict[str, Optional[str]]:
        email_match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
        phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        linkedin_match = re.search(r'(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+', text)
        github_match = re.search(r'(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+', text)

        return {
            "email": email_match.group(0) if email_match else None,
            "phone": phone_match.group(0) if phone_match else None,
            "linkedin": linkedin_match.group(0) if linkedin_match else None,
            "github": github_match.group(0) if github_match else None,
        }

    @classmethod
    def parse_resume(cls, file_path: Optional[str] = None, raw_text: Optional[str] = None) -> ResumeParseResponse:
        text = raw_text or ""
        if file_path and not text:
            text = cls.extract_text_from_file(file_path)

        skills = SkillExtractor.extract_skills(text)
        education = cls.extract_education(text)
        experience_years = cls.extract_experience_years(text)
        certifications = cls.extract_certifications(text)
        contact_info = cls.extract_contact_info(text)

        return ResumeParseResponse(
            success=True,
            extracted_text=text,
            skills=skills,
            education=education,
            experience_years=experience_years,
            certifications=certifications,
            contact_info=contact_info
        )
