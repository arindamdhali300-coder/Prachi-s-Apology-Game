import React, { useState, useEffect, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { GamePhase } from './types';
import { TOTAL_ANGER, ANGER_DRAIN_PER_HIT, COLORS } from './constants';

const App: React.FC = () => {
  const [anger, setAnger] = useState(TOTAL_ANGER);
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.PLAYING);
  // Using a key forces the component to remount, resetting all internal refs/physics state
  const [gameKey, setGameKey] = useState(0);

  // Background color interpolation based on anger
  const getBackgroundColor = () => {
    // 100 -> 0
    // Red (Start) -> Purple (End)
    // Simple rough visual interpolation via style is easiest
    if (anger > 60) return 'from-rose-50 to-orange-50';
    if (anger > 30) return 'from-orange-50 to-purple-50';
    return 'from-purple-50 to-indigo-50';
  };

  const handleHit = useCallback(() => {
    if (gamePhase !== GamePhase.PLAYING) return;

    setAnger((prev) => {
      const next = prev - ANGER_DRAIN_PER_HIT;
      
      // Check for End Condition
      if (next <= 0) {
        // Trigger ending sequence
        setGamePhase(GamePhase.ENDING);
        setTimeout(() => setGamePhase(GamePhase.FINISHED), 2000);
        return 0;
      }
      
      return next;
    });
  }, [gamePhase]);

  const handleReset = useCallback(() => {
    setAnger(TOTAL_ANGER);
    setGamePhase(GamePhase.PLAYING);
    setGameKey(prev => prev + 1);
  }, []);

  return (
    <div className={`relative w-full h-screen overflow-hidden bg-gradient-to-b ${getBackgroundColor()} transition-colors duration-[2000ms]`}>
      {/* The Game World */}
      <GameCanvas 
        key={gameKey}
        angerLevel={anger} 
        onHit={handleHit}
        gamePhase={gamePhase}
      />
      
      {/* The UI Layer */}
      <UIOverlay 
        anger={anger}
        gamePhase={gamePhase}
        onReset={handleReset}
      />
      
      {/* Audio Element for voice note (hidden, optional implementation) */}
      {/* <audio id="voice-note" src="/assets/voice.mp3" preload="auto"></audio> */}
    </div>
  );
};

export default App;