/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

import ChatBar from '../ChatBar';

describe('ChatBar', () => {
  it('renders the textarea and submit button', () => {
    render(<ChatBar />);
    expect(screen.getByPlaceholderText(/ask ai about your finances/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('submit button is disabled when input is empty', () => {
    render(<ChatBar />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('submit button is enabled when user types a message', () => {
    render(<ChatBar />);
    const textarea = screen.getByPlaceholderText(/ask ai about your finances/i);
    fireEvent.change(textarea, { target: { value: 'What did I spend on food?' } });
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('navigates to /chats with message on submit', () => {
    const mockPush = jest.fn();
    const { useRouter } = require('next/navigation');
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(<ChatBar />);
    const textarea = screen.getByPlaceholderText(/ask ai about your finances/i);
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.submit(textarea.closest('form')!);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/chats?q=')
    );
  });

  it('clears input after submit', () => {
    render(<ChatBar />);
    const textarea = screen.getByPlaceholderText(/ask ai about your finances/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.submit(textarea.closest('form')!);
    expect(textarea.value).toBe('');
  });

  it('does not submit when input is only whitespace', () => {
    const mockPush = jest.fn();
    const { useRouter } = require('next/navigation');
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(<ChatBar />);
    const textarea = screen.getByPlaceholderText(/ask ai about your finances/i);
    fireEvent.change(textarea, { target: { value: '   ' } });
    fireEvent.submit(textarea.closest('form')!);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
