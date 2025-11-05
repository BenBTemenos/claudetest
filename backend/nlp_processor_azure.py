"""
Enhanced NLP Processor with Azure OpenAI Integration
Hybrid approach: Azure OpenAI (primary) + keyword-based NLP (fallback)
"""

from azure_openai_service import AzureOpenAIService
from nlp_processor import SeatAdvisorNLP
import os
from typing import Dict, List


class AzureNLPProcessor:
    """Hybrid NLP processor with Azure OpenAI + keyword-based fallback"""

    def __init__(self):
        """Initialize both Azure OpenAI and fallback NLP processors"""
        self.azure_service = None
        self.fallback_nlp = SeatAdvisorNLP()
        self.use_azure = os.getenv('ENABLE_AZURE_OPENAI', 'false').lower() == 'true'

        # Initialize Azure OpenAI if enabled
        if self.use_azure:
            try:
                self.azure_service = AzureOpenAIService()
                # Test connection
                if self.azure_service.test_connection():
                    print("✅ Azure OpenAI connected successfully")
                else:
                    print("⚠️ Azure OpenAI connection failed, using fallback")
                    self.use_azure = False
            except Exception as e:
                print(f"⚠️ Azure OpenAI initialization failed: {e}, using fallback")
                self.use_azure = False

    def process_message(
        self,
        message: str,
        conversation_history: List[Dict],
        current_preferences: Dict
    ) -> Dict:
        """
        Process user message with Azure OpenAI or fallback to keyword-based

        Args:
            message: User's input message
            conversation_history: Previous messages [{"role": "user|assistant", "content": "..."}]
            current_preferences: Current extracted preferences

        Returns:
            Dict with bot_message, preferences, ready_for_recommendations, confidence
        """
        # Try Azure OpenAI first if enabled
        if self.use_azure and self.azure_service:
            try:
                result = self.azure_service.chat(
                    user_message=message,
                    conversation_history=conversation_history,
                    current_preferences=current_preferences
                )

                # If successful and no error flag, return result
                if not result.get("error", False):
                    return result

            except Exception as e:
                print(f"Azure OpenAI processing failed: {e}, using fallback")

        # Fallback to keyword-based NLP
        return self._fallback_process(message, current_preferences)

    def _fallback_process(self, message: str, current_preferences: Dict) -> Dict:
        """
        Fallback to keyword-based NLP processing

        Args:
            message: User's input message
            current_preferences: Current extracted preferences

        Returns:
            Dict with bot_message, preferences, ready_for_recommendations, confidence
        """
        try:
            # Parse message with keyword-based NLP
            parsed = self.fallback_nlp.parse_message(message)

            # Generate response
            response = self.fallback_nlp.generate_response(
                message, parsed, current_preferences
            )

            # Merge preferences
            updated_prefs = {**current_preferences, **parsed['preferences']}

            # Check if ready for recommendations
            ready = self.fallback_nlp.has_sufficient_preferences(updated_prefs)

            return {
                "bot_message": response,
                "preferences": parsed['preferences'],
                "ready_for_recommendations": ready,
                "confidence": parsed['confidence']
            }

        except Exception as e:
            print(f"Fallback NLP error: {e}")
            return {
                "bot_message": "Sorry, I didn't quite understand that. Could you tell me about your budget or seat preferences?",
                "preferences": {},
                "ready_for_recommendations": False,
                "confidence": 0.0
            }
