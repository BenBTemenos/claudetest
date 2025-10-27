import React, { useState, useEffect } from 'react';
import './SeatFinder.css';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function SeatFinder({ seats, onClose, onSeatSelect }) {
  const [searchMode, setSearchMode] = useState('price'); // 'price' or 'name'
  const [selectedPrice, setSelectedPrice] = useState(300);
  const [priceRange, setPriceRange] = useState([150, 600]);
  const [filteredSeats, setFilteredSeats] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [bookings, setBookings] = useState([]);
  const [nearbySeats, setNearbySeats] = useState([]);
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [matchingCustomers, setMatchingCustomers] = useState([]);

  // Get unique prices and sort them
  const uniquePrices = [...new Set(seats.map(s => s.price))].sort((a, b) => a - b);
  const minPrice = Math.min(...uniquePrices);
  const maxPrice = Math.max(...uniquePrices);

  useEffect(() => {
    // Fetch bookings when component mounts
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchMode === 'price') {
      // Filter available seats by selected price
      const filtered = seats.filter(
        seat => seat.is_available === 1 && seat.price === selectedPrice
      );
      setFilteredSeats(filtered);
    }
  }, [selectedPrice, seats, searchMode]);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API_URL}/bookings`);
      setBookings(response.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const handleNameSearch = () => {
    setHasSearched(true); // Mark that a search has been performed

    if (!searchName.trim()) {
      setFoundCustomer(null);
      setNearbySeats([]);
      setMatchingCustomers([]);
      return;
    }

    console.log('Searching for:', searchName);
    console.log('Available bookings:', bookings);

    // Search for all customers by name (case-insensitive)
    const matches = bookings.filter(
      b => b.user_name.toLowerCase().includes(searchName.toLowerCase())
    );

    console.log('Found matches:', matches.length);

    if (matches.length === 0) {
      // No matches found
      console.log('No customer found with name containing:', searchName);
      setFoundCustomer(null);
      setNearbySeats([]);
      setMatchingCustomers([]);
    } else if (matches.length === 1) {
      // Single match - select it automatically
      selectCustomer(matches[0]);
      setMatchingCustomers([]);
    } else {
      // Multiple matches - show selection list
      console.log('Multiple customers found:', matches.length);
      setMatchingCustomers(matches);
      setFoundCustomer(null);
      setNearbySeats([]);
    }
  };

  const selectCustomer = (customer) => {
    console.log('Selected customer:', customer);
    setFoundCustomer(customer);
    setMatchingCustomers([]);

    // Find the booked seat
    const bookedSeat = seats.find(s => s.id === customer.seat_id);
    console.log('Booked seat:', bookedSeat);

    if (bookedSeat) {
      // Find nearby available seats
      const nearby = findNearbySeats(bookedSeat);
      console.log('Nearby seats found:', nearby.length);
      setNearbySeats(nearby);
    } else {
      console.log('Could not find booked seat with ID:', customer.seat_id);
      setNearbySeats([]);
    }
  };

  const findNearbySeats = (referenceSeat) => {
    const nearby = [];
    const maxDistance = 3; // Maximum layer/position distance

    seats.forEach(seat => {
      if (seat.is_available === 1) {
        // Same seat type
        if (seat.seat_type === referenceSeat.seat_type) {
          const layerDiff = Math.abs(seat.layer - referenceSeat.layer);
          const positionDiff = Math.abs(seat.position - referenceSeat.position);

          // Check if seat is nearby (same side if applicable)
          if (referenceSeat.side) {
            // For regular seats (with sides)
            if (seat.side === referenceSeat.side &&
                layerDiff <= maxDistance &&
                positionDiff <= maxDistance) {
              const distance = layerDiff + positionDiff;
              nearby.push({ ...seat, distance });
            }
          } else {
            // For perpendicular seats (no sides)
            if (layerDiff <= maxDistance && positionDiff <= maxDistance) {
              const distance = layerDiff + positionDiff;
              nearby.push({ ...seat, distance });
            }
          }
        }
      }
    });

    // Sort by distance (closest first)
    nearby.sort((a, b) => a.distance - b.distance);

    // Return top 10 closest seats
    return nearby.slice(0, 10);
  };

  const renderCustomerMiniMap = () => {
    if (!foundCustomer) return null;

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
      <div className="customer-seat-mini-map">
        <div className="mini-map-label">STAGE</div>

        {/* Top regular seats */}
        {Object.keys(topLayers).sort((a, b) => a - b).map(layer => (
          <div key={`top-${layer}`} className="mini-layer">
            {topLayers[layer].map(s => (
              <div
                key={s.id}
                className={`mini-seat ${s.id === foundCustomer.seat_id ? 'customer-selected' : ''}`}
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
                className={`mini-seat ${s.id === foundCustomer.seat_id ? 'customer-selected' : ''}`}
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
                className={`mini-seat ${s.id === foundCustomer.seat_id ? 'customer-selected' : ''}`}
              />
            ))}
          </div>
        ))}

        <div className="mini-map-label">BACK</div>
      </div>
    );
  };

  const getSeatLabel = (seat) => {
    // Calculate seat ID based on type and position
    if (seat.seat_type === 'regular_top') {
      // Find position among all top seats
      const topSeats = seats
        .filter(s => s.seat_type === 'regular_top')
        .sort((a, b) => {
          if (a.layer !== b.layer) return a.layer - b.layer;
          if (a.side !== b.side) return a.side.localeCompare(b.side);
          return a.position - b.position;
        });
      const index = topSeats.findIndex(s => s.id === seat.id);
      return `F${index + 1}`;
    } else if (seat.seat_type === 'perpendicular_front') {
      const perpSeats = seats
        .filter(s => s.seat_type === 'perpendicular_front')
        .sort((a, b) => {
          if (a.layer !== b.layer) return a.layer - b.layer;
          return a.position - b.position;
        });
      const index = perpSeats.findIndex(s => s.id === seat.id);
      return `M${index + 1}`;
    } else if (seat.seat_type === 'regular_bottom') {
      const bottomSeats = seats
        .filter(s => s.seat_type === 'regular_bottom')
        .sort((a, b) => {
          if (a.layer !== b.layer) return a.layer - b.layer;
          if (a.side !== b.side) return a.side.localeCompare(b.side);
          return a.position - b.position;
        });
      const index = bottomSeats.findIndex(s => s.id === seat.id);
      return `B${index + 1}`;
    }
    return seat.position;
  };

  const getSeatTypeLabel = (type) => {
    const labels = {
      'regular_top': 'Top Regular',
      'perpendicular_front': 'Perpendicular Front',
      'regular_bottom': 'Bottom Regular',
      'regular': 'Regular'
    };
    return labels[type] || 'Regular';
  };

  const handleSeatClick = (seat) => {
    onSeatSelect(seat);
    onClose();
  };

  return (
    <div className="seat-finder-overlay">
      <div className="seat-finder-container">
        <div className="seat-finder-header">
          <h2>Help Me Find a Seat</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="seat-finder-content">
          {/* Search Mode Toggle */}
          <div className="search-mode-toggle">
            <button
              className={`mode-btn ${searchMode === 'price' ? 'active' : ''}`}
              onClick={() => {
                setSearchMode('price');
                setHasSearched(false);
              }}
            >
              Search by Price
            </button>
            <button
              className={`mode-btn ${searchMode === 'name' ? 'active' : ''}`}
              onClick={() => {
                setSearchMode('name');
                setHasSearched(false);
              }}
            >
              Search by Customer Name
            </button>
          </div>

          {/* Price Search Section */}
          {searchMode === 'price' && (
            <div className="price-selector">
              <h3>Select Your Price Range</h3>
              <div className="price-display">
              <span className="price-label">Selected Price:</span>
              <span className="price-value">${selectedPrice}/year</span>
            </div>

            <div className="price-slider-container">
              <input
                type="range"
                min={minPrice}
                max={maxPrice}
                step="50"
                value={selectedPrice}
                onChange={(e) => setSelectedPrice(parseInt(e.target.value))}
                className="price-slider"
              />
              <div className="price-markers">
                {uniquePrices.map(price => (
                  <div
                    key={price}
                    className={`price-marker ${price === selectedPrice ? 'active' : ''}`}
                    style={{
                      left: `${((price - minPrice) / (maxPrice - minPrice)) * 100}%`
                    }}
                  >
                    ${price}
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

          {/* Name Search Section */}
          {searchMode === 'name' && (
            <div className="name-search-section">
              <h3>Find Seats Near a Customer</h3>
              <div className="name-search-input">
                <input
                  type="text"
                  placeholder="Enter customer name..."
                  value={searchName}
                  onChange={(e) => {
                    setSearchName(e.target.value);
                    setHasSearched(false); // Reset when user types
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleNameSearch()}
                />
                <button onClick={handleNameSearch} className="search-btn">
                  🔍 Search
                </button>
              </div>

              {matchingCustomers.length > 0 && (
                <div className="multiple-matches-container">
                  <h4>Multiple Customers Found - Please Select One:</h4>
                  <div className="customer-selection-list">
                    {matchingCustomers.map((customer, index) => (
                      <div
                        key={index}
                        className="customer-selection-item"
                        onClick={() => selectCustomer(customer)}
                      >
                        <div className="customer-selection-header">
                          <span className="customer-selection-name">{customer.user_name}</span>
                          <span className="customer-selection-email">{customer.user_email}</span>
                        </div>
                        <div className="customer-selection-details">
                          <span>Seat: Layer {customer.layer}
                            {customer.side && ` - ${customer.side}`} - Position {customer.position}
                          </span>
                          <span className="customer-selection-price">${customer.price}/year</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {foundCustomer && (
                <div className="customer-found-container">
                  <div className="customer-info">
                    <h4>✓ Customer Found</h4>
                    <p><strong>Name:</strong> {foundCustomer.user_name}</p>
                    <p><strong>Seat:</strong> Layer {foundCustomer.layer}
                      {foundCustomer.side && ` - ${foundCustomer.side}`} - Position {foundCustomer.position}
                    </p>
                    <p><strong>Price:</strong> ${foundCustomer.price}/year</p>
                  </div>
                  <div className="customer-mini-map">
                    {renderCustomerMiniMap()}
                  </div>
                </div>
              )}

              {hasSearched && !foundCustomer && matchingCustomers.length === 0 && (
                <div className="no-customer-message">
                  <p>No customer found with name "{searchName}"</p>
                  <p>Please try a different name.</p>
                </div>
              )}
            </div>
          )}

          {/* Available Seats Section */}
          {searchMode === 'price' && (
            <div className="available-seats-section">
            <h3>
              Available Seats at ${selectedPrice}/year
              <span className="seat-count">({filteredSeats.length} seats)</span>
            </h3>

            {filteredSeats.length === 0 ? (
              <div className="no-seats-message">
                <p>No seats available at this price point.</p>
                <p>Try selecting a different price.</p>
              </div>
            ) : (
              <div className="seats-grid">
                {filteredSeats.map(seat => (
                  <div
                    key={seat.id}
                    className="seat-card"
                    onClick={() => handleSeatClick(seat)}
                  >
                    <div className="seat-card-header">
                      <span className="seat-id">{getSeatLabel(seat)}</span>
                      <span className="seat-price">${seat.price}</span>
                    </div>
                    <div className="seat-card-details">
                      <div className="detail-line">
                        <span className="detail-label">Type:</span>
                        <span className="detail-value">{getSeatTypeLabel(seat.seat_type)}</span>
                      </div>
                      <div className="detail-line">
                        <span className="detail-label">Layer:</span>
                        <span className="detail-value">{seat.layer}</span>
                      </div>
                      {seat.side && (
                        <div className="detail-line">
                          <span className="detail-label">Side:</span>
                          <span className="detail-value">{seat.side}</span>
                        </div>
                      )}
                      <div className="detail-line">
                        <span className="detail-label">Position:</span>
                        <span className="detail-value">{seat.position}</span>
                      </div>
                    </div>
                    <button className="select-seat-btn">Select This Seat</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Nearby Seats Section (for name search) */}
          {searchMode === 'name' && nearbySeats.length > 0 && (
            <div className="available-seats-section">
              <h3>
                Available Seats Near {foundCustomer.user_name}
                <span className="seat-count">({nearbySeats.length} seats)</span>
              </h3>

              <div className="seats-grid">
                {nearbySeats.map(seat => (
                  <div
                    key={seat.id}
                    className="seat-card nearby-seat"
                    onClick={() => handleSeatClick(seat)}
                  >
                    <div className="seat-card-header">
                      <span className="seat-id">{getSeatLabel(seat)}</span>
                      <span className="seat-price">${seat.price}</span>
                    </div>
                    <div className="seat-card-details">
                      <div className="detail-line">
                        <span className="detail-label">Type:</span>
                        <span className="detail-value">{getSeatTypeLabel(seat.seat_type)}</span>
                      </div>
                      <div className="detail-line">
                        <span className="detail-label">Layer:</span>
                        <span className="detail-value">{seat.layer}</span>
                      </div>
                      {seat.side && (
                        <div className="detail-line">
                          <span className="detail-label">Side:</span>
                          <span className="detail-value">{seat.side}</span>
                        </div>
                      )}
                      <div className="detail-line">
                        <span className="detail-label">Position:</span>
                        <span className="detail-value">{seat.position}</span>
                      </div>
                      <div className="detail-line proximity-badge">
                        <span className="detail-label">Distance:</span>
                        <span className="detail-value">{seat.distance} {seat.distance === 1 ? 'seat' : 'seats'} away</span>
                      </div>
                    </div>
                    <button className="select-seat-btn">Select This Seat</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SeatFinder;
