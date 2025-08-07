import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DropdownPanel from '../DropdownPanel';

// Mock des composants lazy
vi.mock('../LazyComponents', () => ({
  LazyActivityContent: () => <div data-testid="activity-content">Activity Content</div>,
  LazyPersonalizeContent: () => <div data-testid="personalize-content">Personalize Content</div>,
  LazySettingsContent: () => <div data-testid="settings-content">Settings Content</div>,
}));

// Mock des composants enfants
vi.mock('../DropdownPanel/PanelSidebar', () => ({
  default: ({ activeTab, onTabChange }: any) => (
    <div data-testid="panel-sidebar">
      <button onClick={() => onTabChange('activity')}>Activity</button>
      <button onClick={() => onTabChange('prompts')}>Prompts</button>
      <button onClick={() => onTabChange('settings')}>Settings</button>
    </div>
  ),
}));

vi.mock('../DropdownPanel/PanelHeader', () => ({
  default: ({ onToggleTheme }: any) => (
    <div data-testid="panel-header">
      <button onClick={onToggleTheme}>Toggle Theme</button>
    </div>
  ),
}));

describe('DropdownPanel', () => {
  const defaultProps = {
    isExpanded: true,
    activeTab: 'activity' as const,
    isDark: false,
    isProcessing: false,
    extractedText: '',
    shortcutStatus: '',
    onTabChange: vi.fn(),
    onToggleTheme: vi.fn(),
    onCapture: vi.fn(),
  };

  it('renders correctly when expanded', () => {
    render(<DropdownPanel {...defaultProps} />);
    
    expect(screen.getByTestId('panel-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('panel-header')).toBeInTheDocument();
    expect(screen.getByTestId('activity-content')).toBeInTheDocument();
  });

  it('shows activity content when activeTab is activity', () => {
    render(<DropdownPanel {...defaultProps} activeTab="activity" />);
    
    expect(screen.getByTestId('activity-content')).toBeInTheDocument();
    expect(screen.queryByTestId('personalize-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('settings-content')).not.toBeInTheDocument();
  });

  it('shows personalize content when activeTab is prompts', () => {
    render(<DropdownPanel {...defaultProps} activeTab="prompts" />);
    
    expect(screen.getByTestId('personalize-content')).toBeInTheDocument();
    expect(screen.queryByTestId('activity-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('settings-content')).not.toBeInTheDocument();
  });

  it('shows settings content when activeTab is settings', () => {
    render(<DropdownPanel {...defaultProps} activeTab="settings" />);
    
    expect(screen.getByTestId('settings-content')).toBeInTheDocument();
    expect(screen.queryByTestId('activity-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('personalize-content')).not.toBeInTheDocument();
  });

  it('calls onTabChange when tab is clicked', () => {
    const onTabChange = vi.fn();
    render(<DropdownPanel {...defaultProps} onTabChange={onTabChange} />);
    
    fireEvent.click(screen.getByText('Prompts'));
    expect(onTabChange).toHaveBeenCalledWith('prompts');
  });

  it('calls onToggleTheme when theme button is clicked', () => {
    const onToggleTheme = vi.fn();
    render(<DropdownPanel {...defaultProps} onToggleTheme={onToggleTheme} />);
    
    fireEvent.click(screen.getByText('Toggle Theme'));
    expect(onToggleTheme).toHaveBeenCalled();
  });

  it('has correct styles when expanded', () => {
    render(<DropdownPanel {...defaultProps} isExpanded={true} />);
    
    const panel = screen.getByTestId('panel-sidebar').parentElement?.parentElement;
    expect(panel).toHaveStyle({
      height: '600px',
      opacity: '1',
      visibility: 'visible',
      pointerEvents: 'auto'
    });
  });

  it('has correct styles when collapsed', () => {
    render(<DropdownPanel {...defaultProps} isExpanded={false} />);
    
    const panel = screen.getByTestId('panel-sidebar').parentElement?.parentElement;
    expect(panel).toHaveStyle({
      height: '20px',
      opacity: '0',
      visibility: 'hidden',
      pointerEvents: 'none'
    });
  });

  it('displays greeting message', () => {
    render(<DropdownPanel {...defaultProps} />);
    
    expect(screen.getByText('Good afternoon, rémy')).toBeInTheDocument();
  });
});
