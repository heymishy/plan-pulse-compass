import React from 'react';
import { describe, it, expect } from 'vitest';

describe('Minimal React', () => {
  it('should work with basic React', () => {
    const element = React.createElement(
      'div',
      { className: 'test' },
      'Hello World'
    );
    expect(element.type).toBe('div');
    expect(element.props.className).toBe('test');
    expect(element.props.children).toBe('Hello World');
  });

  it('should handle JSX', () => {
    const jsxElement = <div className="test">Hello World</div>;
    expect(jsxElement.type).toBe('div');
    expect(jsxElement.props.className).toBe('test');
    expect(jsxElement.props.children).toBe('Hello World');
  });
});
