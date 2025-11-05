from flask import Flask, jsonify, request
from flask_cors import CORS
from database import Database
from email_service import init_mail, send_booking_confirmation
from seat_recommender import SeatRecommender
from nlp_processor import SeatAdvisorNLP
from nlp_processor_azure import AzureNLPProcessor
from session_manager import SessionManager
import os
from dotenv import load_dotenv

# Load environment variables from both .env and APIKEY.env
load_dotenv()
load_dotenv('APIKEY.env')

app = Flask(__name__)
CORS(app)

# Initialize database
db = Database()

# Initialize email service
init_mail(app)

# Initialize session manager
session_manager = SessionManager(timeout_minutes=30)

def calculate_seat_id(seat, all_seats):
    """Calculate the seat ID (F1, M1, B1, etc.) based on seat type and position"""
    seat_type = seat.get('seat_type', 'regular')

    if seat_type == 'regular_top':
        # F-series: continuous numbering for top regular seats
        # Get all top regular seats ordered by layer, then side (left before right), then position
        top_seats = [s for s in all_seats if s.get('seat_type') == 'regular_top']
        top_seats.sort(key=lambda s: (s['layer'], s['side'], s['position']))

        # Find the index of current seat
        for idx, s in enumerate(top_seats):
            if s['id'] == seat['id']:
                return f"F{idx + 1}"

    elif seat_type == 'perpendicular_front':
        # M-series: continuous numbering for perpendicular front seats
        perp_seats = [s for s in all_seats if s.get('seat_type') == 'perpendicular_front']
        perp_seats.sort(key=lambda s: (s['layer'], s['position']))

        # Find the index of current seat
        for idx, s in enumerate(perp_seats):
            if s['id'] == seat['id']:
                return f"M{idx + 1}"

    elif seat_type == 'regular_bottom':
        # B-series: continuous numbering for bottom regular seats
        bottom_seats = [s for s in all_seats if s.get('seat_type') == 'regular_bottom']
        bottom_seats.sort(key=lambda s: (s['layer'], s['side'], s['position']))

        # Find the index of current seat
        for idx, s in enumerate(bottom_seats):
            if s['id'] == seat['id']:
                return f"B{idx + 1}"

    # Fallback
    return f"SEAT-{seat['id']}"

