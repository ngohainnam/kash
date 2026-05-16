import { cn } from '../utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4');
  });

  it('resolves conflicting Tailwind classes (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('ignores falsy values', () => {
    expect(cn('px-2', undefined, null as unknown as string, false as unknown as string, 'py-4')).toBe('px-2 py-4');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    expect(cn('base', isActive && 'active')).toBe('base active');
    expect(cn('base', !isActive && 'inactive')).toBe('base');
  });

  it('returns empty string when no valid classes provided', () => {
    expect(cn()).toBe('');
    expect(cn(undefined, false as unknown as string)).toBe('');
  });
});
