/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockFetch = jest.fn();
global.fetch = mockFetch;

import UploadBox from '../UploadBox';

describe('UploadBox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the upload area', () => {
    render(<UploadBox onUpload={jest.fn()} />);
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    expect(screen.getByText(/csv/i)).toBeInTheDocument();
  });

  it('renders the hidden file input', () => {
    render(<UploadBox onUpload={jest.fn()} />);
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('accept', '.csv');
  });

  it('shows error message on failed upload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid CSV format' }),
    });

    const onUpload = jest.fn();
    render(<UploadBox onUpload={onUpload} />);

    const file = new File(['bad,data'], 'test.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Invalid CSV format')).toBeInTheDocument();
    });
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('calls onUpload with transactions on successful upload', async () => {
    const transactions = [{ date: '2024-01-01', description: 'Coffee', amount: -5 }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transactions, fileId: 'f1' }),
    });

    const onUpload = jest.fn();
    render(<UploadBox onUpload={onUpload} />);

    const file = new File(['Date,Description,Amount\n2024-01-01,Coffee,-5'], 'bank.csv', {
      type: 'text/csv',
    });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('bank.csv')).toBeInTheDocument();
    });

    jest.advanceTimersByTime(700);
    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith(transactions, 'f1');
    });
  });

  it('shows error on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<UploadBox onUpload={jest.fn()} />);

    const file = new File(['data'], 'test.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});
