import React from 'react';

export function HubBar() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {/* Actions IA */}
      <div className="glass">
        <div className="glass__content">
          <button className="glass__btn is-on">
            🎤<span>Listen</span>
          </button>
          <button className="glass__btn">
            🖥️<span>Context</span>
          </button>
          <button className="glass__btn">
            ⌨️<span>Ask</span>
          </button>
        </div>
      </div>

      {/* Outils */}
      <div className="glass">
        <div className="glass__content">
          <button className="glass__btn">
            📝<span>Notes</span>
          </button>
          <button className="glass__btn">
            ⏱️<span>Last</span>
          </button>
          <button className="glass__btn">
            ⚙️<span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