@app.route('/api/seats', methods=['GET'])
def get_seats():
    """Get all seats with their availability status"""
    try:
        seats = db.get_all_seats()
        return jsonify(seats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/seats/<int:seat_id>', methods=['GET'])
def get_seat(seat_id):
    """Get specific seat details"""
    try:
        seat = db.get_seat_by_id(seat_id)
        if seat:
            return jsonify(seat), 200
        return jsonify({'error': 'Seat not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    """Create a new booking"""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['seat_id', 'user_name', 'user_email']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Create booking
        booking_id = db.create_booking(
            data['seat_id'],
            data['user_name'],
            data['user_email']
        )

        if booking_id:
            # Get seat details for email
            seat = db.get_seat_by_id(data['seat_id'])

            # Get booking details
            bookings = db.get_all_bookings()
            current_booking = next((b for b in bookings if b['id'] == booking_id), None)

            if seat and current_booking:
                # Get all seats for seat_id calculation
                all_seats = db.get_all_seats()
                seat_id = calculate_seat_id(seat, all_seats)

                # Prepare email data
                from datetime import datetime
                booking_data = {
                    'booking_id': booking_id,
                    'user_name': data['user_name'],
                    'user_email': data['user_email'],
                    'booking_date': current_booking.get('booking_date', datetime.now().isoformat()),
                    'seat_info': {
                        'seat_id': seat_id,
                        'layer': seat['layer'],
                        'side': seat.get('side'),
                        'position': seat['position'],
                        'price': seat['price'],
                        'seat_type': seat.get('seat_type', 'regular')
                    }
                }

                # Send confirmation email (non-blocking - won't fail booking if email fails)
                email_sent, email_message = send_booking_confirmation(booking_data)

                if not email_sent:
                    # Log warning but don't fail the booking
                    print(f"Warning: {email_message}")

                return jsonify({
                    'message': 'Booking created successfully',
                    'booking_id': booking_id,
                    'email_sent': email_sent,
                    'email_message': email_message if not email_sent else 'Confirmation email sent successfully'
                }), 201

            return jsonify({
                'message': 'Booking created successfully',
                'booking_id': booking_id,
                'email_sent': False,
                'email_message': 'Could not retrieve seat information for email'
            }), 201
        else:
            return jsonify({'error': 'Seat is already booked'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bookings', methods=['GET'])
def get_bookings():
    """Get all bookings"""
    try:
        bookings = db.get_all_bookings()
        return jsonify(bookings), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bookings/<int:booking_id>', methods=['DELETE'])
def cancel_booking(booking_id):
    """Cancel a booking"""
    try:
        success = db.cancel_booking(booking_id)
        if success:
            return jsonify({'message': 'Booking cancelled successfully'}), 200
        return jsonify({'error': 'Booking not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/log-3d-error', methods=['POST'])
def log_3d_error():
    """Log 3D view errors to file"""
    try:
        from datetime import datetime

        data = request.json
        log_entry = f"""
{'='*80}
Timestamp: {data.get('timestamp', datetime.now().isoformat())}
Error Type: {data.get('type', 'Unknown')}
Message: {data.get('message', 'No message')}
User Agent: {data.get('userAgent', 'Unknown')}
Stack Trace:
{data.get('stack', 'No stack trace available')}
{'='*80}
"""

        # Write to 3D.log file
        log_file = os.path.join(os.path.dirname(__file__), '..', '3D.log')
        with open(log_file, 'a') as f:
            f.write(log_entry)

        return jsonify({'success': True, 'message': 'Error logged successfully'}), 200
    except Exception as e:
        print(f"Failed to log 3D error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/seat-recommendations', methods=['POST'])
def get_seat_recommendations():
    """Get personalized seat recommendations based on user preferences"""
    try:
        data = request.get_json()
        print(f"Received recommendation request: {data}")

        # Get all seats
        seats = db.get_all_seats()

        # Initialize recommender
        recommender = SeatRecommender(seats)

        # Extract preferences from request
        preferences = {
            'budget_max': data.get('budget_max'),
            'budget_min': data.get('budget_min', 0),
            'ac_importance': data.get('ac_importance', 'optional'),  # 'required', 'preferred', 'optional'
            'view_importance': data.get('view_importance', 5),  # 0-10
            'famous_people': data.get('famous_people', False),
            'position_preference': data.get('position_preference'),  # 'aisle', 'center', None
            'location_preference': data.get('location_preference')  # 'front', 'middle', 'back', None
        }

        # Get number of recommendations to return (default 5)
        limit = data.get('limit', 5)

        # Get recommendations
        result = recommender.get_recommendations(preferences, limit)

        return jsonify(result), 200

    except Exception as e:
        import traceback
        import sys
        error_details = traceback.format_exc()
        print(f"Error in seat recommendations: {str(e)}", file=sys.stderr, flush=True)
        print(error_details, file=sys.stderr, flush=True)
        return jsonify({'error': str(e), 'details': error_details}), 500

@app.route('/api/seat-recommendations/quick-filter', methods=['POST'])
def quick_filter_seats():
    """Quick filter seats by simple criteria"""
    try:
        data = request.get_json()

        # Get all seats
        seats = db.get_all_seats()

        # Initialize recommender
        recommender = SeatRecommender(seats)

        # Extract filters
        filters = {
            'price_max': data.get('price_max'),
            'price_min': data.get('price_min'),
            'has_ac': data.get('has_ac'),
            'view_min': data.get('view_min'),
            'has_famous': data.get('has_famous'),
            'seat_type': data.get('seat_type')
        }

        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}

        # Get filtered seats
        matches = recommender.quick_filter(filters)

        return jsonify({
            'matches': matches,
            'count': len(matches),
            'filters_applied': filters
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def handle_chat():
    """Process natural language chat messages with Azure OpenAI"""
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        session_id = data.get('session_id')

        if not user_message:
            return jsonify({'error': 'Message is required'}), 400

        # Get or create session
        if not session_id or not session_manager.get_session(session_id):
            session_id = session_manager.create_session()

        session = session_manager.get_session(session_id)

        # Initialize Azure NLP processor (with fallback)
        nlp = AzureNLPProcessor()

        # Process message with conversation history
        result = nlp.process_message(
            message=user_message,
            conversation_history=session['conversation_history'],
            current_preferences=session['preferences']
        )

        # Update session with new message and preferences
        session_manager.update_session(
            session_id=session_id,
            user_message=user_message,
            bot_response=result['bot_message'],
            preferences=result['preferences']
        )

        # Get updated preferences from session
        updated_preferences = session_manager.get_preferences(session_id)

        return jsonify({
            'session_id': session_id,
            'response': result['bot_message'],
            'preferences': updated_preferences,
            'confidence': result.get('confidence', 0.8),
            'ready_for_recommendations': result['ready_for_recommendations']
        }), 200

    except Exception as e:
        print(f"Chat error: {str(e)}")  # Log for debugging
        return jsonify({
            'error': 'Failed to process message',
            'response': "Sorry, I'm having trouble right now. Please try again."
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
