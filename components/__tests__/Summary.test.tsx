/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import Summary from '../Summary';

const mockTransactions = [
  { date: '2024-01-01', description: 'Salary', amount: 3000 },
  { date: '2024-01-02', description: 'Coffee', amount: -5.5 },
  { date: '2024-01-03', description: 'Grocery', amount: -85.2 },
];

describe('Summary', () => {
  it('renders nothing when transactions are empty', () => {
    const { container } = render(<Summary transactions={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all three summary cards', () => {
    render(<Summary transactions={mockTransactions} />);
    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    expect(screen.getByText('Net Balance')).toBeInTheDocument();
  });

  it('displays correct income value', () => {
    render(<Summary transactions={mockTransactions} />);
    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
  });

  it('displays correct expense value', () => {
    render(<Summary transactions={mockTransactions} />);
    expect(screen.getByText('$90.70')).toBeInTheDocument();
  });

  it('shows positive net balance with + prefix', () => {
    render(<Summary transactions={mockTransactions} />);
    expect(screen.getByText(/^\+/)).toBeInTheDocument();
  });

  it('shows negative net balance with - prefix', () => {
    const expenseOnly = [
      { date: '2024-01-01', description: 'Rent', amount: -1200 },
    ];
    render(<Summary transactions={expenseOnly} />);
    expect(screen.getByText(/^-/)).toBeInTheDocument();
  });
});
