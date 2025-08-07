import React from 'react';
import DropdownPanel from '../components/DropdownPanel';

type TabType = 'activity' | 'prompts' | 'settings';

const PanelPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<TabType>('activity');
  const [isDark, setIsDark] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [extractedText, setExtractedText] = React.useState('');
  const [shortcutStatus, setShortcutStatus] = React.useState('');

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleCapture = async () => {
    // Capture functionality will be implemented here
    console.log('Capture from panel');
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: 'white',
        display: 'flex',
        overflow: 'hidden'
      }}
    >
      {/* Sidebar latérale */}
      <div style={{
        width: '250px',
        backgroundColor: '#f8f9fa',
        borderRight: '1px solid #e9ecef',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          marginBottom: '30px',
          padding: '12px 16px',
          backgroundColor: '#6f42c1',
          color: 'white',
          borderRadius: '8px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          Upgrade to Pro
        </div>

        <div style={{ flex: 1 }}>
          <div
            onClick={() => handleTabChange('activity')}
            style={{
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: activeTab === 'activity' ? '#e9ecef' : 'transparent',
              fontWeight: activeTab === 'activity' ? 'bold' : 'normal'
            }}
          >
            📊 My Activity
          </div>
          <div
            onClick={() => handleTabChange('prompts')}
            style={{
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: activeTab === 'prompts' ? '#e9ecef' : 'transparent',
              fontWeight: activeTab === 'prompts' ? 'bold' : 'normal'
            }}
          >
            ⚙️ Personalize
          </div>
          <div
            onClick={() => handleTabChange('settings')}
            style={{
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: activeTab === 'settings' ? '#e9ecef' : 'transparent',
              fontWeight: activeTab === 'settings' ? 'bold' : 'normal'
            }}
          >
            🔧 Settings
          </div>
        </div>

        <div style={{
          padding: '16px',
          borderTop: '1px solid #e9ecef',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#6f42c1',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            R
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>rémy martinet</div>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>remymartinet.dev@g...</div>
          </div>
        </div>
      </div>

      {/* Zone de contenu principale */}
      <div style={{
        flex: 1,
        padding: '30px',
        overflow: 'auto'
      }}>
        <DropdownPanel
          isExpanded={true}
          activeTab={activeTab}
          isDark={isDark}
          isProcessing={isProcessing}
          extractedText={extractedText}
          shortcutStatus={shortcutStatus}
          onTabChange={handleTabChange}
          onToggleTheme={toggleTheme}
          onCapture={handleCapture}
        />
      </div>
    </div>
  );
};

export default PanelPage;
