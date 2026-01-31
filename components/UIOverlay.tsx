import React, { useMemo, useState } from 'react';
import { GamePhase } from '../types';
import { COLORS, TOTAL_ANGER } from '../constants';

interface UIOverlayProps {
  anger: number;
  gamePhase: GamePhase;
  onReset: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ anger, gamePhase, onReset }) => {
  const [showNote, setShowNote] = useState(false);
  
  // Interpolate color based on anger (Red -> Orange -> Pink -> Purple)
  const barColor = useMemo(() => {
    const p = anger / TOTAL_ANGER;
    if (p > 0.6) return 'bg-rose-500';
    if (p > 0.3) return 'bg-orange-400';
    return 'bg-violet-400';
  }, [anger]);

  // Labels based on progress
  const angerLabel = useMemo(() => {
    if (anger > 80) return "Gussa Level: High";
    if (anger > 50) return "Thoda kam ho raha hai...";
    if (anger > 20) return "Almost calm...";
    return "Bas hone wala hai...";
  }, [anger]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      
      {/* Top Bar - Gussa Meter */}
      <div 
        className={`w-full max-w-md mx-auto transition-opacity duration-1000 ${
          gamePhase === GamePhase.FINISHED ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="glass-panel p-4 rounded-2xl shadow-sm">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-slate-600 font-bold text-sm tracking-wide uppercase">
              {angerLabel}
            </h2>
            <span className="text-slate-400 text-xs font-semibold">{Math.max(0, Math.floor(anger))}%</span>
          </div>
          <div className="h-3 w-full bg-white/50 rounded-full overflow-hidden">
            <div 
              className={`h-full ${barColor} transition-all duration-500 ease-out`}
              style={{ width: `${Math.max(0, (anger / TOTAL_ANGER) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tutorial / Hint (Only at start) */}
      {anger === TOTAL_ANGER && gamePhase === GamePhase.PLAYING && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-center opacity-60 animate-pulse">
          <p className="text-slate-500 font-medium text-lg">Drag back to throw</p>
          <div className="w-6 h-6 border-b-2 border-l-2 border-slate-400 -rotate-45 mx-auto mt-2"></div>
        </div>
      )}

      {/* End Screen Overlay */}
      {gamePhase === GamePhase.FINISHED && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-violet-100/40 backdrop-blur-sm transition-all duration-1000">
          
          {/* Main Result Card */}
          {!showNote && (
            <div className="max-w-xs md:max-w-sm w-full text-center p-8 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white transform animate-in fade-in zoom-in duration-700">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl animate-bounce">
                😅
              </div>
              <h1 className="text-2xl font-bold text-slate-700 mb-4 font-heading">
                Gussa nikal gaya?
              </h1>
              <p className="text-slate-600 leading-relaxed mb-8">
                Ab ek chance do...<br/>
                Dekho mujhe sachme accha nhi lagta tumse ladai karke. Maaf Kardo na Deviii😭
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setShowNote(true)}
                  className="w-full py-3 px-6 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-xl font-bold text-sm shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2"
                >
                  <span>💌</span> Read Message
                </button>

                <button 
                  onClick={onReset}
                  className="w-full py-3 px-6 bg-white hover:bg-slate-50 text-slate-500 rounded-xl font-bold text-sm border border-slate-200 transition-colors"
                >
                  Replay
                </button>
              </div>
            </div>
          )}

          {/* Message Note Modal */}
          {showNote && (
            <div className="max-w-xs md:max-w-sm w-full p-8 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 transform animate-in zoom-in duration-300 relative mx-4">
              <button 
                onClick={() => setShowNote(false)}
                className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              
              <div className="mb-6">
                 <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-xl mb-4 text-rose-500">
                   📝
                 </div>
                 <h3 className="text-lg font-bold text-slate-800 mb-2">For You</h3>
                 <div className="h-1 w-10 bg-rose-300 rounded-full"></div>
              </div>

              <p className="text-slate-600 leading-relaxed font-medium text-base mb-8">
                "I know I messed up, and I'm really sorry. You are my favorite person, and I hate fighting with you. Can we make up? 🥺"
              </p>

              <button 
                  onClick={() => { setShowNote(false); onReset(); }}
                  className="w-full py-3 px-6 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-200 transition-all active:scale-95"
                >
                  Okay, Forgiven (Replay)
              </button>
           </div>
          )}

        </div>
      )}
    </div>
  );
};

export default UIOverlay;