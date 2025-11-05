"""
Azure OpenAI Service for Seat Advisor Chat
Provides natural language understanding using GPT-4o-mini
"""

from openai import AzureOpenAI
import os
import json
from typing import List, Dict, Optional
from dotenv import load_dotenv

# Load environment variables from APIKEY.env
load_dotenv('APIKEY.env')


class AzureOpenAIService:
    """Service for Azure OpenAI chat completions"""

    def __init__(self):
        """Initialize Azure OpenAI client"""
        self.client = AzureOpenAI(
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2025-01-01-preview"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            api_key=os.getenv("AZURE_OPENAI_KEY"),
        )
        self.deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini")
        self.system_prompt = self._build_system_prompt()

    def _build_system_prompt(self) -> str:
        """Build the system prompt for the seat advisor"""
        return """You are an expert Seat Advisor for a theater venue. Your personality is friendly, helpful, and conversational.

Your role:
1. Understand user preferences through natural conversation
2. Ask clarifying questions when information is ambiguous or incomplete
3. Extract structured preferences from user messages
4. Be concise but warm in your responses (2-3 sentences max)
5. Guide users toward making a booking decision

Available seat features:
- Price range: $100-$600 per year
- Air Conditioning: Some seats have AC, others don't
- View quality: Rated 0-10 (higher is better)
- Locations: Front (close to stage), Middle (balanced), Back (overview)
- Positions: Aisle (easy access), Center (best view)
- Special feature: Some seats have historical significance (famous people sat there)

IMPORTANT: Always respond with valid JSON in this exact format:
{
  "bot_message": "Your friendly conversational response to the user",
  "preferences": {
    "budget_max": 400,
    "ac_importance": "required",
    "view_importance": 8,
    "famous_people": false,
    "position_preference": "aisle",
    "location_preference": "front"
  },
  "ready_for_recommendations": false,
  "confidence": 0.85
}

Preference extraction rules:
- budget_max: number (extract from "$400", "under 300", "cheap" = 200, "expensive" = 600)
- ac_importance: "required" | "preferred" | "optional" (default: "optional")
- view_importance: 0-10 number (default: 5, "great view" = 9-10, "doesn't matter" = 0-3)
- famous_people: true | false (only true if explicitly mentioned)
- position_preference: "aisle" | "center" | null
- location_preference: "front" | "middle" | "back" | null

REFINEMENT HANDLING:
When user asks to refine existing results (cheaper, better view, etc.):
- "cheaper" / "show me cheaper" → REDUCE budget_max by 20-30% from current value
- "better view" / "great view" → INCREASE view_importance by 2-3 points
- "with AC" / "air conditioning" → SET ac_importance to "required"
- "front section" → SET location_preference to "front"
- "no AC needed" / "AC not important" → SET ac_importance to "optional"
ALWAYS set ready_for_recommendations to TRUE when refining existing results!

Set ready_for_recommendations to true when you have:
- Budget + at least 2 other preferences, OR
- At least 3 preferences total (not counting famous_people), OR
- User is refining existing results (asking for cheaper, better, etc.)

Confidence score (0.0-1.0):
- 0.9-1.0: Very clear preferences stated
- 0.7-0.9: Good understanding, minor ambiguity
- 0.5-0.7: Some preferences extracted but need clarification
- Below 0.5: Very vague, ask clarifying questions

Examples:

User: "I need a cheap seat with AC"
Response:
{
  "bot_message": "Got it! Looking for affordable seats with air conditioning. What's your max budget per year?",
  "preferences": {"budget_max": 200, "ac_importance": "required"},
  "ready_for_recommendations": false,
  "confidence": 0.7
}

User: "Under $400, AC is a must, and I want a great view"
Response:
{
  "bot_message": "Perfect! I'll find you seats under $400 with AC and excellent views. Let me pull up the best options! 🎯",
  "preferences": {"budget_max": 400, "ac_importance": "required", "view_importance": 9},
  "ready_for_recommendations": true,
  "confidence": 0.95
}

User: "Something with a good view, not too expensive"
Response:
{
  "bot_message": "I can help! What's your budget? Under $300, $400, or more?",
  "preferences": {"view_importance": 7},
  "ready_for_recommendations": false,
  "confidence": 0.6
}

User: "show me cheaper options" (when current budget_max is 400)
Response:
{
  "bot_message": "Sure! Let me find you more affordable options under $300. 💰",
  "preferences": {"budget_max": 280},
  "ready_for_recommendations": true,
  "confidence": 0.9
}"""

    def chat(
        self,
        user_message: str,
        conversation_history: List[Dict],
        current_preferences: Dict
    ) -> Dict:
        """
        Send message to Azure OpenAI and get structured response

        Args:
            user_message: User's input message
            conversation_history: Previous messages [{"role": "user|assistant", "content": "..."}]
            current_preferences: Current extracted preferences

        Returns:
            Dict with bot_message, preferences, ready_for_recommendations, confidence
        """
        try:
            # Build messages for API
            messages = [{"role": "system", "content": self.system_prompt}]

            # Add conversation history (limit to last 10 messages for context window)
            messages.extend(conversation_history[-10:])

            # Add current user message with context
            context_info = f"\n\n[Current user preferences: {json.dumps(current_preferences)}]"
            messages.append({
                "role": "user",
                "content": user_message + context_info
            })

            # Call Azure OpenAI API
            response = self.client.chat.completions.create(
                model=self.deployment,
                messages=messages,
                temperature=0.7,
                max_tokens=500,
                response_format={"type": "json_object"}  # Force JSON output
            )

            # Parse JSON response
            content = response.choices[0].message.content
            result = json.loads(content)

            # Validate response structure
            if not all(key in result for key in ["bot_message", "preferences", "ready_for_recommendations"]):
                raise ValueError("Invalid response structure from Azure OpenAI")

            return {
                "bot_message": result.get("bot_message", ""),
                "preferences": result.get("preferences", {}),
                "ready_for_recommendations": result.get("ready_for_recommendations", False),
                "confidence": result.get("confidence", 0.8)
            }

        except json.JSONDecodeError as e:
            print(f"JSON decode error: {str(e)}, Content: {content}")
            return self._error_response("I had trouble understanding that. Could you rephrase?")

        except Exception as e:
            print(f"Azure OpenAI error: {str(e)}")
            return self._error_response("Sorry, I'm having technical difficulties. Please try again.")

    def _error_response(self, message: str) -> Dict:
        """Generate error response"""
        return {
            "bot_message": message,
            "preferences": {},
            "ready_for_recommendations": False,
            "confidence": 0.0,
            "error": True
        }

    def test_connection(self) -> bool:
        """Test Azure OpenAI connection"""
        try:
            response = self.client.chat.completions.create(
                model=self.deployment,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10
            )
            return True
        except Exception as e:
            print(f"Connection test failed: {str(e)}")
            return False
