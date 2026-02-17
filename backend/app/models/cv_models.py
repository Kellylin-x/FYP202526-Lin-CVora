from pydantic import BaseModel, EmailStr
from typing import List, Optional


class CVContact(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None


class CVData(BaseModel):
    contact: CVContact
    summary: Optional[str] = None
    skills: List[str] = []
