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
    BarChart: ({ children }: { children: React.ReactNode }) => <svg>{children}</svg>,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
  };
});

import MonthlyBarChart from '../charts/MonthlyBarChart';

const mockData = [
  { month: 'Jan 2024', income: 3000, expense: 500 },
  { month: 'Feb 2024', income: 3000, expense: 800 },
  { month: 'Mar 2024', income: 3500, expense: 600 },
];

describe('MonthlyBarChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<MonthlyBarChart data={mockData} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with empty data', () => {
    const { container } = render(<MonthlyBarChart data={[]} />);
    expect(container.firstChild).toBeTruthy();
  });
});
