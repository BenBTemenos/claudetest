import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Famous person stories with image URLs (using placeholder images)
const famousStories = [
  { name: "Albert Einstein", story: "Einstein sat here during a physics conference in 1925. He spent the entire time doodling E=mc² variations on his napkin, including E=mc³ (which he crossed out immediately).", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Albert_Einstein_Head.jpg/220px-Albert_Einstein_Head.jpg" },
  { name: "Marie Curie", story: "Marie Curie attended a chemistry symposium here in 1903. She allegedly made the seat glow slightly for weeks afterwards.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Marie_Curie_c._1920s.jpg/220px-Marie_Curie_c._1920s.jpg" },
  { name: "Nikola Tesla", story: "Nikola Tesla occupied this seat in 1899. He claimed he could hear the electrical signals from the stage lighting system and spent the show humming along.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Tesla_circa_1890.jpeg/220px-Tesla_circa_1890.jpeg" },
  { name: "Charlie Chaplin", story: "Chaplin sat here for a silent film premiere. Ironically, he talked through the entire movie, explaining his comedy theories to the annoyed patron next to him.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Chaplin_The_Kid_edit.jpg/220px-Chaplin_The_Kid_edit.jpg" },
  { name: "Amelia Earhart", story: "Earhart watched a show here the night before her famous flight. She later joked that the uncomfortable seat prepared her for long flights.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Amelia_Earhart_standing_under_nose_of_her_Lockheed_Model_10-E_Electra.jpg/220px-Amelia_Earhart_standing_under_nose_of_her_Lockheed_Model_10-E_Electra.jpg" },
  { name: "Mark Twain", story: "Mark Twain fell asleep in this seat during a particularly boring lecture in 1885. His snoring became louder than the speaker.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Mark_Twain_by_AF_Bradley.jpg/220px-Mark_Twain_by_AF_Bradley.jpg" },
  { name: "Leonardo da Vinci", story: "Da Vinci (via time machine, allegedly) sat here and spent the show sketching flying machines inspired by the stage curtains.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Francesco_Melzi_-_Portrait_of_Leonardo.png/220px-Francesco_Melzi_-_Portrait_of_Leonardo.png" },
  { name: "William Shakespeare", story: "Shakespeare sat here and found the play so boring he started writing Hamlet on his program. That's the real origin story (citation needed).", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Shakespeare.jpg/220px-Shakespeare.jpg" },
  { name: "Cleopatra", story: "Cleopatra (also via time machine) occupied this seat and demanded the theater install a throne instead. They politely declined.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Cleopatra_VII_tetradrachm_Syracuse_mint.jpg/220px-Cleopatra_VII_tetradrachm_Syracuse_mint.jpg" },
  { name: "Wolfgang Mozart", story: "Mozart sat here at age 8 and composed a symphony in his head during intermission. He forgot it by the end of the show.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Wolfgang-amadeus-mozart_1.jpg/220px-Wolfgang-amadeus-mozart_1.jpg" },
  { name: "Isaac Newton", story: "Newton sat here when an apple rolled down the aisle. He started calculating its trajectory and missed the entire performance.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Sir_Isaac_Newton_%281643-1727%29.jpg/220px-Sir_Isaac_Newton_%281643-1727%29.jpg" },
  { name: "Harry Houdini", story: "Houdini sat here but kept escaping to the lobby. The ushers gave up trying to keep him in his seat.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Houdini_and_Jennie_the_Elephant_Performing.jpg/220px-Houdini_and_Jennie_the_Elephant_Performing.jpg" },
  { name: "Joan of Arc", story: "Joan of Arc attended a medieval play here. She left a review saying 'Historically inaccurate armor. 2/10.'", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Joan_of_Arc_miniature_graded.jpg/220px-Joan_of_Arc_miniature_graded.jpg" },
  { name: "Benjamin Franklin", story: "Franklin sat here during a thunderstorm. He kept suggesting they install lightning rods on the chandelier.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Benjamin_Franklin_by_Jean-Baptiste_Greuze.jpg/220px-Benjamin_Franklin_by_Jean-Baptiste_Greuze.jpg" },
  { name: "Galileo Galilei", story: "Galileo watched from this seat with a telescope he smuggled in. He was asked to leave for blocking others' view.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Justus_Sustermans_-_Portrait_of_Galileo_Galilei%2C_1636.jpg/220px-Justus_Sustermans_-_Portrait_of_Galileo_Galilei%2C_1636.jpg" },
  { name: "Wright Brothers", story: "The Wright Brothers sat here and argued about whether the stage should be redesigned with wings for better aerodynamics.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Wright_Brothers.jpg/220px-Wright_Brothers.jpg" },
  { name: "Thomas Edison", story: "Edison sat here testing his new portable light bulb. It kept blinding the people in front of him.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Thomas_Edison2.jpg/220px-Thomas_Edison2.jpg" },
  { name: "Ludwig van Beethoven", story: "Beethoven sat here and complained the orchestra was too quiet. They were playing at maximum volume.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Beethoven.jpg/220px-Beethoven.jpg" },
  { name: "Charles Darwin", story: "Darwin studied the evolution of seat comfort from this spot. His conclusion: 'This seat proves survival of the fittest posteriors.'", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Charles_Darwin_seated_crop.jpg/220px-Charles_Darwin_seated_crop.jpg" },
  { name: "Socrates", story: "Socrates questioned the meaning of theater from this seat. The usher asked him to please just watch the show.", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Socrates_Louvre.jpg/220px-Socrates_Louvre.jpg" }
];

// Error logging utility
const log3DError = async (errorType, errorMessage, errorStack) => {
  try {
    await axios.post(`${API_URL}/log-3d-error`, {
      timestamp: new Date().toISOString(),
      type: errorType,
      message: errorMessage,
      stack: errorStack,
      userAgent: navigator.userAgent
    });
  } catch (err) {
    console.error('Failed to log 3D error:', err);
  }
};

// Individual 3D Seat Component
function Seat3D({ position, seatData, onClick, onHover }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [starHovered, setStarHovered] = useState(false);

  // Determine if this seat is special (has a star)
  const isSpecialSeat = seatData.id && (seatData.id % 13 === 0 || seatData.id % 17 === 0) && seatData.id <= 340;
  const storyIndex = seatData.id ? seatData.id % famousStories.length : 0;

  // Determine seat color based on availability
  const getSeatColor = () => {
    if (hovered) return '#ffff00'; // Yellow on hover
    if (!seatData.is_available || seatData.is_booked) return '#9e9e9e'; // Gray if booked

    // Color by price
    if (seatData.price >= 500) return '#9333ea'; // Purple for expensive
    if (seatData.price >= 300) return '#3b82f6'; // Blue for mid-range
    return '#10b981'; // Green for affordable
  };

  useFrame((state) => {
    if (hovered && meshRef.current) {
      // Gentle bounce animation on hover
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.05;
    } else if (meshRef.current) {
      meshRef.current.position.y = position[1];
    }
  });

  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
      {/* Seat base */}
      <mesh
        ref={meshRef}
        onClick={() => onClick(seatData)}
        onPointerOver={() => {
          setHovered(true);
          onHover(seatData);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(null);
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color={getSeatColor()} metalness={0.2} roughness={0.5} />
      </mesh>

      {/* Seat back */}
      <mesh position={[0, 0.3, -0.15]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.3, 0.1]} />
        <meshStandardMaterial color={getSeatColor()} metalness={0.2} roughness={0.5} />
      </mesh>

      {/* Star indicator for special seats */}
      {isSpecialSeat && (
        <Html distanceFactor={10} position={[0.3, 0.5, 0]} zIndexRange={[0, 0]}>
          <div
            onMouseEnter={() => setStarHovered(true)}
            onMouseLeave={() => setStarHovered(false)}
            style={{
              fontSize: '20px',
              cursor: 'pointer',
              animation: 'twinkle 2s ease-in-out infinite',
              textShadow: '0 0 5px yellow',
              pointerEvents: 'auto',
              zIndex: 1
            }}
          >
            ⭐
          </div>
        </Html>
      )}

      {/* Story tooltip on star hover */}
      {isSpecialSeat && starHovered && (
        <Html distanceFactor={5} position={[0, 1, 0]}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.98)',
              color: '#333',
              padding: '20px 25px',
              borderRadius: '12px',
              fontSize: '14px',
              maxWidth: '400px',
              width: '400px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              pointerEvents: 'none',
              border: '2px solid #667eea',
              lineHeight: '1.6'
            }}
          >
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '10px',
              color: '#667eea',
              textAlign: 'center'
            }}>
              🌟 {famousStories[storyIndex].name}
            </div>
            <div style={{ fontSize: '13px', color: '#555' }}>
              {famousStories[storyIndex].story}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#888',
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid #ddd',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              Seat #{seatData.id}
            </div>
          </div>
        </Html>
      )}

      {/* Hover tooltip */}
      {hovered && !starHovered && (
        <Html distanceFactor={10} zIndexRange={[100, 100]}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            transform: 'translate(-50%, -120%)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            zIndex: 100
          }}>
            <div><strong>Seat #{seatData.id}</strong></div>
            <div>Layer {seatData.layer} {seatData.side && `- ${seatData.side}`}</div>
            <div>${seatData.price}/year</div>
            <div style={{ color: seatData.is_available ? '#51cf66' : '#ff6b6b' }}>
              {seatData.is_available ? 'Available' : 'Booked'}
            </div>
            {seatData.is_available && (() => {
              let acInfo;
              if (seatData.seat_type === 'perpendicular_front') {
                acInfo = { icon: '❄️❄️❄️', desc: 'Max AC' };
              } else if (seatData.seat_type === 'regular_top' || seatData.seat_type === 'regular_bottom') {
                if (seatData.position >= 5 && seatData.position <= 15) {
                  acInfo = { icon: '❄️❄️', desc: 'Good AC' };
                } else {
                  acInfo = { icon: '❄️', desc: 'Moderate AC' };
                }
              } else {
                acInfo = { icon: '❄️', desc: 'Standard AC' };
              }
              return <div style={{ marginTop: '4px', color: '#88ccff' }}>{acInfo.icon} {acInfo.desc}</div>;
            })()}
          </div>
        </Html>
      )}

    </group>
  );
}

