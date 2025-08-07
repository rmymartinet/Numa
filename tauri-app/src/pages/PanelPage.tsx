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
    console.log('Capture from panel page');
  };

  return (
     
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
  );
};

export default PanelPage;
