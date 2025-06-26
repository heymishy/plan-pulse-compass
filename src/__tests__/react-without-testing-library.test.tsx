import React from 'react';
import { describe, it, expect } from 'vitest';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';

describe('React Without Testing Library', () => {
  it('should render a simple div', () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    flushSync(() => {
      root.render(<div>Hello</div>);
    });

    expect(container.textContent).toBe('Hello');

    root.unmount();
  });

  it('should work with basic assertions', () => {
    expect(1 + 1).toBe(2);
  });
});
