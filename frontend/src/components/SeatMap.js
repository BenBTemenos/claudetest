import React from 'react';
import './SeatMap.css';
import Seat from './Seat';

function SeatMap({ seats, selectedSeat, onSeatClick }) {
  // Organize seats by layer and side
  const organizeSeats = () => {
    const organized = {};

    seats.forEach(seat => {
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

  const organizedSeats = organizeSeats();
  const layers = Object.keys(organizedSeats).sort((a, b) => a - b);

  return (
    <div className="seat-map-container">
      <div className="room-label">STAGE / FRONT</div>

      <div className="seat-map">
        {layers.map(layer => (
          <div key={layer} className="layer">
            <div className="layer-label">Layer {layer}</div>

            <div className="seats-row">
              {/* Left side */}
              <div className="side left-side">
                {organizedSeats[layer].left.map(seat => (
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
                {organizedSeats[layer].right.map(seat => (
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
