import React from 'react';
import './Seat.css';

function Seat({ seat, isSelected, onClick }) {
  const isAvailable = seat.is_available === 1;

  const getClassNames = () => {
    let classes = ['seat', `layer-${seat.layer}`];

    // Check if this is a VIP seat (F1-F40 or B1-B40)
    const isVIPFront = seat.seat_type === 'regular_top' && seat.fNumber && seat.fNumber <= 40;
    const isVIPBack = seat.seat_type === 'regular_bottom' && seat.bNumber && seat.bNumber <= 40;
    if (isVIPFront || isVIPBack) {
      classes.push('vip-seat');
    }

    // Check if this is a Premium seat (F41-F80 or B41-B80)
    const isPremiumFront = seat.seat_type === 'regular_top' && seat.fNumber && seat.fNumber >= 41 && seat.fNumber <= 80;
    const isPremiumBack = seat.seat_type === 'regular_bottom' && seat.bNumber && seat.bNumber >= 41 && seat.bNumber <= 80;
    if (isPremiumFront || isPremiumBack) {
      classes.push('premium-seat');
    }

    // Check if this is a Regular seat (F61-F100 or B61-B100)
    const isRegularFront = seat.seat_type === 'regular_top' && seat.fNumber && seat.fNumber >= 61 && seat.fNumber <= 100;
    const isRegularBack = seat.seat_type === 'regular_bottom' && seat.bNumber && seat.bNumber >= 61 && seat.bNumber <= 100;
    if (isRegularFront || isRegularBack) {
      classes.push('regular-seat');
    }

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
