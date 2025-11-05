"""
Keyword-based NLP Processor for Seat Advisor
Extracts user preferences from natural language without external APIs
"""

import re
import random


class SeatAdvisorNLP:
    """Extract preferences and generate responses from natural language"""

    def __init__(self):
        self.response_templates = {
            'greeting': [
                "Hi! I'd love to help you find the perfect seat. What are you looking for?",
                "Hello! Tell me what kind of seat you're interested in.",
                "Hey there! What seat features are important to you?"
            ],
            'budget_understood': [
                "Got it! Looking for seats up to ${budget}.",
                "Perfect! I'll focus on seats within your ${budget} budget.",
                "Understood - ${budget} maximum. What else is important?"
            ],
            'ac_understood': [
                "Noted - air conditioning is {importance} for you.",
                "AC preference recorded as {importance}.",
            ],
            'view_understood': [
                "Great! {importance} view quality is noted.",
                "Got it - view quality is {importance} to you.",
            ],
            'location_understood': [
                "Perfect! Looking at {location} seats.",
                "Understood - {location} section preference noted.",
            ],
            'need_more_info': [
                "That helps! Anything else? (budget, AC, view quality, location)",
                "Thanks! Any other preferences like price range or features?",
                "Good to know! What else matters to you?"
            ],
            'ready_for_recommendations': [
                "Perfect! I have enough info. Let me find the best seats for you! 🔍",
                "Great! Searching for your ideal seats now... ✨",
                "Excellent! Let me pull up the top recommendations for you!"
            ],
            'clarification_needed': [
                "Could you tell me more about what you're looking for?",
                "I want to help! Can you specify your preferences? (budget, AC, view, location)",
                "Let me know your priorities - price? features? location?"
            ]
        }

    def parse_message(self, message):
        """
        Extract preferences from user message using keyword matching

        Returns:
            dict: Extracted preferences and metadata
        """
        message_lower = message.lower()
        preferences = {}
        extracted_info = []

        # Budget extraction
        budget = self._extract_budget(message)
        if budget:
            preferences['budget_max'] = budget
            extracted_info.append('budget')

        # AC extraction
        ac_importance = self._extract_ac_importance(message_lower)
        if ac_importance:
            preferences['ac_importance'] = ac_importance
            extracted_info.append('ac')

        # View importance extraction
        view_importance = self._extract_view_importance(message_lower)
        if view_importance is not None:
            preferences['view_importance'] = view_importance
            extracted_info.append('view')

        # Famous people interest
        if self._mentions_famous(message_lower):
            preferences['famous_people'] = True
            extracted_info.append('famous')

        # Position preference
        position = self._extract_position(message_lower)
        if position:
            preferences['position_preference'] = position
            extracted_info.append('position')

        # Location preference
        location = self._extract_location(message_lower)
        if location:
            preferences['location_preference'] = location
            extracted_info.append('location')

        return {
            'preferences': preferences,
            'extracted_info': extracted_info,
            'confidence': self._calculate_confidence(extracted_info),
            'is_greeting': self._is_greeting(message_lower)
        }

    def _extract_budget(self, message):
        """Extract budget from message"""
        # Look for $XXX pattern
        dollar_match = re.search(r'\$\s*(\d+)', message)
        if dollar_match:
            return int(dollar_match.group(1))

        # Look for "XXX dollars"
        dollar_word_match = re.search(r'(\d+)\s*dollars?', message, re.I)
        if dollar_word_match:
            return int(dollar_word_match.group(1))

        # Look for keywords
        if re.search(r'\b(cheap|budget|affordable|inexpensive|low cost)\b', message, re.I):
            return 200  # Default cheap
        if re.search(r'\b(expensive|premium|luxury|high.end)\b', message, re.I):
            return 600  # Default premium
        if re.search(r'\b(mid.range|moderate|average)\b', message, re.I):
            return 400  # Default mid-range

        # Look for "under XXX"
        under_match = re.search(r'under\s+(\d+)', message, re.I)
        if under_match:
            return int(under_match.group(1))

        return None

    def _extract_ac_importance(self, message_lower):
        """Extract AC importance"""
        # Required keywords
        if re.search(r'\b(need|must|require|essential|necessary)\b.*\b(ac|air.conditioning|cooling|cool)', message_lower):
            return 'required'
        if re.search(r'\b(ac|air.conditioning|cooling)\b.*\b(need|must|require|essential)', message_lower):
            return 'required'

        # Preferred keywords
        if re.search(r'\b(prefer|like|want|would like)\b.*\b(ac|air.conditioning|cooling)', message_lower):
            return 'preferred'
        if re.search(r'\b(ac|air.conditioning|cooling)\b.*\b(prefer|nice|good)', message_lower):
            return 'preferred'

        # Just mentioned
        if re.search(r'\b(ac|air.conditioning|cooling|cool|cold)\b', message_lower):
            return 'preferred'

        # Don't care
        if re.search(r'(don.?t|doesn.?t|no|not).*\b(care|matter|important)\b.*\b(ac|air)', message_lower):
            return 'optional'

        return None

    def _extract_view_importance(self, message_lower):
        """Extract view importance (0-10)"""
        # Excellent view
        if re.search(r'\b(excellent|perfect|amazing|best|great|fantastic|outstanding)\b.*\bview\b', message_lower):
            return 10
        if re.search(r'\bview\b.*\b(excellent|perfect|amazing|best|great|fantastic|critical|essential)', message_lower):
            return 10

        # Good view
        if re.search(r'\b(good|nice|decent)\b.*\bview\b', message_lower):
            return 7
        if re.search(r'\bview\b.*\b(good|nice|decent|important)', message_lower):
            return 7

        # Don't care about view
        if re.search(r'(don.?t|doesn.?t|not).*\b(care|matter|important)\b.*\bview\b', message_lower):
            return 3
        if re.search(r'\bview\b.*(don.?t|doesn.?t|not).*\b(care|matter|important)', message_lower):
            return 3

        # Just mentioned view
        if re.search(r'\b(view|see|watch|look|visibility)\b', message_lower):
            return 7

        return None

    def _mentions_famous(self, message_lower):
        """Check if user mentions famous people"""
        return bool(re.search(r'\b(famous|celebrity|historic|history|notable|renowned|legend)', message_lower))

    def _extract_position(self, message_lower):
        """Extract seating position preference"""
        if re.search(r'\b(aisle|end|edge|side)\b', message_lower):
            return 'aisle'
        if re.search(r'\b(center|centre|middle)\b', message_lower):
            return 'center'
        return None

    def _extract_location(self, message_lower):
        """Extract location preference"""
        if re.search(r'\b(front|close.*stage|near.*stage|up front|forward)\b', message_lower):
            return 'front'
        if re.search(r'\b(back|rear|far.*stage|behind)\b', message_lower):
            return 'back'
        if re.search(r'\b(middle|center|centre|mid)\b', message_lower):
            return 'middle'
        return None

    def _is_greeting(self, message_lower):
        """Check if message is a greeting"""
        greetings = ['hi', 'hello', 'hey', 'howdy', 'greetings', 'good morning', 'good afternoon']
        return any(greeting in message_lower for greeting in greetings)

    def _calculate_confidence(self, extracted_info):
        """Calculate confidence score based on extracted information"""
        if not extracted_info:
            return 0.0

        # More info = higher confidence
        confidence_map = {
            1: 0.5,
            2: 0.7,
            3: 0.85,
            4: 0.9,
            5: 0.95
        }

        count = len(extracted_info)
        return confidence_map.get(count, 1.0)

    def generate_response(self, user_message, parsed_data, current_preferences):
        """
        Generate a conversational response

        Args:
            user_message: Original user message
            parsed_data: Parsed data from parse_message()
            current_preferences: Current preference state

        Returns:
            str: Bot response message
        """
        extracted = parsed_data['extracted_info']
        preferences = parsed_data['preferences']

        # Handle greeting
        if parsed_data['is_greeting'] and not extracted:
            return random.choice(self.response_templates['greeting'])

        # Build response based on what was extracted
        responses = []

        if 'budget' in extracted:
            budget = preferences['budget_max']
            template = random.choice(self.response_templates['budget_understood'])
            responses.append(template.replace('${budget}', f'${budget}'))

        if 'ac' in extracted:
            importance = preferences['ac_importance']
            template = random.choice(self.response_templates['ac_understood'])
            responses.append(template.replace('{importance}', importance))

        if 'view' in extracted:
            view_score = preferences['view_importance']
            importance_text = 'very important' if view_score >= 8 else 'somewhat important' if view_score >= 5 else 'not very important'
            template = random.choice(self.response_templates['view_understood'])
            responses.append(template.replace('{importance}', importance_text))

        if 'location' in extracted:
            location = preferences['location_preference']
            template = random.choice(self.response_templates['location_understood'])
            responses.append(template.replace('{location}', location))

        if 'famous' in extracted:
            responses.append("Noted - seats with historical significance!")

        if 'position' in extracted:
            position = preferences['position_preference']
            responses.append(f"Looking for {position} seats.")

        # Add follow-up based on how much we know
        if not responses:
            return random.choice(self.response_templates['clarification_needed'])

        # Check if we have enough for recommendations
        has_sufficient_info = self._has_sufficient_info(current_preferences)

        if has_sufficient_info:
            responses.append(random.choice(self.response_templates['ready_for_recommendations']))
        else:
            responses.append(random.choice(self.response_templates['need_more_info']))

        return ' '.join(responses)

    def _has_sufficient_info(self, preferences):
        """Check if we have enough information for recommendations"""
        # At minimum, we need budget or some feature preference
        has_budget = preferences.get('budget_max') is not None
        has_features = any([
            preferences.get('ac_importance') and preferences['ac_importance'] != 'optional',
            preferences.get('view_importance', 0) > 0,
            preferences.get('location_preference') is not None,
            preferences.get('famous_people') is True
        ])

        return has_budget or (has_features and len(preferences) >= 2)

    def has_sufficient_preferences(self, preferences):
        """Public method to check if ready for recommendations"""
        return self._has_sufficient_info(preferences)
