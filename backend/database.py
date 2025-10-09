import sqlite3
import os
from datetime import datetime

class Database:
    def __init__(self, db_path='database/seats.db'):
        self.db_path = db_path
        self._ensure_directory()
        self._initialize_database()

    def _ensure_directory(self):
        """Ensure the database directory exists"""
        db_dir = os.path.dirname(self.db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir)

    def _get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _initialize_database(self):
        """Create tables if they don't exist"""
        conn = self._get_connection()
        cursor = conn.cursor()

        # Create seats table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS seats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                layer INTEGER NOT NULL,
                side TEXT,
                position INTEGER NOT NULL,
                price REAL NOT NULL,
                is_available INTEGER DEFAULT 1,
                seat_type TEXT DEFAULT 'regular',
                UNIQUE(layer, side, position)
            )
        ''')

        # Create bookings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                seat_id INTEGER NOT NULL,
                user_name TEXT NOT NULL,
                user_email TEXT NOT NULL,
                booking_date TEXT NOT NULL,
                payment_status TEXT DEFAULT 'pending',
                FOREIGN KEY (seat_id) REFERENCES seats (id)
            )
        ''')

        conn.commit()

        # Check if seats are already populated
        cursor.execute('SELECT COUNT(*) as count FROM seats')
        count = cursor.fetchone()['count']

        if count == 0:
            self._seed_seats(conn)

        conn.close()

    def _seed_seats(self, conn):
        """Seed initial seat data"""
        cursor = conn.cursor()

        # Pricing structure
        pricing = {
            1: 600,  # Perpendicular front rows (premium)
            2: 550,
            3: 500,
            4: 450,
            5: 400,
            6: 500,  # Regular rows start
            7: 400,
            8: 300,
            9: 200,
            10: 150,
            11: 400,  # Perpendicular back rows
            12: 450,
            13: 500,
            14: 550,
            15: 600   # Back perpendicular (premium like front)
        }

        # Generate perpendicular front seats: 5 rows (layers 1-5), 10 seats each
        for layer in range(1, 6):
            for position in range(1, 11):
                cursor.execute('''
                    INSERT INTO seats (layer, side, position, price, is_available, seat_type)
                    VALUES (?, ?, ?, ?, 1, ?)
                ''', (layer, None, position, pricing[layer], 'perpendicular_front'))

        # Generate regular seats: 5 layers (6-10), 2 sides, 10 positions each
        for layer in range(6, 11):
            for side in ['left', 'right']:
                for position in range(1, 11):
                    cursor.execute('''
                        INSERT INTO seats (layer, side, position, price, is_available, seat_type)
                        VALUES (?, ?, ?, ?, 1, ?)
                    ''', (layer, side, position, pricing[layer], 'regular'))

        # Generate perpendicular back seats: 5 rows (layers 11-15), 10 seats each
        for layer in range(11, 16):
            for position in range(1, 11):
                cursor.execute('''
                    INSERT INTO seats (layer, side, position, price, is_available, seat_type)
                    VALUES (?, ?, ?, ?, 1, ?)
                ''', (layer, None, position, pricing[layer], 'perpendicular_back'))

        conn.commit()

    def get_all_seats(self):
        """Get all seats with their status"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT s.id, s.layer, s.side, s.position, s.price, s.is_available, s.seat_type,
                   b.user_name, b.user_email
            FROM seats s
            LEFT JOIN bookings b ON s.id = b.seat_id AND s.is_available = 0
            ORDER BY s.seat_type, s.layer, s.side, s.position
        ''')

        seats = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return seats

    def get_seat_by_id(self, seat_id):
        """Get specific seat by ID"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT s.id, s.layer, s.side, s.position, s.price, s.is_available, s.seat_type,
                   b.user_name, b.user_email
            FROM seats s
            LEFT JOIN bookings b ON s.id = b.seat_id AND s.is_available = 0
            WHERE s.id = ?
        ''', (seat_id,))

        seat = cursor.fetchone()
        conn.close()
        return dict(seat) if seat else None

    def create_booking(self, seat_id, user_name, user_email):
        """Create a new booking"""
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            # Check if seat is available
            cursor.execute('SELECT is_available FROM seats WHERE id = ?', (seat_id,))
            seat = cursor.fetchone()

            if not seat or seat['is_available'] == 0:
                conn.close()
                return None

            # Create booking
            booking_date = datetime.now().isoformat()
            cursor.execute('''
                INSERT INTO bookings (seat_id, user_name, user_email, booking_date)
                VALUES (?, ?, ?, ?)
            ''', (seat_id, user_name, user_email, booking_date))

            # Mark seat as unavailable
            cursor.execute('UPDATE seats SET is_available = 0 WHERE id = ?', (seat_id,))

            conn.commit()
            booking_id = cursor.lastrowid
            conn.close()
            return booking_id

        except Exception as e:
            conn.rollback()
            conn.close()
            raise e

    def get_all_bookings(self):
        """Get all bookings"""
        conn = self._get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT b.id, b.seat_id, b.user_name, b.user_email,
                   b.booking_date, b.payment_status,
                   s.layer, s.side, s.position, s.price
            FROM bookings b
            JOIN seats s ON b.seat_id = s.id
            ORDER BY b.booking_date DESC
        ''')

        bookings = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return bookings

    def cancel_booking(self, booking_id):
        """Cancel a booking and free up the seat"""
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            # Get seat_id from booking
            cursor.execute('SELECT seat_id FROM bookings WHERE id = ?', (booking_id,))
            booking = cursor.fetchone()

            if not booking:
                conn.close()
                return False

            seat_id = booking['seat_id']

            # Delete booking
            cursor.execute('DELETE FROM bookings WHERE id = ?', (booking_id,))

            # Mark seat as available
            cursor.execute('UPDATE seats SET is_available = 1 WHERE id = ?', (seat_id,))

            conn.commit()
            conn.close()
            return True

        except Exception as e:
            conn.rollback()
            conn.close()
            raise e
