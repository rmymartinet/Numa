import React from 'react';

// Types
type TabType = 'activity' | 'prompts' | 'settings';

interface PanelSidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const PanelSidebar: React.FC<PanelSidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    { id: 'activity', icon: '📈', label: 'My Activity' },
    { id: 'prompts', icon: '📖', label: 'Personalize' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div
      style={{
        width: '288px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Upgrade button */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <button
          style={{
            width: '100%',
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          Upgrade to Pro
        </button>
      </div>

      {/* Navigation tabs */}
      <div style={{ flex: 1, padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as TabType)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor:
                  activeTab === tab.id
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'transparent',
                color:
                  activeTab === tab.id ? 'white' : 'rgba(255, 255, 255, 0.8)',
              }}
            >
              <span style={{ fontSize: '16px' }}>{tab.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* User profile */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            R
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>
              Rémy Martinet
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Free Plan</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PanelSidebar;
