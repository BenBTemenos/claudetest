import React from 'react';
import './Seat.css';

function Seat({ seat, isSelected, onClick }) {
  const isAvailable = seat.is_available === 1;

  const getClassNames = () => {
    let classes = ['seat', `layer-${seat.layer}`];

    if (!isAvailable) {
      classes.push('booked');
    } else if (isSelected) {
      classes.push('selected');
    } else {
      classes.push('available');
    }

    return classes.join(' ');
  };

  const handleClick = () => {
    if (isAvailable) {
      onClick();
    }
  };

  const getSeatLabel = () => {
    // Add "F" prefix for top regular front seats with continuous numbering
    if (seat.seat_type === 'regular_top' && seat.fNumber) {
      return `F${seat.fNumber}`;
    }
    // Add "M" prefix for perpendicular front seats with continuous numbering
    if (seat.seat_type === 'perpendicular_front' && seat.mNumber) {
      return `M${seat.mNumber}`;
    }
    // Add "B" prefix for bottom regular back seats with continuous numbering
    if (seat.seat_type === 'regular_bottom' && seat.bNumber) {
      return `B${seat.bNumber}`;
    }
    return seat.position;
  };

  const seatLabel = getSeatLabel();

  return (
    <div
      className={getClassNames()}
      onClick={handleClick}
      title={isAvailable
        ? `Seat ${seatLabel} - $${seat.price}/year`
        : `Seat ${seatLabel} - Booked by ${seat.user_name}`
      }
    >
      <div className="seat-number">{seatLabel}</div>
      <div className="seat-price">${seat.price}</div>
    </div>
  );
}

export default Seat;
