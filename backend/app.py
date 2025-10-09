from flask import Flask, jsonify, request
from flask_cors import CORS
from database import Database
import os

app = Flask(__name__)
CORS(app)

# Initialize database
db = Database()

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
            return jsonify({
                'message': 'Booking created successfully',
                'booking_id': booking_id
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
