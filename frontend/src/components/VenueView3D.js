import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

  // Determine seat color based on availability
  const getSeatColor = () => {
    if (hovered) return '#ffff00'; // Yellow on hover
    if (!seatData.is_available || seatData.is_booked) return '#ff0000'; // Red if booked

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
    <group position={position}>
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
      >
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color={getSeatColor()} />
      </mesh>

      {/* Seat back */}
      <mesh position={[0, 0.3, -0.15]}>
        <boxGeometry args={[0.4, 0.3, 0.1]} />
        <meshStandardMaterial color={getSeatColor()} />
      </mesh>

      {/* Hover tooltip */}
      {hovered && (
        <Html distanceFactor={10}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            transform: 'translate(-50%, -120%)'
          }}>
            <div><strong>Seat #{seatData.id}</strong></div>
            <div>Layer {seatData.layer} {seatData.side && `- ${seatData.side}`}</div>
            <div>${seatData.price}/year</div>
            <div style={{ color: seatData.is_available ? '#51cf66' : '#ff6b6b' }}>
              {seatData.is_available ? 'Available' : 'Booked'}
            </div>
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
      {/* Stage platform */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[20, 1, 6]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Stage backdrop */}
      <mesh position={[0, 2, -2.5]}>
        <boxGeometry args={[20, 5, 0.5]} />
        <meshStandardMaterial color="#2d2d2d" />
      </mesh>

      {/* Stage text */}
      <Text
        position={[0, 2, -2]}
        fontSize={1.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        STAGE
      </Text>
    </group>
  );
}

// Main 3D Venue Component
function VenueScene({ seats, onSeatClick }) {
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
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[0, 5, 0]} intensity={0.5} />

      {/* Stage */}
      <Stage />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[50, 40]} />
        <meshStandardMaterial color="#1a1a2e" />
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
export default function VenueView3D({ seats, onSeatSelect }) {
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
      <div style={{ width: '100%', height: '600px', background: '#0f172a', borderRadius: '8px' }}>
        <Canvas
          camera={{ position: [0, 15, 20], fov: 60 }}
          style={{ width: '100%', height: '100%' }}
          onCreated={({ gl }) => {
            // Log WebGL context creation
            log3DError('WebGL Context', 'WebGL context created successfully', 'N/A');
          }}
          onError={(error) => {
            log3DError('Canvas Error', error.message, error.stack);
          }}
        >
          <VenueScene seats={seats} onSeatClick={handleSeatClick} />
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
          <div style={{ width: '16px', height: '16px', background: '#10b981', borderRadius: '2px' }}></div>
          <span>Regular Seats</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '16px', height: '16px', background: '#3b82f6', borderRadius: '2px' }}></div>
          <span>Premium Seats</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '16px', height: '16px', background: '#9333ea', borderRadius: '2px' }}></div>
          <span>VIP Seats</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '16px', height: '16px', background: '#ff0000', borderRadius: '2px' }}></div>
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
