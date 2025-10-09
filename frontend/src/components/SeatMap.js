import React from 'react';
import './SeatMap.css';
import Seat from './Seat';

function SeatMap({ seats, selectedSeat, onSeatClick }) {
  // Separate seat types: Part 3 (top regular), Part 1 (perpendicular), Part 2 (bottom regular)
  const regularTopSeats = seats.filter(s => s.seat_type === 'regular_top');
  const perpendicularFrontSeats = seats.filter(s => s.seat_type === 'perpendicular_front');
  const regularBottomSeats = seats.filter(s => s.seat_type === 'regular_bottom');

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
  const organizeRegular = (seatsList) => {
    const organized = {};

    seatsList.forEach(seat => {
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

  const organizedRegularTop = organizeRegular(regularTopSeats);
  const organizedPerpendicularFront = organizePerpendicular(perpendicularFrontSeats);
  const organizedRegularBottom = organizeRegular(regularBottomSeats);
  const regularTopLayers = Object.keys(organizedRegularTop).sort((a, b) => a - b);
  const perpendicularFrontLayers = Object.keys(organizedPerpendicularFront).sort((a, b) => a - b);
  const regularBottomLayers = Object.keys(organizedRegularBottom).sort((a, b) => a - b);

  return (
    <div className="seat-map-container">
      <div className="room-label">STAGE / FRONT</div>

      <div className="seat-map">
        {/* Part 3 - Top regular seats with aisle */}
        {regularTopLayers.map(layer => (
          <div key={layer} className="layer">
            <div className="seats-row">
              {/* Left side */}
              <div className="side left-side">
                {organizedRegularTop[layer].left.map(seat => (
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
                {organizedRegularTop[layer].right.map(seat => (
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

        {/* Separator between top regular and perpendicular */}
        {regularTopLayers.length > 0 && perpendicularFrontLayers.length > 0 && (
          <div className="seating-separator"></div>
        )}

        {/* Part 1 - Perpendicular front rows */}
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

        {/* Separator between perpendicular and bottom regular seats */}
        {perpendicularFrontLayers.length > 0 && regularBottomLayers.length > 0 && (
          <div className="seating-separator"></div>
        )}

        {/* Part 2 - Bottom regular seats with aisle */}
        {regularBottomLayers.map(layer => (
          <div key={layer} className="layer">
            <div className="seats-row">
              {/* Left side */}
              <div className="side left-side">
                {organizedRegularBottom[layer].left.map(seat => (
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
                {organizedRegularBottom[layer].right.map(seat => (
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
      </div>

      <div className="room-label">BACK</div>
    </div>
  );
}

export default SeatMap;
