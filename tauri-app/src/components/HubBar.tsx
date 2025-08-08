import React from 'react';

type Props = {
  listenOn?: boolean;
  onToggleListen?: () => void;
  onContext?: () => void;
  onAsk?: () => void;
  onOpenNotes?: () => void;
  onOpenLast?: () => void;
  onOpenSettings?: () => void;
};

const HubBar: React.FC<Props> = ({
  listenOn = false,
  onToggleListen,
  onContext,
  onAsk,
  onOpenNotes,
  onOpenLast,
  onOpenSettings,
}) => {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {/* Pill 1 — Actions IA */}
      <div className="glass">
        <div className="glass__content">
          <button
            className="glass__btn"
            aria-pressed={listenOn}
            onClick={onToggleListen}
            title="Listen (toggle)"
          >
            🎤
            <span className="label">Listen</span>
          </button>
          <button className="glass__btn" onClick={onContext} title="Context (capture)">
            🖥️
            <span className="label">Context</span>
          </button>
          <button className="glass__btn" onClick={onAsk} title="Ask">
            ⌨️
            <span className="label">Ask</span>
          </button>
        </div>
      </div>

      {/* Pill 2 — Outils */}
      <div className="glass">
        <div className="glass__content">
          <button className="glass__btn" onClick={onOpenNotes} title="Notes">
            📝
            <span className="label">Notes</span>
          </button>
          <button className="glass__btn" onClick={onOpenLast} title="Last">
            ⏱️
            <span className="label">Last</span>
          </button>
          <button className="glass__btn" onClick={onOpenSettings} title="Settings">
            ⚙️
            <span className="label">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HubBar;
