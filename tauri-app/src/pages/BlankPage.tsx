import React from 'react';
import DropdownPanel from '../components/DropdownPanel';

type TabType = 'activity' | 'prompts' | 'settings';

const BlankPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<TabType>('activity');
  const [isDark, setIsDark] = React.useState(false);
  const [isProcessing] = React.useState(false);
  const [extractedText] = React.useState('');
  const [shortcutStatus] = React.useState('');

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
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: 'transparent',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingTop: '20px'
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
  );
};

export default BlankPage;
