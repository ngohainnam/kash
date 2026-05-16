import { categorizeTransaction, categorizeTransactions } from '../categorize';

describe('categorizeTransaction', () => {
  // Income: positive amount overrides everything
  it('returns Income for any positive amount', () => {
    expect(categorizeTransaction('McDonald\'s', 50)).toBe('Income');
    expect(categorizeTransaction('random deposit', 1000)).toBe('Income');
  });

  // Hard overrides
  it('returns Income for refund (negative amount)', () => {
    expect(categorizeTransaction('REFUND - order 123', -10)).toBe('Income');
  });

  it('returns Shopping for apple store (negative amount)', () => {
    expect(categorizeTransaction('Apple Store Sydney', -199)).toBe('Shopping');
  });

  it('returns Entertainment for app store / itunes', () => {
    expect(categorizeTransaction('App Store', -4.99)).toBe('Entertainment');
    expect(categorizeTransaction('iTunes purchase', -14.99)).toBe('Entertainment');
  });

  // Rule-based matches
  it('categorizes food vendors', () => {
    expect(categorizeTransaction('McDonald\'s George St', -12)).toBe('Food');
    expect(categorizeTransaction('Coles Supermarket', -85)).toBe('Food');
    expect(categorizeTransaction('UberEats delivery', -25)).toBe('Food');
  });

  it('categorizes transport', () => {
    expect(categorizeTransaction('Uber trip', -18)).toBe('Transport');
    expect(categorizeTransaction('Myki top-up', -20)).toBe('Transport');
    expect(categorizeTransaction('Petrol Shell', -60)).toBe('Transport');
  });

  it('categorizes bills', () => {
    expect(categorizeTransaction('Electricity bill AGL', -150)).toBe('Bills');
    expect(categorizeTransaction('Rent payment', -1200)).toBe('Bills');
    expect(categorizeTransaction('Mobile plan Optus', -49)).toBe('Bills');
  });

  it('categorizes entertainment', () => {
    expect(categorizeTransaction('Netflix subscription', -17.99)).toBe('Entertainment');
    expect(categorizeTransaction('Spotify premium', -11.99)).toBe('Entertainment');
    expect(categorizeTransaction('Steam purchase', -29.99)).toBe('Entertainment');
  });

  it('categorizes shopping', () => {
    expect(categorizeTransaction('Amazon AU', -45)).toBe('Shopping');
    expect(categorizeTransaction('IKEA Richmond', -299)).toBe('Shopping');
  });

  it('categorizes health', () => {
    expect(categorizeTransaction('Pharmacy Direct', -35)).toBe('Health');
    expect(categorizeTransaction('Gym membership', -60)).toBe('Health');
  });

  it('categorizes education', () => {
    expect(categorizeTransaction('Course fee Udemy', -19.99)).toBe('Education');
    expect(categorizeTransaction('Tuition payment', -500)).toBe('Education');
  });

  it('returns Other for unrecognised descriptions', () => {
    expect(categorizeTransaction('XYZABC unknown merchant', -50)).toBe('Other');
    expect(categorizeTransaction('', -10)).toBe('Other');
  });
});

describe('categorizeTransactions', () => {
  it('categorizes an array of transactions and preserves all original fields', () => {
    const input = [
      { id: 1, description: 'Salary deposit', amount: 3000 },
      { id: 2, description: 'Netflix subscription', amount: -17.99 },
      { id: 3, description: 'XYZABC unknown', amount: -5 },
    ];

    const result = categorizeTransactions(input);

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ id: 1, category: 'Income' });
    expect(result[1]).toMatchObject({ id: 2, category: 'Entertainment' });
    expect(result[2]).toMatchObject({ id: 3, category: 'Other' });
  });

  it('returns empty array for empty input', () => {
    expect(categorizeTransactions([])).toEqual([]);
  });
});
