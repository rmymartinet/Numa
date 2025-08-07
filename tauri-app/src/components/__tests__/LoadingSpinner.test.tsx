import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(<LoadingSpinner text='Chargement...' />);
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<LoadingSpinner variant='spinner' />);
    expect(screen.getByRole('generic')).toBeInTheDocument();

    rerender(<LoadingSpinner variant='dots' />);
    expect(screen.getByRole('generic')).toBeInTheDocument();

    rerender(<LoadingSpinner variant='pulse' />);
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size='sm' />);
    expect(screen.getByRole('generic')).toBeInTheDocument();

    rerender(<LoadingSpinner size='md' />);
    expect(screen.getByRole('generic')).toBeInTheDocument();

    rerender(<LoadingSpinner size='lg' />);
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  it('renders with different colors', () => {
    const { rerender } = render(<LoadingSpinner color='blue' />);
    expect(screen.getByRole('generic')).toBeInTheDocument();

    rerender(<LoadingSpinner color='gray' />);
    expect(screen.getByRole('generic')).toBeInTheDocument();

    rerender(<LoadingSpinner color='white' />);
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });
});
