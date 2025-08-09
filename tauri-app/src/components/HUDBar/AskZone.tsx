import React from 'react';

interface AskZoneProps {
  onClick: () => void;
}

const AskZone: React.FC<AskZoneProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="flex-1 px-4 py-2 rounded-full bg-white/10 border border-white/20 cursor-pointer hover:bg-white/15 transition-colors flex items-center min-w-0"
    >
      <span className="text-white/70 text-sm truncate">
        Cliquez pour poser votre question...
      </span>
    </div>
  );
};

export default AskZone;