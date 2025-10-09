import React from 'react';
import './SeatMap.css';
import Seat from './Seat';

function SeatMap({ seats, selectedSeat, onSeatClick }) {
  // Separate perpendicular front, regular, and perpendicular back seats
  const perpendicularFrontSeats = seats.filter(s => s.seat_type === 'perpendicular_front');
  const regularSeats = seats.filter(s => s.seat_type === 'regular');
  const perpendicularBackSeats = seats.filter(s => s.seat_type === 'perpendicular_back');

  // Organize perpendicular seats by layer
  const organizePerpendicular = (seatsList) => {
    const organized = {};
    seatsList.forEach(seat => {
      if (!organized[seat.layer]) {
        organized[seat.layer] = [];
      }
      organized[seat.layer].push(seat);
    });

    // Sort by position
    Object.keys(organized).forEach(layer => {
      organized[layer].sort((a, b) => a.position - b.position);
    });

    return organized;
  };

  // Organize regular seats by layer and side
  const organizeRegular = () => {
    const organized = {};

    regularSeats.forEach(seat => {
      if (!organized[seat.layer]) {
        organized[seat.layer] = { left: [], right: [] };
      }
      organized[seat.layer][seat.side].push(seat);
    });

    // Sort positions
    Object.keys(organized).forEach(layer => {
      organized[layer].left.sort((a, b) => a.position - b.position);
      organized[layer].right.sort((a, b) => a.position - b.position);
    });

    return organized;
  };

  const organizedPerpendicularFront = organizePerpendicular(perpendicularFrontSeats);
  const organizedRegular = organizeRegular();
  const organizedPerpendicularBack = organizePerpendicular(perpendicularBackSeats);
  const perpendicularFrontLayers = Object.keys(organizedPerpendicularFront).sort((a, b) => a - b);
  const regularLayers = Object.keys(organizedRegular).sort((a, b) => a - b);
  const perpendicularBackLayers = Object.keys(organizedPerpendicularBack).sort((a, b) => a - b);

  return (
    <div className="seat-map-container">
      <div className="room-label">STAGE / FRONT</div>

      <div className="seat-map">
        {/* Perpendicular front rows */}
        {perpendicularFrontLayers.map(layer => (
          <div key={`perp-front-${layer}`} className="perpendicular-row">
            {organizedPerpendicularFront[layer].map(seat => (
              <Seat
                key={seat.id}
                seat={seat}
                isSelected={selectedSeat?.id === seat.id}
                onClick={() => onSeatClick(seat)}
              />
            ))}
          </div>
        ))}

        {/* Separator between perpendicular front and regular seats */}
        {perpendicularFrontLayers.length > 0 && regularLayers.length > 0 && (
          <div className="seating-separator"></div>
        )}

        {/* Regular seats with aisle */}
        {regularLayers.map(layer => (
          <div key={layer} className="layer">
            <div className="seats-row">
              {/* Left side */}
              <div className="side left-side">
                {organizedRegular[layer].left.map(seat => (
                  <Seat
                    key={seat.id}
                    seat={seat}
                    isSelected={selectedSeat?.id === seat.id}
                    onClick={() => onSeatClick(seat)}
                  />
                ))}
              </div>

              {/* Aisle */}
              <div className="aisle">
                <span className="aisle-label">AISLE</span>
              </div>

              {/* Right side */}
              <div className="side right-side">
                {organizedRegular[layer].right.map(seat => (
                  <Seat
                    key={seat.id}
                    seat={seat}
                    isSelected={selectedSeat?.id === seat.id}
                    onClick={() => onSeatClick(seat)}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Separator between regular seats and perpendicular back */}
        {regularLayers.length > 0 && perpendicularBackLayers.length > 0 && (
          <div className="seating-separator"></div>
        )}

        {/* Perpendicular back rows */}
        {perpendicularBackLayers.map(layer => (
          <div key={`perp-back-${layer}`} className="perpendicular-row">
            {organizedPerpendicularBack[layer].map(seat => (
              <Seat
                key={seat.id}
                seat={seat}
                isSelected={selectedSeat?.id === seat.id}
                onClick={() => onSeatClick(seat)}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="room-label">BACK</div>
    </div>
  );
}

export default SeatMap;
