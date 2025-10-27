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
  const [emailStatus, setEmailStatus] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchSeats();
    if (activeTab === 'admin') {
      fetchBookings();
    }
  }, [activeTab]);

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

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API_URL}/bookings`);
      setBookings(response.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
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
      const response = await axios.post(`${API_URL}/bookings`, bookingData);
      setBookingSuccess(true);
      setSelectedSeat(null);

      // Set email status from response
      if (response.data.email_sent) {
        setEmailStatus({ success: true, message: response.data.email_message });
      } else {
        setEmailStatus({ success: false, message: response.data.email_message });
      }

      fetchSeats(); // Refresh seats after booking

      // Reset messages after 5 seconds
      setTimeout(() => {
        setBookingSuccess(false);
        setEmailStatus(null);
      }, 5000);
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
            className={activeTab === 'admin' ? 'active' : ''}
            onClick={() => setActiveTab('admin')}
          >
            Admin View
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
            {emailStatus && (
              <div className={`email-status-message ${emailStatus.success ? 'email-success' : 'email-warning'}`}>
                {emailStatus.success ? '✅ ' : '⚠️ '}
                {emailStatus.message}
              </div>
            )}

            {loading ? (
              <div className="loading">Loading seats...</div>
            ) : (
              <>
                <div className="legend-container">
                  {/* Seat Availability Summary */}
                  <div className="availability-summary">
                    <h3>Available Seats by Price:</h3>
                    <div className="availability-items">
                      <div className="availability-item">
                        <span className="availability-label">$600/year:</span>
                        <span className="availability-count">
                          {seats.filter(s => s.price === 600 && s.is_available === 1).length} remaining
                        </span>
                      </div>
                      <div className="availability-item">
                        <span className="availability-label">$500/year:</span>
                        <span className="availability-count">
                          {seats.filter(s => s.price === 500 && s.is_available === 1).length} remaining
                        </span>
                      </div>
                      <div className="availability-item">
                        <span className="availability-label">$400/year:</span>
                        <span className="availability-count">
                          {seats.filter(s => s.price === 400 && s.is_available === 1).length} remaining
                        </span>
                      </div>
                      <div className="availability-item">
                        <span className="availability-label">$300/year:</span>
                        <span className="availability-count">
                          {seats.filter(s => s.price === 300 && s.is_available === 1).length} remaining
                        </span>
                      </div>
                      <div className="availability-item">
                        <span className="availability-label">$200/year:</span>
                        <span className="availability-count">
                          {seats.filter(s => s.price === 200 && s.is_available === 1).length} remaining
                        </span>
                      </div>
                      <div className="availability-item">
                        <span className="availability-label">$150/year:</span>
                        <span className="availability-count">
                          {seats.filter(s => s.price === 150 && s.is_available === 1).length} remaining
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Legend */}
                  <div className="legend">
              <h3>Pricing Legend:</h3>
              <div className="legend-items">
                <div className="legend-item">
                  <span className="legend-box" style={{backgroundColor: '#1976d2'}}></span>
                  <span>$600/year</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box" style={{backgroundColor: '#4caf50'}}></span>
                  <span>$500/year</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box" style={{backgroundColor: '#ffeb3b'}}></span>
                  <span>$300/year</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box" style={{backgroundColor: '#ff9800'}}></span>
                  <span>$200/year</span>
                </div>
                <div className="legend-item">
                  <span className="legend-box" style={{backgroundColor: '#f44336'}}></span>
                  <span>$150/year</span>
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

        {activeTab === 'admin' && (
          <div className="admin-view">
            <h2>Admin Dashboard</h2>
            <div className="admin-summary">
              <div className="summary-card">
                <h3>Total Bookings</h3>
                <p className="summary-value">{bookings.length}</p>
              </div>
              <div className="summary-card">
                <h3>Total Revenue</h3>
                <p className="summary-value">
                  ${bookings.reduce((sum, b) => sum + b.price, 0).toLocaleString()}
                </p>
              </div>
              <div className="summary-card">
                <h3>Available Seats</h3>
                <p className="summary-value">
                  {seats.filter(s => s.is_available === 1).length}
                </p>
              </div>
            </div>

            <div className="bookings-table-container">
              <h3>All Bookings</h3>
              {bookings.length === 0 ? (
                <p className="no-bookings">No bookings yet.</p>
              ) : (
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Customer Name</th>
                      <th>Email</th>
                      <th>Seat</th>
                      <th>Price</th>
                      <th>Booking Date</th>
                      <th>Payment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(booking => (
                      <tr key={booking.id}>
                        <td>#{booking.id}</td>
                        <td>{booking.user_name}</td>
                        <td>{booking.user_email}</td>
                        <td>
                          Layer {booking.layer}
                          {booking.side && ` - ${booking.side}`} - Pos {booking.position}
                        </td>
                        <td>${booking.price}</td>
                        <td>{new Date(booking.booking_date).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-badge ${booking.payment_status}`}>
                            {booking.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'multiagent' && (
          <MultiAgentSystem />
        )}
      </main>
    </div>
  );
}

export default App;
