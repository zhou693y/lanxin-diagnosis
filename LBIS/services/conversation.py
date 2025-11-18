# liver_bis/services/conversation.py
import uuid
from typing import Dict, List

class ConversationManager:
    def __init__(self, max_history: int = 6):
        self.sessions: Dict[str, List[Dict]] = {}
        self.max_history = max_history

    def create_session(self) -> str:
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = []
        return session_id

    def add_message(self, session_id: str, role: str, content: str):
        if session_id not in self.sessions:
            raise ValueError("Invalid session ID")
        self.sessions[session_id].append({"role": role, "content": content})
        self.sessions[session_id] = self.sessions[session_id][-self.max_history:]

    def get_history(self, session_id: str) -> List[Dict]:
        return self.sessions.get(session_id, [])