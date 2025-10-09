# Annual Seat Booking System

A web application for booking seats annually with visual seat selection and real-time availability tracking.

## Features

- **Visual Seat Map**: Interactive seat layout with 5 layers and 2 sides (100 total seats)
- **Tiered Pricing**: Front seats cost more than back seats
- **Real-time Availability**: See which seats are available or booked
- **Online Booking**: Simple form to book seats with name and email
- **Persistent Storage**: SQLite database for data persistence

## Technology Stack

### Backend
- Python 3.8+
- Flask (REST API)
- SQLite (Database)
- Flask-CORS (Cross-origin requests)

### Frontend
- React 18+
- Axios (API communication)
- CSS3 (Styling and animations)

## Project Structure

```
bentest/
├── backend/
│   ├── app.py              # Flask API server
│   ├── database.py         # Database connection and queries
│   ├── requirements.txt    # Python dependencies
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SeatMap.js     # Seat layout component
│   │   │   ├── SeatMap.css
│   │   │   ├── Seat.js        # Individual seat component
│   │   │   ├── Seat.css
│   │   │   ├── BookingForm.js # Booking form component
│   │   │   └── BookingForm.css
│   │   ├── App.js             # Main application
│   │   └── App.css
│   └── package.json
├── database/
│   └── seats.db            # SQLite database (auto-generated)
└── plan.txt                # Implementation plan
```

## Installation & Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the Flask server:
   ```bash
   python app.py
   ```

   The backend will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

   The frontend will start on `http://localhost:3000`

## Usage

1. **Start both servers** (backend and frontend)
2. **Open your browser** to `http://localhost:3000`
3. **View the seat map** with color-coded pricing tiers
4. **Click on an available seat** (green/yellow/orange/red based on layer)
5. **Fill in the booking form** with your name and email
6. **Confirm your booking** - the seat will be marked as booked

## Pricing Structure

- **Layer 1 (Front)**: $500/year - Green
- **Layer 2**: $400/year - Light Green
- **Layer 3**: $300/year - Yellow
- **Layer 4**: $200/year - Orange
- **Layer 5 (Back)**: $150/year - Red

## API Endpoints

- `GET /api/seats` - Get all seats with availability
- `GET /api/seats/:id` - Get specific seat details
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings` - Get all bookings
- `DELETE /api/bookings/:id` - Cancel a booking

## Database Schema

### seats table
- `id`: Primary key
- `layer`: Layer number (1-5)
- `side`: Left or right
- `position`: Seat position (1-10)
- `price`: Annual price
- `is_available`: Availability status

### bookings table
- `id`: Primary key
- `seat_id`: Foreign key to seats
- `user_name`: Booker's name
- `user_email`: Booker's email
- `booking_date`: Timestamp
- `payment_status`: Payment status

## Development

The application is set up for easy development:

- **Hot reload** enabled for both frontend and backend
- **CORS configured** for local development
- **Auto-initialization** of database with seed data
- **Responsive design** for mobile and desktop

## Future Enhancements

- User authentication system
- Payment integration
- Admin dashboard
- Email notifications
- Booking history
- Seat reservations (temporary holds)
