import React from 'react';
import SettingsTab from './SettingsTab';

const SettingsContent: React.FC = () => {
  const [activeSettingsTab, setActiveSettingsTab] = React.useState<
    'settings' | 'app' | 'profile' | 'security' | 'billing'
  >('settings');

  const settingsTabs = [
    { id: 'settings' as const, label: 'General Settings', icon: '⚙️' },
    { id: 'app' as const, label: 'App Settings', icon: '📱' },
    { id: 'profile' as const, label: 'Profile Settings', icon: '👤' },
    { id: 'security' as const, label: 'Security Settings', icon: '🔒' },
    { id: 'billing' as const, label: 'Billing & Subscription', icon: '💳' },
  ];

  const renderTabContent = () => {
    switch (activeSettingsTab) {
      case 'settings':
        return (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              General Settings
            </h3>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-700 dark:text-gray-300'>
                  Auto-save preferences
                </span>
                <input type='checkbox' className='rounded' defaultChecked />
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-700 dark:text-gray-300'>
                  Notifications
                </span>
                <input type='checkbox' className='rounded' defaultChecked />
              </div>
            </div>
          </div>
        );
      case 'app':
        return (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              App Settings
            </h3>
            <div className='space-y-3'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Language
                </label>
                <select className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white'>
                  <option value='en'>English</option>
                  <option value='fr'>Français</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Profile Settings
            </h3>
            <div className='space-y-3'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Name
                </label>
                <input
                  type='text'
                  className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  defaultValue='rémy martinet'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Email
                </label>
                <input
                  type='email'
                  className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  defaultValue='remymartinet.dev@gmail.com'
                />
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Security Settings
            </h3>
            <div className='space-y-3'>
              <button className='bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-all duration-200'>
                Change Password
              </button>
              <button className='bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition-all duration-200'>
                Enable 2FA
              </button>
            </div>
          </div>
        );
      case 'billing':
        return (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Billing & Subscription
            </h3>
            <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
              <h4 className='font-medium text-blue-900 dark:text-blue-100'>
                Free Plan
              </h4>
              <p className='text-sm text-blue-700 dark:text-blue-300 mt-1'>
                Upgrade to Pro for unlimited features
              </p>
              <button className='mt-3 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-all duration-200'>
                Upgrade to Pro
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className='space-y-4'>
      {/* Settings Tabs */}
      <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4'>
        <div className='flex space-x-2 mb-4'>
          {settingsTabs.map(tab => (
            <SettingsTab
              key={tab.id}
              id={tab.id}
              label={tab.label}
              icon={tab.icon}
              isActive={activeSettingsTab === tab.id}
              onClick={() => setActiveSettingsTab(tab.id)}
            />
          ))}
        </div>

        {/* Tab Content */}
        <div className='pt-4 border-t border-gray-200 dark:border-gray-700'>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsContent;
