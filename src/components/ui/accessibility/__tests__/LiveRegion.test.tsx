import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LiveRegion, Status, Alert, useTemporaryAnnouncement } from '../LiveRegion';

describe('LiveRegion', () => {
  it('should render with default aria-live="polite"', () => {
    render(
      <LiveRegion>
        <span>Test content</span>
      </LiveRegion>
    );

    const liveRegion = screen.getByText('Test content').parentElement;
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    expect(liveRegion).toHaveAttribute('aria-relevant', 'all');
    expect(liveRegion).toHaveClass('sr-only');
  });

  it('should use assertive priority when specified', () => {
    render(
      <LiveRegion priority="assertive">
        <span>Urgent content</span>
      </LiveRegion>
    );

    const liveRegion = screen.getByText('Urgent content').parentElement;
    expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
  });

  it('should use off priority when specified', () => {
    render(
      <LiveRegion priority="off">
        <span>Silent content</span>
      </LiveRegion>
    );

    const liveRegion = screen.getByText('Silent content').parentElement;
    expect(liveRegion).toHaveAttribute('aria-live', 'off');
  });

  it('should set atomic to false when specified', () => {
    render(
      <LiveRegion atomic={false}>
        <span>Non-atomic content</span>
      </LiveRegion>
    );

    const liveRegion = screen.getByText('Non-atomic content').parentElement;
    expect(liveRegion).toHaveAttribute('aria-atomic', 'false');
  });

  it('should set custom aria-relevant', () => {
    render(
      <LiveRegion relevant="additions">
        <span>Addition content</span>
      </LiveRegion>
    );

    const liveRegion = screen.getByText('Addition content').parentElement;
    expect(liveRegion).toHaveAttribute('aria-relevant', 'additions');
  });

  it('should apply custom className', () => {
    render(
      <LiveRegion className="custom-live-region">
        <span>Styled content</span>
      </LiveRegion>
    );

    const liveRegion = screen.getByText('Styled content').parentElement;
    expect(liveRegion).toHaveClass('sr-only', 'custom-live-region');
  });

  it('should set custom id', () => {
    render(
      <LiveRegion id="custom-live-region">
        <span>Content with ID</span>
      </LiveRegion>
    );

    const liveRegion = screen.getByText('Content with ID').parentElement;
    expect(liveRegion).toHaveAttribute('id', 'custom-live-region');
  });
});

describe('Status', () => {
  it('should render as polite live region with status role', () => {
    render(
      <Status>
        <span>Status message</span>
      </Status>
    );

    const statusRegion = screen.getByText('Status message').parentElement;
    expect(statusRegion).toHaveAttribute('aria-live', 'polite');
    expect(statusRegion).toHaveAttribute('role', 'status');
    expect(statusRegion).toHaveClass('sr-only');
  });

  it('should apply custom className', () => {
    render(
      <Status className="custom-status">
        <span>Status with class</span>
      </Status>
    );

    const statusRegion = screen.getByText('Status with class').parentElement;
    expect(statusRegion).toHaveClass('sr-only', 'custom-status');
  });
});

describe('Alert', () => {
  it('should render as assertive live region with alert role', () => {
    render(
      <Alert>
        <span>Alert message</span>
      </Alert>
    );

    const alertRegion = screen.getByText('Alert message').parentElement;
    expect(alertRegion).toHaveAttribute('aria-live', 'assertive');
    expect(alertRegion).toHaveAttribute('role', 'alert');
    expect(alertRegion).toHaveClass('sr-only');
  });

  it('should apply custom className', () => {
    render(
      <Alert className="custom-alert">
        <span>Alert with class</span>
      </Alert>
    );

    const alertRegion = screen.getByText('Alert with class').parentElement;
    expect(alertRegion).toHaveClass('sr-only', 'custom-alert');
  });
});

describe('useTemporaryAnnouncement', () => {
  function TestUseTemporaryAnnouncement() {
    const { announcement, announce, clearAnnouncement } = useTemporaryAnnouncement();

    return (
      <div>
        <div data-testid="announcement">{announcement}</div>
        <button onClick={() => announce('Test message')}>Announce</button>
        <button onClick={() => announce('Custom duration', 1000)}>
          Announce Custom Duration
        </button>
        <button onClick={clearAnnouncement}>Clear</button>
      </div>
    );
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initially have empty announcement', () => {
    render(<TestUseTemporaryAnnouncement />);

    expect(screen.getByTestId('announcement')).toHaveTextContent('');
  });

  it('should set announcement when announce is called', () => {
    render(<TestUseTemporaryAnnouncement />);

    act(() => {
      screen.getByText('Announce').click();
    });

    expect(screen.getByTestId('announcement')).toHaveTextContent('Test message');
  });

  it('should clear announcement after default duration', () => {
    render(<TestUseTemporaryAnnouncement />);

    act(() => {
      screen.getByText('Announce').click();
    });

    expect(screen.getByTestId('announcement')).toHaveTextContent('Test message');

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId('announcement')).toHaveTextContent('');
  });

  it('should clear announcement after custom duration', () => {
    render(<TestUseTemporaryAnnouncement />);

    act(() => {
      screen.getByText('Announce Custom Duration').click();
    });

    expect(screen.getByTestId('announcement')).toHaveTextContent('Custom duration');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId('announcement')).toHaveTextContent('');
  });

  it('should immediately clear announcement when clearAnnouncement is called', () => {
    render(<TestUseTemporaryAnnouncement />);

    act(() => {
      screen.getByText('Announce').click();
    });

    expect(screen.getByTestId('announcement')).toHaveTextContent('Test message');

    act(() => {
      screen.getByText('Clear').click();
    });

    expect(screen.getByTestId('announcement')).toHaveTextContent('');
  });

  it('should handle multiple announcements and use the latest', () => {
    render(<TestUseTemporaryAnnouncement />);

    act(() => {
      screen.getByText('Announce').click();
    });

    expect(screen.getByTestId('announcement')).toHaveTextContent('Test message');

    act(() => {
      screen.getByText('Announce Custom Duration').click();
    });

    expect(screen.getByTestId('announcement')).toHaveTextContent('Custom duration');

    // First timeout should be cleared, only the second one should clear the message
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId('announcement')).toHaveTextContent('Custom duration');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId('announcement')).toHaveTextContent('');
  });
});