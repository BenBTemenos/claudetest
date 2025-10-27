from flask import Flask, jsonify, request
from flask_cors import CORS
from database import Database
from email_service import init_mail, send_booking_confirmation
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize database
db = Database()

# Initialize email service
init_mail(app)

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
                # Prepare email data
                from datetime import datetime
                booking_data = {
                    'booking_id': booking_id,
                    'user_name': data['user_name'],
                    'user_email': data['user_email'],
                    'booking_date': current_booking.get('booking_date', datetime.now().isoformat()),
                    'seat_info': {
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
