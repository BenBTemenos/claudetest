"""
Session Manager for Chat Conversations
Manages user sessions with conversation history and preferences
"""

import time
import uuid
from typing import Dict, Optional, List


class SessionManager:
    """Manage user chat sessions with conversation history"""

    def __init__(self, timeout_minutes=30):
        """
        Initialize session manager

        Args:
            timeout_minutes: Session timeout in minutes (default: 30)
        """
        self.sessions = {}
        self.timeout_seconds = timeout_minutes * 60

    def create_session(self) -> str:
        """
        Create new session and return session ID

        Returns:
            str: New session ID (UUID)
        """
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            "created_at": time.time(),
            "last_active": time.time(),
            "conversation_history": [],
            "preferences": {}
        }
        return session_id

    def get_session(self, session_id: str) -> Optional[Dict]:
        """
        Get session data, cleanup expired sessions

        Args:
            session_id: Session identifier

        Returns:
            Dict with session data or None if not found/expired
        """
        self._cleanup_expired()

        if session_id not in self.sessions:
            return None

        # Update last active time
        self.sessions[session_id]["last_active"] = time.time()
        return self.sessions[session_id]

    def update_session(
        self,
        session_id: str,
        user_message: str,
        bot_response: str,
        preferences: Dict
    ) -> str:
        """
        Update session with new message and preferences

        Args:
            session_id: Session identifier
            user_message: User's message
            bot_response: Bot's response
            preferences: Extracted preferences to merge

        Returns:
            str: Session ID (creates new if not exists)
        """
        # Create session if doesn't exist
        if session_id not in self.sessions:
            session_id = self.create_session()

        session = self.sessions[session_id]
        session["last_active"] = time.time()

        # Add to conversation history
        session["conversation_history"].append({
            "role": "user",
            "content": user_message
        })
        session["conversation_history"].append({
            "role": "assistant",
            "content": bot_response
        })

        # Keep only last 20 messages (10 exchanges) to manage memory
        if len(session["conversation_history"]) > 20:
            session["conversation_history"] = session["conversation_history"][-20:]

        # Merge preferences (new values override old)
        session["preferences"].update(preferences)

        return session_id

    def get_conversation_history(self, session_id: str) -> List[Dict]:
        """
        Get conversation history for a session

        Args:
            session_id: Session identifier

        Returns:
            List of message dicts with role and content
        """
        session = self.get_session(session_id)
        if session:
            return session["conversation_history"]
        return []

    def get_preferences(self, session_id: str) -> Dict:
        """
        Get current preferences for a session

        Args:
            session_id: Session identifier

        Returns:
            Dict of current preferences
        """
        session = self.get_session(session_id)
        if session:
            return session["preferences"]
        return {}

    def clear_session(self, session_id: str) -> bool:
        """
        Clear/delete a specific session

        Args:
            session_id: Session identifier

        Returns:
            bool: True if deleted, False if not found
        """
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False

    def _cleanup_expired(self):
        """Remove expired sessions based on timeout"""
        now = time.time()
        expired = [
            sid for sid, data in self.sessions.items()
            if now - data["last_active"] > self.timeout_seconds
        ]
        for sid in expired:
            del self.sessions[sid]

        if expired:
            print(f"🧹 Cleaned up {len(expired)} expired session(s)")

    def get_active_session_count(self) -> int:
        """
        Get count of active sessions

        Returns:
            int: Number of active sessions
        """
        self._cleanup_expired()
        return len(self.sessions)
