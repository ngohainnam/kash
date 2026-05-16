/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('recharts', () => {
  const actual = jest.requireActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 400 }}>{children}</div>
    ),
    PieChart: ({ children }: { children: React.ReactNode }) => <svg>{children}</svg>,
    Pie: () => null,
    Cell: () => null,
    Tooltip: () => null,
    Legend: () => null,
  };
});

import SpendingPieChart from '../charts/SpendingPieChart';

const mockData = [
  { name: 'Food', value: 350 },
  { name: 'Transport', value: 120 },
  { name: 'Entertainment', value: 80 },
  { name: 'Other', value: 150 },
];

describe('SpendingPieChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<SpendingPieChart data={mockData} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with empty data', () => {
    const { container } = render(<SpendingPieChart data={[]} />);
    expect(container.firstChild).toBeTruthy();
  });
});
