import React, { useState } from 'react';
import './BookingForm.css';

function BookingForm({ seat, seats, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    accept_terms: false,
    receive_offers: false
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.user_name.trim()) {
      newErrors.user_name = 'Name is required';
    }

    if (!formData.user_email.trim()) {
      newErrors.user_email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.user_email)) {
      newErrors.user_email = 'Email is invalid';
    }

    if (!formData.accept_terms) {
      newErrors.accept_terms = 'You must accept the Terms and Conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate()) {
      onSubmit({
        seat_id: seat.id,
        user_name: formData.user_name,
        user_email: formData.user_email
      });
    }
  };

  // Calculate seat ID (F1, M1, B94, etc.)
  const getSeatLabel = (currentSeat) => {
    const seatType = currentSeat.seat_type || 'regular';

    if (seatType === 'regular_top') {
      // Front seats (F series)
      const topSeats = seats
        .filter(s => s.seat_type === 'regular_top')
        .sort((a, b) => {
          if (a.layer !== b.layer) return a.layer - b.layer;
          if (a.side !== b.side) return a.side.localeCompare(b.side);
          return a.position - b.position;
        });

      const index = topSeats.findIndex(s => s.id === currentSeat.id);
      return `F${index + 1}`;
    } else if (seatType === 'perpendicular_front') {
      // Middle seats (M series)
      const middleSeats = seats
        .filter(s => s.seat_type === 'perpendicular_front')
        .sort((a, b) => {
          if (a.layer !== b.layer) return a.layer - b.layer;
          return a.position - b.position;
        });

      const index = middleSeats.findIndex(s => s.id === currentSeat.id);
      return `M${index + 1}`;
    } else if (seatType === 'regular_bottom') {
      // Back seats (B series)
      const bottomSeats = seats
        .filter(s => s.seat_type === 'regular_bottom')
        .sort((a, b) => {
          if (a.layer !== b.layer) return a.layer - b.layer;
          if (a.side !== b.side) return a.side.localeCompare(b.side);
          return a.position - b.position;
        });

      const index = bottomSeats.findIndex(s => s.id === currentSeat.id);
      return `B${index + 1}`;
    }

    return 'N/A';
  };

  // Render mini seat map
  const renderMiniMap = () => {
    const regularTopSeats = seats.filter(s => s.seat_type === 'regular_top');
    const perpendicularFrontSeats = seats.filter(s => s.seat_type === 'perpendicular_front');
    const regularBottomSeats = seats.filter(s => s.seat_type === 'regular_bottom');

    // Organize seats by layer
    const organizeByLayer = (seatsList) => {
      const organized = {};
      seatsList.forEach(s => {
        if (!organized[s.layer]) {
          organized[s.layer] = [];
        }
        organized[s.layer].push(s);
      });
      return organized;
    };

    const topLayers = organizeByLayer(regularTopSeats);
    const perpLayers = organizeByLayer(perpendicularFrontSeats);
    const bottomLayers = organizeByLayer(regularBottomSeats);

    return (
      <div className="mini-seat-map">
        <div className="mini-map-label">STAGE</div>

        {/* Top regular seats */}
        {Object.keys(topLayers).sort((a, b) => a - b).map(layer => (
          <div key={`top-${layer}`} className="mini-layer">
            {topLayers[layer].map(s => (
              <div
                key={s.id}
                className={`mini-seat ${s.id === seat.id ? 'selected' : ''}`}
              />
            ))}
          </div>
        ))}

        {/* Perpendicular seats */}
        {Object.keys(perpLayers).sort((a, b) => a - b).map(layer => (
          <div key={`perp-${layer}`} className="mini-layer">
            {perpLayers[layer].map(s => (
              <div
                key={s.id}
                className={`mini-seat ${s.id === seat.id ? 'selected' : ''}`}
              />
            ))}
          </div>
        ))}

        {/* Bottom regular seats */}
        {Object.keys(bottomLayers).sort((a, b) => a - b).map(layer => (
          <div key={`bottom-${layer}`} className="mini-layer">
            {bottomLayers[layer].map(s => (
              <div
                key={s.id}
                className={`mini-seat ${s.id === seat.id ? 'selected' : ''}`}
              />
            ))}
          </div>
        ))}

        <div className="mini-map-label">BACK</div>
      </div>
    );
  };

  return (
    <div className="booking-form-overlay">
      <div className="booking-form-container">
        <div className="booking-header">
          <div className="header-left">
            <h2>Book Your Seat</h2>
          </div>
          <div className="header-right">
            {seats && renderMiniMap()}
          </div>
        </div>

        <div className="seat-details">
          <p className="seat-id"><strong>Seat ID:</strong> {seats && getSeatLabel(seat)}</p>
          <p><strong>Layer:</strong> {seat.layer}</p>
          <p><strong>Side:</strong> {seat.side}</p>
          <p><strong>Position:</strong> {seat.position}</p>
          <p className="price"><strong>Annual Price:</strong> ${seat.price}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="user_name">Full Name *</label>
            <input
              type="text"
              id="user_name"
              name="user_name"
              value={formData.user_name}
              onChange={handleChange}
              className={errors.user_name ? 'error' : ''}
              placeholder="Enter your full name"
            />
            {errors.user_name && <span className="error-text">{errors.user_name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="user_email">Email Address *</label>
            <input
              type="email"
              id="user_email"
              name="user_email"
              value={formData.user_email}
              onChange={handleChange}
              className={errors.user_email ? 'error' : ''}
              placeholder="Enter your email"
            />
            {errors.user_email && <span className="error-text">{errors.user_email}</span>}
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="accept_terms"
                checked={formData.accept_terms}
                onChange={handleChange}
                className="checkbox-input"
              />
              <div className="checkbox-text">
                Tick to confirm you agree to our <a href="/terms" target="_blank">Terms and Conditions</a> and that you have read our <a href="/privacy" target="_blank">Privacy Policy</a>. *
              </div>
            </label>
            {errors.accept_terms && <span className="error-text">{errors.accept_terms}</span>}
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="receive_offers"
                checked={formData.receive_offers}
                onChange={handleChange}
                className="checkbox-input"
              />
              <div className="checkbox-text">
                Tick to receive our special offers by email
              </div>
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingForm;
