import React, { useState } from 'react';
import './Seat.css';

// Famous person stories for special seats
const famousStories = [
  { name: "Albert Einstein", story: "Einstein sat here during a physics conference in 1925. He spent the entire time doodling E=mc² variations on his napkin, including E=mc³ (which he crossed out immediately)." },
  { name: "Marie Curie", story: "Marie Curie attended a chemistry symposium here in 1903. She allegedly made the seat glow slightly for weeks afterwards." },
  { name: "Tesla", story: "Nikola Tesla occupied this seat in 1899. He claimed he could hear the electrical signals from the stage lighting system and spent the show humming along." },
  { name: "Charlie Chaplin", story: "Chaplin sat here for a silent film premiere. Ironically, he talked through the entire movie, explaining his comedy theories to the annoyed patron next to him." },
  { name: "Amelia Earhart", story: "Earhart watched a show here the night before her famous flight. She later joked that the uncomfortable seat prepared her for long flights." },
  { name: "Mark Twain", story: "Mark Twain fell asleep in this seat during a particularly boring lecture in 1885. His snoring became louder than the speaker." },
  { name: "Leonardo da Vinci", story: "Da Vinci (via time machine, allegedly) sat here and spent the show sketching flying machines inspired by the stage curtains." },
  { name: "Shakespeare", story: "Shakespeare sat here and found the play so boring he started writing Hamlet on his program. That's the real origin story (citation needed)." },
  { name: "Cleopatra", story: "Cleopatra (also via time machine) occupied this seat and demanded the theater install a throne instead. They politely declined." },
  { name: "Mozart", story: "Mozart sat here at age 8 and composed a symphony in his head during intermission. He forgot it by the end of the show." },
  { name: "Isaac Newton", story: "Newton sat here when an apple rolled down the aisle. He started calculating its trajectory and missed the entire performance." },
  { name: "Houdini", story: "Houdini sat here but kept escaping to the lobby. The ushers gave up trying to keep him in his seat." },
  { name: "Joan of Arc", story: "Joan of Arc attended a medieval play here. She left a review saying 'Historically inaccurate armor. 2/10.'" },
  { name: "Benjamin Franklin", story: "Franklin sat here during a thunderstorm. He kept suggesting they install lightning rods on the chandelier." },
  { name: "Galileo", story: "Galileo watched from this seat with a telescope he smuggled in. He was asked to leave for blocking others' view." },
  { name: "Wright Brothers", story: "The Wright Brothers sat here and argued about whether the stage should be redesigned with wings for better aerodynamics." },
  { name: "Thomas Edison", story: "Edison sat here testing his new portable light bulb. It kept blinding the people in front of him." },
  { name: "Beethoven", story: "Beethoven sat here and complained the orchestra was too quiet. They were playing at maximum volume." },
  { name: "Darwin", story: "Darwin studied the evolution of seat comfort from this spot. His conclusion: 'This seat proves survival of the fittest posteriors.'" },
  { name: "Socrates", story: "Socrates questioned the meaning of theater from this seat. The usher asked him to please just watch the show." }
];

function Seat({ seat, isSelected, isRecommended = false, onClick }) {
  const isAvailable = seat.is_available === 1;
  const [showStory, setShowStory] = useState(false);

  // Determine if this seat is special (has a star) based on seat id
  const isSpecialSeat = seat.id && (seat.id % 13 === 0 || seat.id % 17 === 0) && seat.id <= 340;
  const storyIndex = seat.id ? seat.id % famousStories.length : 0;

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
    } else if (isRecommended) {
      classes.push('recommended');
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

  const handleStarClick = (e) => {
    e.stopPropagation();
    setShowStory(true);
  };

  // Determine air conditioning proximity based on seat position
  const getAirConditioningInfo = () => {
    // Center seats (perpendicular front) are closest to AC
    if (seat.seat_type === 'perpendicular_front') {
      return { proximity: 'Excellent', icon: '❄️❄️❄️', description: 'Right under AC - Maximum cooling' };
    }

    // Regular top/bottom seats - check position
    if (seat.seat_type === 'regular_top' || seat.seat_type === 'regular_bottom') {
      // Positions 5-15 are closer to center
      if (seat.position >= 5 && seat.position <= 15) {
        return { proximity: 'Good', icon: '❄️❄️', description: 'Close to AC - Good cooling' };
      }
      // Positions 1-4 or 16-20 are further from center
      return { proximity: 'Moderate', icon: '❄️', description: 'Away from AC - Moderate cooling' };
    }

    return { proximity: 'Moderate', icon: '❄️', description: 'Standard cooling' };
  };

  const acInfo = getAirConditioningInfo();

  return (
    <>
      <div
        className={getClassNames()}
        onClick={handleClick}
        title={isAvailable
          ? `Seat ${seatLabel} - $${seat.price}/year\n${acInfo.icon} ${acInfo.description}`
          : `Seat ${seatLabel} - Booked by ${seat.user_name}`
        }
      >
        <div className="seat-number">{seatLabel}</div>
        <div className="seat-price">${seat.price}</div>

        {/* Star indicator for special seats */}
        {isSpecialSeat && (
          <div className="seat-star" onClick={handleStarClick} title="Click for a story!">
            ⭐
          </div>
        )}
      </div>

      {/* Story modal */}
      {showStory && (
        <div className="story-modal-overlay" onClick={() => setShowStory(false)}>
          <div className="story-modal" onClick={(e) => e.stopPropagation()}>
            <button className="story-close" onClick={() => setShowStory(false)}>×</button>
            <h2 style={{ textAlign: 'center' }}>🌟 Famous Seat Story</h2>
            <h3 style={{ textAlign: 'center', fontSize: '22px' }}>{famousStories[storyIndex].name}</h3>
            <p>{famousStories[storyIndex].story}</p>
            <p className="story-seat-info">Seat: {seatLabel}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default Seat;
