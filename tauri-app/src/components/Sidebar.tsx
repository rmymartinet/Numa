import React from 'react';

interface SidebarProps {
  activeTab: 'activity' | 'prompts' | 'settings';
  onTabChange: (tab: 'activity' | 'prompts' | 'settings') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const tabs: Array<{
    id: 'activity' | 'prompts' | 'settings';
    icon: string;
    label: string;
  }> = [
    { id: 'activity', icon: '📈', label: 'My Activity' },
    { id: 'prompts', icon: '📖', label: 'Personalize' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen transition-colors duration-200">
      {/* Upgrade button - fixé en haut */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200">
          Upgrade to Pro
        </button>
      </div>
      
      {/* Navigation tabs */}
      <div className="flex-1 p-4">
        <div className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              aria-label={`Onglet ${tab.label}`}
              aria-pressed={activeTab === tab.id}
              role="tab"
            >
              <span className="text-base" aria-hidden="true">{tab.icon}</span>
              <span className="font-medium text-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* User profile - fixé en bas, plus compact */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-300 font-medium text-xs">R</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-900 dark:text-white font-medium text-xs truncate">rémy martinet</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs truncate">remymartinet.dev@g...</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 