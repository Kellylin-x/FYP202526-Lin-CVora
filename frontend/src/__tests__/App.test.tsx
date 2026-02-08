import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  it('should render without crashing', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeDefined();
  });

  it('should render the application', () => {
    const { container } = render(<App />);
    expect(container.firstChild).toBeDefined();
  });
});
