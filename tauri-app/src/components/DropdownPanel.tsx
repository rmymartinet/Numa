import React from 'react';
import { LazyActivityContent, LazyPersonalizeContent, LazySettingsContent } from './LazyComponents';
import LoadingSpinner from './LoadingSpinner';
import PanelSidebar from './DropdownPanel/PanelSidebar';
import PanelHeader from './DropdownPanel/PanelHeader';
import CaptureTab from './DropdownPanel/CaptureTab';

// Types
type TabType = 'activity' | 'prompts' | 'settings';

interface DropdownPanelProps {
  isExpanded: boolean;
  activeTab: TabType;
  isDark: boolean;
  isProcessing: boolean;
  extractedText: string;
  shortcutStatus: string;
  onTabChange: (tab: TabType) => void;
  onToggleTheme: () => void;
  onCapture: () => void;
}

const DropdownPanel: React.FC<DropdownPanelProps> = ({
  isExpanded,
  activeTab,
  isDark,
  isProcessing,
  extractedText,
  shortcutStatus,
  onTabChange,
  onToggleTheme,
  onCapture
}) => {
  return (
    <div style={{
      width: '100%',
      maxWidth: '600px',
      height: isExpanded ? '500px' : '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      marginTop: '20px',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      pointerEvents: isExpanded ? 'auto' : 'none',
      opacity: isExpanded ? 1 : 0,
      visibility: isExpanded ? 'visible' : 'hidden'
    }}>
      {/* Debug: Toujours rendre le contenu pour voir s'il y a un problème */}
      <div style={{
        display: isExpanded ? 'flex' : 'none',
        width: '100%',
        height: '100%',
        color: 'white'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          color: 'white'
        }}>
          <PanelSidebar 
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
          
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <PanelHeader 
              isDark={isDark}
              onToggleTheme={onToggleTheme}
            />
            
            <div style={{
              flex: 1,
              padding: '24px',
              overflow: 'auto'
            }}>
              {/* Header greeting */}
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  margin: '0 0 8px 0'
                }}>
                  Good afternoon, rémy
                </h2>
              </div>
              
              {/* Content based on active tab */}
              {activeTab === 'activity' && (
                <div style={{ color: 'white' }}>
                  <LazyActivityContent />
                </div>
              )}
              
              {activeTab === 'settings' && (
                <div style={{ color: 'white' }}>
                  <LazySettingsContent />
                </div>
              )}
              
              {activeTab === 'prompts' && (
                <div style={{ color: 'white' }}>
                  <LazyPersonalizeContent />
                </div>
              )}
              
              {/* Capture tab content */}
              {activeTab !== 'activity' && activeTab !== 'prompts' && activeTab !== 'settings' && (
                <CaptureTab 
                  isProcessing={isProcessing}
                  extractedText={extractedText}
                  onCapture={onCapture}
                />
              )}
              
              {/* Status */}
              {shortcutStatus && (
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginTop: '16px'
                }}>
                  <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>
                    Statut: {shortcutStatus}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DropdownPanel;
