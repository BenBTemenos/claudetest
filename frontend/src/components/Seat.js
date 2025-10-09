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

  return (
    <div
      className={getClassNames()}
      onClick={handleClick}
      title={isAvailable
        ? `Seat ${seat.position} - $${seat.price}/year`
        : `Seat ${seat.position} - Booked by ${seat.user_name}`
      }
    >
      <div className="seat-number">{seat.position}</div>
      <div className="seat-price">${seat.price}</div>
    </div>
  );
}

export default Seat;
