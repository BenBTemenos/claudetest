"""
AI Seat Recommendation Engine
Provides intelligent seat recommendations based on user preferences
"""

class SeatRecommender:
    """Recommends seats based on user preferences and seat attributes"""

    def __init__(self, seats):
        """
        Initialize recommender with available seats

        Args:
            seats: List of seat dictionaries with all attributes
        """
        self.all_seats = seats
        self.available_seats = [s for s in seats if s['is_available'] == 1]

    def score_seat(self, seat, preferences):
        """
        Score a seat based on user preferences

        Args:
            seat: Seat dictionary
            preferences: Dictionary with user preferences
                - budget_max: Maximum price willing to pay
                - budget_min: Minimum price (for quality indication)
                - ac_required: Boolean for AC requirement
                - view_importance: 0-10 how important view is
                - famous_people: Boolean if interested in historical seats
                - position_preference: 'aisle', 'center', or None
                - location_preference: 'front', 'middle', 'back', or None

        Returns:
            tuple: (score, explanation_parts)
        """
        score = 0
        explanation = []
        max_score = 0

        # Budget scoring (weight: 30 points)
        max_score += 30
        budget_min = preferences.get('budget_min', 0)
        budget_max = preferences.get('budget_max')

        # If no budget specified, use a very high default
        if budget_max is None:
            budget_max = 10000

        if seat['price'] > budget_max:
            # Over budget - heavy penalty
            score -= 50
            explanation.append(f"⚠️ Over budget (${seat['price']} > ${budget_max})")
        elif seat['price'] < budget_min:
            # Too cheap - might not meet quality expectations
            score += 10
            explanation.append(f"Below preferred price range (${seat['price']} < ${budget_min})")
        else:
            # Within budget - score based on value
            budget_score = 30
            # Reward seats that are good value (not too expensive)
            price_ratio = (budget_max - seat['price']) / (budget_max - budget_min + 1)
            budget_score = int(15 + (price_ratio * 15))
            score += budget_score
            explanation.append(f"✓ Within budget (${seat['price']})")

        # AC scoring (weight: 20 points if required, 10 if preferred)
        ac_importance = preferences.get('ac_importance', 'optional')  # 'required', 'preferred', 'optional'

        if ac_importance == 'required':
            max_score += 20
            if seat['has_ac']:
                score += 20
                explanation.append("✓ Has air conditioning (required)")
            else:
                score -= 30
                explanation.append("✗ No AC (dealbreaker)")
        elif ac_importance == 'preferred':
            max_score += 10
            if seat['has_ac']:
                score += 10
                explanation.append("✓ Has air conditioning")
            else:
                score -= 5
                explanation.append("⚠️ No AC")
        else:  # optional
            max_score += 5
            if seat['has_ac']:
                score += 5
                explanation.append("✓ Has air conditioning")

        # View quality scoring (weight: variable based on importance)
        view_importance = preferences.get('view_importance', 5)  # 0-10
        view_weight = int(view_importance * 2)  # 0-20 points
        max_score += view_weight

        if view_weight > 0:
            view_score = int((seat['view_quality'] / 10) * view_weight)
            score += view_score

            if seat['view_quality'] >= 8:
                explanation.append(f"✓ Excellent view ({seat['view_quality']}/10)")
            elif seat['view_quality'] >= 6:
                explanation.append(f"✓ Good view ({seat['view_quality']}/10)")
            else:
                explanation.append(f"⚠️ Limited view ({seat['view_quality']}/10)")

        # Famous occupant scoring (weight: 15 points if interested)
        if preferences.get('famous_people', False):
            max_score += 15
            if seat['famous_occupant']:
                score += 15
                explanation.append(f"⭐ Historical: {seat['famous_occupant']}")
            else:
                explanation.append("No historical significance")
        else:
            # Still give small bonus if famous
            if seat['famous_occupant']:
                score += 3
                explanation.append(f"Historical note: {seat['famous_occupant']}")

        # Position preference (weight: 10 points)
        position_pref = preferences.get('position_preference')
        if position_pref:
            max_score += 10
            position = seat['position']

            if position_pref == 'aisle' and position in [1, 10]:
                score += 10
                explanation.append("✓ Aisle seat (as requested)")
            elif position_pref == 'center' and 4 <= position <= 7:
                score += 10
                explanation.append("✓ Center position (as requested)")
            elif position_pref == 'window':  # side positions
                score += 5
                explanation.append("Side position")
            else:
                score += 3

        # Location preference (weight: 15 points)
        location_pref = preferences.get('location_preference')
        if location_pref:
            max_score += 15
            seat_type = seat['seat_type']
            layer = seat['layer']

            if location_pref == 'front':
                if seat_type == 'perpendicular_front':
                    score += 15
                    explanation.append("✓ Premium front location (perfect match)")
                elif seat_type == 'regular_top' and layer <= 3:
                    score += 12
                    explanation.append("✓ Front section")
                else:
                    score += 5
            elif location_pref == 'middle':
                if seat_type == 'regular_top' and layer >= 3:
                    score += 15
                    explanation.append("✓ Middle section")
                elif seat_type == 'perpendicular_front' and layer >= 8:
                    score += 12
                    explanation.append("✓ Middle-front section")
                else:
                    score += 8
            elif location_pref == 'back':
                if seat_type == 'regular_bottom' and layer >= 13:
                    score += 15
                    explanation.append("✓ Back section (as requested)")
                elif seat_type == 'regular_bottom':
                    score += 12
                    explanation.append("✓ Back area")
                else:
                    score += 5

        # Pros/cons consideration (weight: 10 points)
        max_score += 10
        if seat.get('pros'):
            pros_count = len(seat['pros'].split(';'))
            pros_score = min(10, pros_count * 2)
            score += pros_score

        if seat.get('cons'):
            cons_count = len(seat['cons'].split(';'))
            score -= cons_count * 2

        # Normalize score to percentage
        if max_score > 0:
            normalized_score = int((score / max_score) * 100)
        else:
            normalized_score = 50

        # Ensure score is between 0 and 100
        normalized_score = max(0, min(100, normalized_score))

        return normalized_score, explanation

    def get_recommendations(self, preferences, limit=5):
        """
        Get top seat recommendations based on preferences

        Args:
            preferences: Dictionary with user preferences
            limit: Maximum number of recommendations to return

        Returns:
            List of recommended seats with scores and explanations
        """
        if not self.available_seats:
            return {
                'recommendations': [],
                'message': 'No available seats found',
                'total_available': 0
            }

        # Score all available seats
        scored_seats = []
        for seat in self.available_seats:
            score, explanation = self.score_seat(seat, preferences)

            scored_seats.append({
                'seat': seat,
                'score': score,
                'explanation': explanation,
                'match_quality': self._get_match_quality(score)
            })

        # Sort by score (highest first)
        scored_seats.sort(key=lambda x: x['score'], reverse=True)

        # Get top recommendations
        recommendations = scored_seats[:limit]

        # Build response
        return {
            'recommendations': recommendations,
            'total_available': len(self.available_seats),
            'preferences_used': preferences,
            'summary': self._generate_summary(recommendations, preferences)
        }

    def _get_match_quality(self, score):
        """Convert score to quality label"""
        if score >= 85:
            return 'Excellent Match'
        elif score >= 70:
            return 'Great Match'
        elif score >= 55:
            return 'Good Match'
        elif score >= 40:
            return 'Fair Match'
        else:
            return 'Poor Match'

    def _generate_summary(self, recommendations, preferences):
        """Generate a summary of recommendations"""
        if not recommendations:
            return "No seats match your criteria."

        best_score = recommendations[0]['score']
        best_seat = recommendations[0]['seat']

        summary = []

        if best_score >= 85:
            summary.append("🎉 We found excellent matches for you!")
        elif best_score >= 70:
            summary.append("👍 We found some great options for you!")
        elif best_score >= 55:
            summary.append("✓ We found several good options.")
        else:
            summary.append("⚠️ Limited options available. Consider adjusting your preferences.")

        # Add specific insights
        if preferences.get('budget_max'):
            budget_matches = [r for r in recommendations if r['seat']['price'] <= preferences['budget_max']]
            summary.append(f"Found {len(budget_matches)} seats within your budget of ${preferences['budget_max']}.")

        if preferences.get('ac_importance') == 'required':
            ac_matches = [r for r in recommendations if r['seat']['has_ac']]
            summary.append(f"All top recommendations have air conditioning.")

        if preferences.get('famous_people'):
            famous_matches = [r for r in recommendations if r['seat']['famous_occupant']]
            if famous_matches:
                summary.append(f"Found {len(famous_matches)} seats with historical significance!")

        return " ".join(summary)

    def quick_filter(self, filters):
        """
        Quick filter for simple searches

        Args:
            filters: Dict with simple filters (price_max, has_ac, etc.)

        Returns:
            List of matching seats
        """
        matches = self.available_seats.copy()

        if 'price_max' in filters:
            matches = [s for s in matches if s['price'] <= filters['price_max']]

        if 'price_min' in filters:
            matches = [s for s in matches if s['price'] >= filters['price_min']]

        if 'has_ac' in filters:
            matches = [s for s in matches if s['has_ac'] == filters['has_ac']]

        if 'view_min' in filters:
            matches = [s for s in matches if s['view_quality'] >= filters['view_min']]

        if 'has_famous' in filters and filters['has_famous']:
            matches = [s for s in matches if s['famous_occupant'] is not None]

        if 'seat_type' in filters:
            matches = [s for s in matches if s['seat_type'] == filters['seat_type']]

        return matches
