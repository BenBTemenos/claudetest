import React, { useState } from 'react';
import './BookingForm.css';

function BookingForm({ seat, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  return (
    <div className="booking-form-overlay">
      <div className="booking-form-container">
        <h2>Book Your Seat</h2>

        <div className="seat-details">
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
