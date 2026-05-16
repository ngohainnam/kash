/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockFetch = jest.fn();
global.fetch = mockFetch;

import TransactionTable from '../TransactionTable';

const mockTransactions = [
  { date: '2024-01-01', description: 'Salary', amount: 3000 },
  { date: '2024-01-02', description: 'Coffee at Starbucks', amount: -5.5 },
  { date: '2024-01-03', description: 'Grocery Store', amount: -85.2 },
];

describe('TransactionTable', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders all transactions', () => {
    render(<TransactionTable transactions={mockTransactions} />);
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Coffee at Starbucks')).toBeInTheDocument();
    expect(screen.getByText('Grocery Store')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(<TransactionTable transactions={mockTransactions} />);
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('formats positive amounts in green/positive style', () => {
    render(<TransactionTable transactions={[{ date: '2024-01-01', description: 'Salary', amount: 3000 }]} />);
    expect(screen.getByText(/3,000/)).toBeInTheDocument();
  });

  it('formats negative amounts correctly', () => {
    render(<TransactionTable transactions={[{ date: '2024-01-02', description: 'Coffee', amount: -5.5 }]} />);
    expect(screen.getByText(/-5.50|-\$5.50|-5\.50/)).toBeInTheDocument();
  });

  it('fetches notes for a given fileId on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([{ id: 'n1', transactionIndex: 1, note: 'Treat yourself' }]),
    });

    render(<TransactionTable transactions={mockTransactions} fileId="f1" />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/notes?fileId=f1');
    });
  });

  it('does not fetch notes when fileId is not provided', async () => {
    render(<TransactionTable transactions={mockTransactions} />);
    // Wait a tick
    await new Promise(r => setTimeout(r, 50));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('renders nothing when transactions array is empty', () => {
    const { container } = render(<TransactionTable transactions={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
