import React, { useState, useEffect } from 'react';
import './App.css';
import SeatMap from './components/SeatMap';
import BookingForm from './components/BookingForm';
import MultiAgentSystem from './components/MultiAgentSystem';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('booking');
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    fetchSeats();
  }, []);

  const fetchSeats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/seats`);
      setSeats(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load seats. Please make sure the backend server is running.');
      console.error('Error fetching seats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.is_available === 1) {
      setSelectedSeat(seat);
      setBookingSuccess(false);
    }
  };

  const handleBooking = async (bookingData) => {
    try {
      await axios.post(`${API_URL}/bookings`, bookingData);
      setBookingSuccess(true);
      setSelectedSeat(null);
      fetchSeats(); // Refresh seats after booking

      // Reset success message after 3 seconds
      setTimeout(() => setBookingSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create booking');
      console.error('Error creating booking:', err);
    }
  };

  const handleCancelSelection = () => {
    setSelectedSeat(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Annual Seat Booking System</h1>
        <nav className="App-nav">
          <button
            className={activeTab === 'booking' ? 'active' : ''}
            onClick={() => setActiveTab('booking')}
          >
            Seat Booking
          </button>
          <button
            className={activeTab === 'multiagent' ? 'active' : ''}
            onClick={() => setActiveTab('multiagent')}
          >
            Multi-Agent System
          </button>
        </nav>
      </header>

      <main className="App-main">
        {activeTab === 'booking' && (
          <>
            {error && <div className="error-message">{error}</div>}
            {bookingSuccess && <div className="success-message">Booking created successfully!</div>}

            {loading ? (
              <div className="loading">Loading seats...</div>
            ) : (
              <>
                <div className="legend">
              <h3>Pricing Legend:</h3>
              <div className="legend-items">
                <h4 style={{width: '100%', marginBottom: '10px', color: '#666'}}>Front Perpendicular Rows (Premium)</h4>
                <div className="legend-item">
                  <span className="legend-box layer-1"></span>
                  <span>Row 1: $600/year</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box layer-2"></span>
                  <span>Row 2: $550/year</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box layer-3"></span>
                  <span>Row 3: $500/year</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box layer-4"></span>
                  <span>Row 4: $450/year</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box layer-5"></span>
                  <span>Row 5: $400/year</span>
                </div>
              </div>
              <div className="legend-items">
                <h4 style={{width: '100%', marginTop: '10px', marginBottom: '10px', color: '#666'}}>Regular Seats with Aisle</h4>
                <div className="legend-item">
                  <span className="legend-box layer-6"></span>
                  <span>Layer 6: $500/year</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box layer-7"></span>
                  <span>Layer 7: $400/year</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box layer-8"></span>
                  <span>Layer 8: $300/year</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box layer-9"></span>
                  <span>Layer 9: $200/year</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box layer-10"></span>
                  <span>Layer 10: $150/year</span>
                </div>
              </div>
              <div className="legend-items">
                <h4 style={{width: '100%', marginTop: '10px', marginBottom: '10px', color: '#666'}}>Back Perpendicular Rows</h4>
                <div className="legend-item">
                  <span className="legend-box layer-11"></span>
                  <span>Row 11: $400/year</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box layer-12"></span>
                  <span>Row 12: $450/year</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box layer-13"></span>
                  <span>Row 13: $500/year</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box layer-14"></span>
                  <span>Row 14: $550/year</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box layer-15"></span>
                  <span>Row 15: $600/year</span>
                </div>
              </div>
              <div className="legend-items">
                <div className="legend-item">
                  <span className="legend-box available"></span>
                  <span>Available</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box booked"></span>
                  <span>Booked</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box selected"></span>
                  <span>Selected</span>
                </div>
              </div>
            </div>

            <SeatMap
              seats={seats}
              selectedSeat={selectedSeat}
              onSeatClick={handleSeatClick}
            />

            {selectedSeat && (
              <BookingForm
                seat={selectedSeat}
                onSubmit={handleBooking}
                onCancel={handleCancelSelection}
              />
            )}
          </>
            )}
          </>
        )}

        {activeTab === 'multiagent' && (
          <MultiAgentSystem />
        )}
      </main>
    </div>
  );
}

export default App;
