from pydantic import BaseModel

class Record(BaseModel):
    name: str
    description: str

class PromptRequest(BaseModel):
    prompt: str

class GenerateRequest(BaseModel):
    question: str
    records: list[Record]