// Stage Component
function Stage() {
  return (
    <group position={[0, 0, -15]}>
      {/* Stage platform - Modern dark wood */}
      <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[20, 1, 6]} />
        <meshStandardMaterial color="#374151" metalness={0.2} roughness={0.6} />
      </mesh>

      {/* Stage backdrop - Modern gradient */}
      <mesh position={[0, 2, -2.5]} castShadow receiveShadow>
        <boxGeometry args={[20, 5, 0.5]} />
        <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Stage text */}
      <Text
        position={[0, 2, -2]}
        fontSize={1.5}
        color="#f3f4f6"
        anchorX="center"
        anchorY="middle"
      >
        STAGE
      </Text>

      {/* NVIDIA Advertisement - Left side */}
      <mesh position={[-7, 2, -2.3]} castShadow receiveShadow>
        <boxGeometry args={[3, 2, 0.1]} />
        <meshStandardMaterial color="#76b900" metalness={0.1} roughness={0.3} />
      </mesh>
      <Text
        position={[-7, 2.3, -2.2]}
        fontSize={0.6}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        NVIDIA
      </Text>
      <Text
        position={[-7, 1.7, -2.2]}
        fontSize={0.3}
        color="#000000"
        anchorX="center"
        anchorY="middle"
      >
        Powering AI
      </Text>

      {/* AWS Advertisement - Right side */}
      <mesh position={[7, 2, -2.3]} castShadow receiveShadow>
        <boxGeometry args={[3, 2, 0.1]} />
        <meshStandardMaterial color="#ff9900" metalness={0.1} roughness={0.3} />
      </mesh>
      <Text
        position={[7, 2.3, -2.2]}
        fontSize={0.6}
        color="#232f3e"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        AWS
      </Text>
      <Text
        position={[7, 1.7, -2.2]}
        fontSize={0.3}
        color="#232f3e"
        anchorX="center"
        anchorY="middle"
      >
        Cloud Solutions
      </Text>
    </group>
  );
}

