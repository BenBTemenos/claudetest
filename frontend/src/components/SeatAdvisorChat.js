import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './SeatAdvisorChat.css';
import VenueView3D from './VenueView3D';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SeatAdvisorChat = ({ onSeatRecommend, onClose, onRecommendationsReceived }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState('welcome');
  const [preferences, setPreferences] = useState({
    budget_max: null,
    ac_importance: 'optional',
    view_importance: 5,
    famous_people: false,
    position_preference: null,
    location_preference: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [chatMode, setChatMode] = useState('guided'); // 'guided' or 'open'
  const [userInput, setUserInput] = useState('');
  const [sessionId, setSessionId] = useState(null); // Azure OpenAI session tracking
  const [selectedSeatsForComparison, setSelectedSeatsForComparison] = useState([]); // Compare feature
  const [aiThinkingMessage, setAiThinkingMessage] = useState(''); // Dynamic loading message
  const [embeddedSeat, setEmbeddedSeat] = useState(null); // Seat to show in embedded map
  const [showEmbeddedMap, setShowEmbeddedMap] = useState(false); // Toggle embedded map
  const [allSeats, setAllSeats] = useState([]); // All seats for 3D view
  const [lastRecommendedPrices, setLastRecommendedPrices] = useState([]); // Track recommended seat prices
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch all seats for 3D view
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await axios.get(`${API_URL}/seats`);
        setAllSeats(response.data);
      } catch (error) {
        console.error('Error fetching seats for 3D view:', error);
      }
    };
    fetchSeats();
  }, []);

  useEffect(() => {
    // Initial welcome message - only run once
    if (!hasStarted) {
      setHasStarted(true);
      addBotMessage(
        "👋 Hi! I'm your Seat Advisor. I'll help you find the perfect seat based on your preferences. Let's get started!"
      );
      setTimeout(() => {
        askBudget();
      }, 1000);
    }
  }, [hasStarted]);

  const addBotMessage = (text, options = null, horizontalLayout = false, customContent = null) => {
    setMessages(prev => [...prev, { type: 'bot', text, options, horizontalLayout, customContent, timestamp: Date.now() }]);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { type: 'user', text, timestamp: Date.now() }]);
  };

  const askBudget = () => {
    addBotMessage(
      "What's your maximum budget per year for a seat?",
      [
        { label: 'Up to $200', value: 200 },
        { label: 'Up to $400', value: 400 },
        { label: 'Up to $600', value: 600 },
        { label: 'No limit', value: 1000 }
      ]
    );
    setCurrentStep('budget');
  };

  const askAC = () => {
    addBotMessage(
      "How important is air conditioning to you?",
      [
        { label: '🔴 Required - Must have AC', value: 'required' },
        { label: '🟡 Preferred - Nice to have', value: 'preferred' },
        { label: '⚪ Optional - Don\'t care', value: 'optional' }
      ]
    );
    setCurrentStep('ac');
  };

  const askView = () => {
    addBotMessage(
      "How important is the view quality? (Rate 0-10, where 10 is extremely important)",
      [
        { label: '⭐⭐⭐⭐⭐ Critical (10)', value: 10 },
        { label: '⭐⭐⭐⭐ Very Important (8)', value: 8 },
        { label: '⭐⭐⭐ Somewhat Important (5)', value: 5 },
        { label: '⭐⭐ Not Very Important (3)', value: 3 },
        { label: '⭐ Don\'t Care (0)', value: 0 }
      ]
    );
    setCurrentStep('view');
  };

  const askFamousPeople = () => {
    addBotMessage(
      "Are you interested in seats with historical significance (where famous people sat)?",
      [
        { label: '✨ Yes, that would be special!', value: true },
        { label: '🤷 No, doesn\'t matter', value: false }
      ]
    );
    setCurrentStep('famous');
  };

  const askPosition = () => {
    addBotMessage(
      "Do you have a seating position preference?",
      [
        { label: '🚪 Aisle - Easy access', value: 'aisle' },
        { label: '🎯 Center - Best view', value: 'center' },
        { label: '🤷 No preference', value: null }
      ]
    );
    setCurrentStep('position');
  };

  const askLocation = () => {
    addBotMessage(
      "Which location do you prefer?",
      [
        { label: '⬆️ Front - Close to stage', value: 'front' },
        { label: '⏺️ Middle - Balanced', value: 'middle' },
        { label: '⬇️ Back - Overview', value: 'back' },
        { label: '🤷 No preference', value: null }
      ]
    );
    setCurrentStep('location');
  };

  const handleOptionClick = async (option) => {
    // Add user's choice to chat
    addUserMessage(option.label);

    // Update preferences based on current step
    let updatedPreferences = { ...preferences };

    switch (currentStep) {
      case 'budget':
        updatedPreferences.budget_max = option.value;
        setPreferences(updatedPreferences);
        setTimeout(() => askAC(), 500);
        break;

      case 'ac':
        updatedPreferences.ac_importance = option.value;
        setPreferences(updatedPreferences);
        setTimeout(() => askView(), 500);
        break;

      case 'view':
        updatedPreferences.view_importance = option.value;
        setPreferences(updatedPreferences);
        setTimeout(() => askFamousPeople(), 500);
        break;

      case 'famous':
        updatedPreferences.famous_people = option.value;
        setPreferences(updatedPreferences);
        setTimeout(() => askPosition(), 500);
        break;

      case 'position':
        updatedPreferences.position_preference = option.value;
        setPreferences(updatedPreferences);
        setTimeout(() => askLocation(), 500);
        break;

      case 'location':
        updatedPreferences.location_preference = option.value;
        setPreferences(updatedPreferences);

        // All questions answered - get recommendations
        addBotMessage("Perfect! Let me find the best seats for you... 🔍");
        setIsLoading(true);

        setTimeout(async () => {
          await fetchRecommendations(updatedPreferences);
        }, 1000);
        break;

      default:
        break;
    }
  };

  const fetchRecommendations = async (prefs) => {
    try {
      setAiThinkingMessage('🔍 Finding the best seats for you...');

      // Ensure all fields have default values
      const requestData = {
        budget_max: prefs.budget_max || null,
        budget_min: prefs.budget_min || 0,
        ac_importance: prefs.ac_importance || 'optional',
        view_importance: prefs.view_importance !== undefined ? prefs.view_importance : 5,
        famous_people: prefs.famous_people || false,
        position_preference: prefs.position_preference || null,
        location_preference: prefs.location_preference || null,
        limit: 3
      };

      console.log('Fetching recommendations with:', requestData);

      const response = await axios.post(`${API_URL}/seat-recommendations`, requestData);

      setRecommendations(response.data);
      setIsLoading(false);
      setCurrentStep('results');

      // Track recommended seat prices for "cheaper" functionality
      if (response.data.recommendations.length > 0) {
        const prices = response.data.recommendations.map(rec => rec.seat.price);
        setLastRecommendedPrices(prices);
      }

      // Notify parent component to highlight recommended seats
      if (onRecommendationsReceived && response.data.recommendations.length > 0) {
        onRecommendationsReceived(response.data.recommendations);
      }

      // Display summary
      addBotMessage(response.data.summary);

      // Display top recommendations
      if (response.data.recommendations.length > 0) {
        setTimeout(() => {
          addBotMessage(
            `Here are my top ${response.data.recommendations.length} recommendations for you:`,
            null
          );

          response.data.recommendations.forEach((rec, index) => {
            setTimeout(() => {
              displayRecommendation(rec, index);
            }, (index + 1) * 800);
          });

          // Add refinement prompt with quick reply buttons
          setTimeout(() => {
            addBotMessage(
              "💬 Want to refine these results? Use quick actions below or type your request:",
              [
                { label: '💰 Show Cheaper', value: 'cheaper', action: () => handleShowCheaper() },
                { label: '💎 Better View', value: 'view', action: () => handleQuickRefinement('I want seats with better view') },
                { label: '⬆️ Front Section', value: 'front', action: () => handleQuickRefinement('show me front section seats') },
                { label: '❄️ With AC', value: 'ac', action: () => handleQuickRefinement('I need air conditioning') },
                { label: '🌡️ No AC Needed', value: 'no-ac', action: () => handleQuickRefinement('AC is not important, show all options') }
              ]
            );
          }, (response.data.recommendations.length + 1) * 800 + 500);
        }, 1000);
      } else {
        addBotMessage("Sorry, no seats match your criteria. Try adjusting your preferences.");
      }

    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setIsLoading(false);
      addBotMessage("Sorry, there was an error getting recommendations. Please try again.");
    }
  };

  const handleViewOnMap = (seat) => {
    // Show seat in embedded map view
    setEmbeddedSeat(seat);
    setShowEmbeddedMap(true);

    // Also notify parent to highlight on main map
    if (onSeatRecommend) {
      onSeatRecommend(seat);
    }

    addUserMessage(`Show me Seat #${seat.id} on the map`);
    addBotMessage(`📍 Showing Seat #${seat.id} in the embedded map view! ➡️`);
  };

  const handleCompareToggle = (seat) => {
    setSelectedSeatsForComparison(prev => {
      const isSelected = prev.find(s => s.id === seat.id);
      if (isSelected) {
        // Remove from comparison
        return prev.filter(s => s.id !== seat.id);
      } else if (prev.length < 2) {
        // Add to comparison (max 2)
        return [...prev, seat];
      } else {
        // Replace oldest
        return [prev[1], seat];
      }
    });
  };

  const displayRecommendation = (rec, index) => {
    const seat = rec.seat;
    const seatLabel = `Seat #${seat.id} - Layer ${seat.layer}${seat.side ? `, ${seat.side}` : ''}, Position ${seat.position}`;
    const isSelectedForComparison = selectedSeatsForComparison.find(s => s.id === seat.id);

    const message = `
**${index + 1}. ${seatLabel}**
💰 **$${seat.price}/year**
🏆 **${rec.match_quality}** (${rec.score}% match)

${rec.explanation.map(exp => `• ${exp}`).join('\n')}
    `.trim();

    addBotMessage(message, [
      {
        label: '✅ Select',
        value: 'select',
        action: () => handleSelectSeat(seat)
      },
      {
        label: '📍 View on Map',
        value: 'view',
        action: () => handleViewOnMap(seat)
      },
      {
        label: isSelectedForComparison ? '✓ Selected' : '🔍 Compare',
        value: 'compare',
        action: () => handleCompareToggle(seat)
      }
    ], true); // Pass true to indicate horizontal layout
  };

  const handleShowCheaper = async () => {
    // Calculate the cheapest recommended seat price from current recommendations
    let prices = lastRecommendedPrices;

    // If lastRecommendedPrices is empty, try to get from recommendations state
    if (prices.length === 0 && recommendations && recommendations.recommendations) {
      prices = recommendations.recommendations.map(rec => rec.seat.price);
    }

    if (prices.length === 0) {
      addBotMessage("I need to show you some recommendations first!");
      return;
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Set budget to be below the cheapest recommended seat
    // This ensures ALL new recommendations will be cheaper than ALL previous ones
    const newBudget = Math.max(100, minPrice - 1); // Just below minimum price

    addUserMessage('Show me cheaper options');
    addBotMessage(`Looking for seats cheaper than your previous options (which ranged from $${minPrice}-$${maxPrice})... 💰`);

    // Update preferences with new budget
    const updatedPreferences = {
      ...preferences,
      budget_max: newBudget
    };
    setPreferences(updatedPreferences);

    // Fetch new recommendations with lower budget
    setIsLoading(true);
    setTimeout(async () => {
      await fetchRecommendations(updatedPreferences);
    }, 500);
  };

  const handleQuickRefinement = async (message) => {
    // Simulate user sending the quick reply message
    addUserMessage(message);
    setUserInput('');
    setIsLoading(true);
    setAiThinkingMessage('🤖 Refining your search...');

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        message: message,
        session_id: sessionId
      });

      if (response.data.session_id && !sessionId) {
        setSessionId(response.data.session_id);
      }

      setPreferences(response.data.preferences);
      addBotMessage(response.data.response);

      // Fetch new recommendations
      setTimeout(async () => {
        setAiThinkingMessage('🔍 Finding updated recommendations...');
        await fetchRecommendations(response.data.preferences);
      }, 500);

      setIsLoading(false);
    } catch (error) {
      console.error('Error in quick refinement:', error);
      addBotMessage("Sorry, I had trouble refining. Could you try again?");
      setIsLoading(false);
    }
  };

  const handleSelectSeat = (seat) => {
    addUserMessage(`I'll take Seat #${seat.id}!`);
    addBotMessage("Great choice! Redirecting you to the booking form...");

    setTimeout(() => {
      if (onSeatRecommend) {
        onSeatRecommend(seat);
      }
      handleClose();
    }, 1500);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const handleCompareSeats = () => {
    if (selectedSeatsForComparison.length !== 2) {
      addBotMessage("Please select exactly 2 seats to compare!");
      return;
    }

    const [seat1, seat2] = selectedSeatsForComparison;
    const priceDiff = Math.abs(seat1.price - seat2.price);
    const cheaper = seat1.price < seat2.price ? seat1 : seat2;

    // Create custom two-column comparison content
    const comparisonContent = (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        width: '100%',
        fontSize: '14px'
      }}>
        {/* Header */}
        <div style={{
          gridColumn: '1 / -1',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '16px',
          marginBottom: '8px',
          borderBottom: '2px solid #667eea',
          paddingBottom: '8px'
        }}>
          🔍 Seat Comparison
        </div>

        {/* Seat Headers */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          Seat #{seat1.id}
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          Seat #{seat2.id}
        </div>

        {/* Price Row */}
        <div style={{ padding: '10px', background: seat1.price === cheaper.price ? '#d4edda' : '#f8f9fa', borderRadius: '6px' }}>
          <div style={{ fontWeight: 'bold', color: '#667eea', marginBottom: '4px' }}>💰 Price</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>${seat1.price}/year</div>
          {seat1.price === cheaper.price && <div style={{ color: '#28a745', fontSize: '12px', marginTop: '4px' }}>✓ Cheaper</div>}
        </div>
        <div style={{ padding: '10px', background: seat2.price === cheaper.price ? '#d4edda' : '#f8f9fa', borderRadius: '6px' }}>
          <div style={{ fontWeight: 'bold', color: '#667eea', marginBottom: '4px' }}>💰 Price</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>${seat2.price}/year</div>
          {seat2.price === cheaper.price && <div style={{ color: '#28a745', fontSize: '12px', marginTop: '4px' }}>✓ Cheaper</div>}
        </div>

        {/* AC Row */}
        <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '6px' }}>
          <div style={{ fontWeight: 'bold', color: '#667eea', marginBottom: '4px' }}>❄️ Air Conditioning</div>
          <div>{seat1.has_ac ? '✓ Yes' : '✗ No'}</div>
        </div>
        <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '6px' }}>
          <div style={{ fontWeight: 'bold', color: '#667eea', marginBottom: '4px' }}>❄️ Air Conditioning</div>
          <div>{seat2.has_ac ? '✓ Yes' : '✗ No'}</div>
        </div>

        {/* View Quality Row */}
        <div style={{ padding: '10px', background: seat1.view_quality > seat2.view_quality ? '#d4edda' : '#f8f9fa', borderRadius: '6px' }}>
          <div style={{ fontWeight: 'bold', color: '#667eea', marginBottom: '4px' }}>👁️ View Quality</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{seat1.view_quality}/10</div>
          {seat1.view_quality > seat2.view_quality && <div style={{ color: '#28a745', fontSize: '12px', marginTop: '4px' }}>✓ Better view</div>}
        </div>
        <div style={{ padding: '10px', background: seat2.view_quality > seat1.view_quality ? '#d4edda' : '#f8f9fa', borderRadius: '6px' }}>
          <div style={{ fontWeight: 'bold', color: '#667eea', marginBottom: '4px' }}>👁️ View Quality</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{seat2.view_quality}/10</div>
          {seat2.view_quality > seat1.view_quality && <div style={{ color: '#28a745', fontSize: '12px', marginTop: '4px' }}>✓ Better view</div>}
        </div>

        {/* Location Row */}
        <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '6px' }}>
          <div style={{ fontWeight: 'bold', color: '#667eea', marginBottom: '4px' }}>📍 Location</div>
          <div>Layer {seat1.layer}</div>
          <div>{seat1.side || 'Center'}</div>
          <div>Position {seat1.position}</div>
        </div>
        <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '6px' }}>
          <div style={{ fontWeight: 'bold', color: '#667eea', marginBottom: '4px' }}>📍 Location</div>
          <div>Layer {seat2.layer}</div>
          <div>{seat2.side || 'Center'}</div>
          <div>Position {seat2.position}</div>
        </div>

        {/* Famous History Row */}
        <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '6px' }}>
          <div style={{ fontWeight: 'bold', color: '#667eea', marginBottom: '4px' }}>🎭 Famous History</div>
          <div>{seat1.famous_seat ? '✨ Yes!' : 'No'}</div>
        </div>
        <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '6px' }}>
          <div style={{ fontWeight: 'bold', color: '#667eea', marginBottom: '4px' }}>🎭 Famous History</div>
          <div>{seat2.famous_seat ? '✨ Yes!' : 'No'}</div>
        </div>

        {/* Price Difference Summary */}
        <div style={{
          gridColumn: '1 / -1',
          padding: '12px',
          background: '#e3f2fd',
          borderRadius: '6px',
          textAlign: 'center',
          marginTop: '8px',
          fontWeight: 'bold'
        }}>
          💵 Price difference: ${priceDiff}/year
        </div>
      </div>
    );

    addBotMessage("", [
      { label: `✅ Choose Seat #${seat1.id}`, value: 'select1', action: () => handleSelectSeat(seat1) },
      { label: `✅ Choose Seat #${seat2.id}`, value: 'select2', action: () => handleSelectSeat(seat2) }
    ], false, comparisonContent);
  };

  const handleRestart = () => {
    setMessages([]);
    setCurrentStep('welcome');
    setPreferences({
      budget_max: null,
      ac_importance: 'optional',
      view_importance: 5,
      famous_people: false,
      position_preference: null,
      location_preference: null
    });
    setRecommendations(null);
    setChatMode('guided');
    setSessionId(null); // Clear session for fresh start
    setSelectedSeatsForComparison([]); // Clear comparison

    addBotMessage("Let's start over! I'll help you find the perfect seat.");
    setTimeout(() => askBudget(), 500);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const message = userInput.trim();
    addUserMessage(message);
    setUserInput('');
    setIsLoading(true);
    setAiThinkingMessage('🤖 Analyzing your preferences...');

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        message: message,
        session_id: sessionId
      });

      // Store session ID for future messages
      if (response.data.session_id && !sessionId) {
        setSessionId(response.data.session_id);
      }

      // Update preferences from Azure OpenAI
      setPreferences(response.data.preferences);

      // Add bot response with confidence indicator
      const confidence = response.data.confidence || 0.8;
      let confidenceEmoji = '🎯';
      let confidenceText = '';

      if (confidence >= 0.9) {
        confidenceEmoji = '🎯';
        confidenceText = `(${Math.round(confidence * 100)}% confident)`;
      } else if (confidence >= 0.7) {
        confidenceEmoji = '✓';
        confidenceText = `(${Math.round(confidence * 100)}% sure)`;
      } else if (confidence >= 0.5) {
        confidenceEmoji = '🤔';
        confidenceText = `(${Math.round(confidence * 100)}% - might need clarification)`;
      }

      const messageWithConfidence = confidence < 0.9 && confidence > 0
        ? `${response.data.response}\n\n${confidenceEmoji} ${confidenceText}`
        : response.data.response;

      addBotMessage(messageWithConfidence);

      // If ready for recommendations, fetch them
      if (response.data.ready_for_recommendations && currentStep !== 'results') {
        setCurrentStep('results');
        setTimeout(async () => {
          await fetchRecommendations(response.data.preferences);
        }, 1000);
      } else if (currentStep === 'results') {
        // User is refining results, fetch new recommendations automatically
        setTimeout(async () => {
          addBotMessage("Let me find updated recommendations for you... 🔍");
          await fetchRecommendations(response.data.preferences);
        }, 500);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error in chat:', error);
      addBotMessage("Sorry, I'm having trouble right now. Could you try again?");
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="seat-advisor-overlay">
      <div className="seat-advisor-chat">
        {/* Left Panel - Chat Interface */}
        <div className="seat-advisor-chat-left">
        <div className="chat-header">
          <div className="chat-header-content">
            <div className="chat-avatar">🎯</div>
            <div className="chat-title">
              <h3>Seat Advisor</h3>
              <span className="chat-status">
                {isLoading ? 'Finding seats...' : 'Online'}
              </span>
            </div>
          </div>
          <div className="chat-actions">
            {selectedSeatsForComparison.length === 2 && (
              <button
                className="chat-compare-btn"
                onClick={handleCompareSeats}
                title="Compare selected seats"
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  marginRight: '8px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🔍 Compare ({selectedSeatsForComparison.length})
              </button>
            )}
            {currentStep === 'results' && (
              <button className="chat-restart-btn" onClick={handleRestart} title="Start over">
                🔄
              </button>
            )}
            <button className="chat-close-btn" onClick={handleClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.type} ${msg.horizontalLayout ? 'horizontal-layout' : ''}`}>
              {msg.type === 'bot' && <div className="message-avatar">🤖</div>}
              <div className="message-content" style={msg.horizontalLayout ? { display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '12px', maxWidth: '90%' } : {}}>
                {msg.customContent ? (
                  <div className="message-text" style={{ width: '100%' }}>
                    {msg.customContent}
                  </div>
                ) : (
                  <div className="message-text" style={msg.horizontalLayout ? { flex: '1' } : {}}>
                    {msg.text.split('\n').map((line, i) => {
                      // Handle bold text
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <strong key={i}>{line.slice(2, -2)}</strong>;
                      }
                      return <div key={i}>{line}</div>;
                    })}
                  </div>
                )}
                {msg.options && (
                  <div className="message-options" style={msg.horizontalLayout ? {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginTop: '0',
                    flexShrink: 0
                  } : {}}>
                    {msg.options.map((option, optIdx) => (
                      <button
                        key={optIdx}
                        className="option-btn"
                        style={msg.horizontalLayout ? {
                          padding: '8px 12px',
                          fontSize: '12px',
                          whiteSpace: 'nowrap'
                        } : {}}
                        onClick={() => {
                          if (option.action) {
                            option.action();
                          } else {
                            handleOptionClick(option);
                          }
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {msg.type === 'user' && <div className="message-avatar">👤</div>}
            </div>
          ))}
          {isLoading && (
            <div className="chat-message bot">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="message-text">{aiThinkingMessage || '🤖 Thinking...'}</div>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-footer">
          {/* Chat Mode Toggle */}
          <div className="chat-mode-toggle">
            <button
              className={`mode-btn ${chatMode === 'guided' ? 'active' : ''}`}
              onClick={() => setChatMode('guided')}
              title="Answer step-by-step questions"
            >
              📋 Guided
            </button>
            <button
              className={`mode-btn ${chatMode === 'open' ? 'active' : ''}`}
              onClick={() => setChatMode('open')}
              title="Type your own questions"
            >
              💬 Open Chat
            </button>
          </div>

          {/* Text Input for Open Chat Mode */}
          {chatMode === 'open' && (
            <div className="chat-input-container">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={currentStep === 'results'
                  ? "Refine your search (e.g., 'cheaper', 'better view', 'front section')..."
                  : "Type your question or preference..."}
                className="chat-input"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                className="send-btn"
                disabled={!userInput.trim() || isLoading}
              >
                Send ➤
              </button>
            </div>
          )}

          {/* Info Text */}
          <div className="chat-info">
            {chatMode === 'guided'
              ? '💡 Answer the questions to get personalized recommendations'
              : currentStep === 'results'
              ? '✨ Refine your results by chatting with the AI'
              : '💬 Type naturally: "I need a seat with AC under $400"'}
          </div>
        </div>
        </div>

        {/* Right Panel - Embedded Map View */}
        <div className="seat-advisor-chat-right">
          <div className="embedded-map-container">
            {!showEmbeddedMap ? (
              <div className="embedded-map-placeholder">
                <h3>🗺️ Interactive Seat Map</h3>
                <p>Click "📍 View on Map" on any seat recommendation to see it highlighted here!</p>
                <div style={{ fontSize: '48px', opacity: 0.3, marginTop: '20px' }}>🎭</div>
              </div>
            ) : embeddedSeat ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  padding: '20px',
                  background: 'white',
                  borderBottom: '1px solid #e2e8f0',
                  borderRadius: '12px 12px 0 0',
                  margin: '0 20px',
                  marginTop: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ margin: '0 0 8px 0', color: '#2d3748', fontSize: '18px' }}>
                    📍 Seat #{embeddedSeat.id}
                  </h3>
                  <p style={{ margin: 0, color: '#718096', fontSize: '14px' }}>
                    Layer {embeddedSeat.layer} • {embeddedSeat.side || ''} Position {embeddedSeat.position}
                  </p>
                  <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '4px 12px',
                      background: '#f7fafc',
                      borderRadius: '12px',
                      fontSize: '13px',
                      color: '#2d3748'
                    }}>
                      💰 ${embeddedSeat.price}/year
                    </span>
                    {embeddedSeat.has_ac && (
                      <span style={{
                        padding: '4px 12px',
                        background: '#e6f7ff',
                        borderRadius: '12px',
                        fontSize: '13px',
                        color: '#0066cc'
                      }}>
                        ❄️ AC
                      </span>
                    )}
                    <span style={{
                      padding: '4px 12px',
                      background: '#fff4e6',
                      borderRadius: '12px',
                      fontSize: '13px',
                      color: '#cc6600'
                    }}>
                      👁️ View: {embeddedSeat.view_quality}/10
                    </span>
                  </div>
                  <button
                    onClick={() => setShowEmbeddedMap(false)}
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      background: '#f7f9fc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#718096'
                    }}
                  >
                    ← Hide Map
                  </button>
                </div>
                <div style={{
                  flex: 1,
                  margin: '0 20px 20px 20px',
                  background: '#1a1a2e',
                  borderRadius: '0 0 12px 12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  {allSeats.length > 0 ? (
                    <VenueView3D
                      seats={allSeats}
                      highlightedSeatId={embeddedSeat.id}
                      onSeatSelect={(seat) => {
                        addBotMessage(`You clicked on Seat #${seat.id}!`);
                      }}
                    />
                  ) : (
                    <div style={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <p>Loading 3D view...</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatAdvisorChat;
