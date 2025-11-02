import React from 'react';
import { SessionState } from '../types';

interface OrbProps {
  sessionState: SessionState;
  onClick: () => void;
}

const Orb: React.FC<OrbProps> = ({ sessionState, onClick }) => {
  const getOrbState = () => {
    switch (sessionState) {
      case SessionState.IDLE:
        return {
          text: 'Tap to say hi!',
          animation: 'animate-pulse',
          bg: 'bg-gray-200 hover:bg-gray-300',
          textColor: 'text-gray-600',
          cursor: 'cursor-pointer',
        };
      case SessionState.CONNECTING:
        return {
          text: 'Getting ready for our chat!',
          animation: 'animate-spin',
          bg: 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-400 to-indigo-600',
          textColor: 'text-white/80',
          cursor: 'cursor-wait',
        };
      case SessionState.CONNECTED:
        return {
          text: "I'm all ears!",
          animation: 'animate-pulse',
          bg: 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-300 via-sky-400 to-blue-500',
          textColor: 'text-white',
          cursor: 'cursor-default',
        };
      case SessionState.ERROR:
        return {
          text: 'Uh oh! Tap to retry.',
          animation: '',
          bg: 'bg-red-400 hover:bg-red-500',
          textColor: 'text-white',
          cursor: 'cursor-pointer',
        };
      case SessionState.DISCONNECTED:
        return {
          text: 'Talk soon! Tap to call again.',
          animation: '',
          bg: 'bg-gray-200 hover:bg-gray-300',
          textColor: 'text-gray-600',
          cursor: 'cursor-pointer',
        };
      default:
        return { text: '', animation: '', bg: 'bg-gray-200' };
    }
  };

  const { text, animation, bg, textColor, cursor } = getOrbState();

  return (
    <div
      onClick={sessionState === SessionState.CONNECTED ? undefined : onClick}
      className={`w-56 h-56 rounded-full flex items-center justify-center text-center p-4 shadow-2xl transition-all duration-500 ${animation} ${bg} ${cursor}`}
    >
      <span className={`text-2xl font-semibold ${textColor}`}>{text}</span>
    </div>
  );
};

export default Orb;