// Red Arrow Indicator Component
function RedArrow({ position }) {
  const arrowRef = useRef();

  useFrame((state) => {
    if (arrowRef.current) {
      // Animate arrow bouncing up and down - arrow tip touches seat at lowest point
      arrowRef.current.position.y = position[1] + 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });

  return (
    <group ref={arrowRef} position={position}>
      {/* Arrow shaft */}
      <mesh position={[0, 2, 0]} rotation={[Math.PI, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 2, 16]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>

      {/* Arrow head (cone) pointing down */}
      <mesh position={[0, 0.7, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.3, 0.6, 16]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>

      {/* Glow effect around arrow tip */}
      <pointLight position={[0, 0.5, 0]} intensity={2} color="#ff0000" distance={5} />
    </group>
  );
}

// Main 3D Venue Component
function VenueScene({ seats, onSeatClick, highlightedSeatId }) {
  // Convert seat layout to 3D positions based on layer, side, and position
  const getSeat3DPosition = (seat) => {
    let x = 0;
    let z = 0;

    // Z position based on layer (closer to stage = lower layer number)
    z = -12 + (seat.layer * 1.5);

    // X position based on side and position
    if (seat.seat_type === 'perpendicular_front') {
      // Front perpendicular seats (centered)
      x = -3 + (seat.position - 1) * 0.6;
    } else if (seat.side === 'left') {
      // Left side seats
      x = -10 + (seat.position - 1) * 0.6;
    } else if (seat.side === 'right') {
      // Right side seats
      x = 3 + (seat.position - 1) * 0.6;
    } else {
      // No side specified (perpendicular or center)
      x = -3 + (seat.position - 1) * 0.6;
    }

    return [x, 0, z];
  };

  return (
    <>
      {/* Lighting - Modern and bright */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-10, 8, -5]} intensity={0.8} />
      <pointLight position={[0, 10, 0]} intensity={1.2} />
      <pointLight position={[10, 5, 10]} intensity={0.6} color="#ffffff" />
      <pointLight position={[-10, 5, 10]} intensity={0.6} color="#ffffff" />

      {/* Stage */}
      <Stage />

      {/* Floor - Modern light gray */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[50, 40]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.1} roughness={0.8} />
      </mesh>

      {/* Seats */}
      {seats.map((seat) => (
        <Seat3D
          key={seat.id}
          position={getSeat3DPosition(seat)}
          seatData={seat}
          onClick={onSeatClick}
          onHover={() => {}}
        />
      ))}

      {/* Red Arrow pointing to highlighted seat */}
      {highlightedSeatId && (() => {
        const highlightedSeat = seats.find(s => s.id === highlightedSeatId);
        if (highlightedSeat) {
          return <RedArrow position={getSeat3DPosition(highlightedSeat)} />;
        }
        return null;
      })()}

      {/* Camera Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    log3DError('React Error Boundary', error.message, error.stack);
    console.error('3D View Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%',
          height: '600px',
          background: '#1a1a2e',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: 'white'
        }}>
          <h2>❌ 3D View Error</h2>
          <p>Unable to load 3D view. Error has been logged.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main Component Export
export default function VenueView3D({ seats, onSeatSelect, highlightedSeatId }) {
  const [renderError, setRenderError] = React.useState(null);

  const handleSeatClick = (seat) => {
    try {
      if (!seat.is_booked) {
        onSeatSelect(seat);
      }
    } catch (error) {
      log3DError('Seat Click Error', error.message, error.stack);
      setRenderError(error);
    }
  };

  React.useEffect(() => {
    // Log 3D view initialization
    log3DError('3D View Init', 'User opened 3D view', 'N/A');

    // Catch any unhandled errors in 3D view
    const handleError = (event) => {
      if (event.message.includes('three') || event.message.includes('WebGL')) {
        log3DError('3D Runtime Error', event.message, event.error?.stack || 'N/A');
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (renderError) {
    return (
      <div style={{
        width: '100%',
        height: '600px',
        background: '#1a1a2e',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <p>Error: {renderError.message}</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div style={{
        width: '100%',
        height: '600px',
        backgroundImage: 'url(/Geneva.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '8px',
        position: 'relative'
      }}>
        <Canvas
          camera={{ position: [0, 15, 20], fov: 60 }}
          style={{ width: '100%', height: '100%' }}
          shadows
          onCreated={({ gl }) => {
            // Log WebGL context creation
            log3DError('WebGL Context', 'WebGL context created successfully', 'N/A');
          }}
          onError={(error) => {
            log3DError('Canvas Error', error.message, error.stack);
          }}
        >
          <VenueScene seats={seats} onSeatClick={handleSeatClick} highlightedSeatId={highlightedSeatId} />
        </Canvas>

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '15px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px'
      }}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>3D Venue View</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '16px', height: '16px', background: '#9333ea', borderRadius: '2px' }}></div>
          <span>VIP Seats</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '16px', height: '16px', background: '#3b82f6', borderRadius: '2px' }}></div>
          <span>Premium Seats</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '16px', height: '16px', background: '#10b981', borderRadius: '2px' }}></div>
          <span>Regular Seats</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', background: '#9e9e9e', borderRadius: '2px' }}></div>
          <span>Booked</span>
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.7 }}>
          🖱️ Click & drag to rotate • Scroll to zoom
        </div>
      </div>
      </div>
    </ErrorBoundary>
  );
}
