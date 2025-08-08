import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HUDBar from '../HUDBar';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('HUDBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    isListening: false,
    inputText: '',
    isPanelExpanded: false,
    onCapture: vi.fn(),
    onInputChange: vi.fn(),
    onTogglePanel: vi.fn(),
    onClose: vi.fn(),
  };

  it('should render HUD bar with all components', () => {
    render(<HUDBar {...defaultProps} />);
    
    // Check that the main container is rendered
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should handle capture button click', () => {
    const onCapture = vi.fn();
    render(<HUDBar {...defaultProps} onCapture={onCapture} />);
    
    const captureButton = screen.getByRole('button', { name: /capture/i });
    fireEvent.click(captureButton);
    
    expect(onCapture).toHaveBeenCalled();
  });

  it('should handle input change', () => {
    const onInputChange = vi.fn();
    render(<HUDBar {...defaultProps} onInputChange={onInputChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test input' } });
    
    expect(onInputChange).toHaveBeenCalledWith('test input');
  });

  it('should handle panel toggle', () => {
    const onTogglePanel = vi.fn();
    render(<HUDBar {...defaultProps} onTogglePanel={onTogglePanel} />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle panel/i });
    fireEvent.click(toggleButton);
    
    expect(onTogglePanel).toHaveBeenCalled();
  });

  it('should handle close button click', () => {
    const onClose = vi.fn();
    render(<HUDBar {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should show listening state', () => {
    render(<HUDBar {...defaultProps} isListening={true} />);
    
    const captureButton = screen.getByRole('button', { name: /capture/i });
    expect(captureButton).toHaveClass('listening');
  });

  it('should show panel expanded state', () => {
    render(<HUDBar {...defaultProps} isPanelExpanded={true} />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle panel/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('should display input text', () => {
    render(<HUDBar {...defaultProps} inputText="test text" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test text');
  });
});
