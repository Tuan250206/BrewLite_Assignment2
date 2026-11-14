import { jest } from '@jest/globals';
import { getJwtSecret } from './auth.config';

describe('JWT secret configuration', () => {
  beforeEach(() => jest.replaceProperty(process, 'env', {}));
  afterEach(() => jest.restoreAllMocks());

  it.each([undefined, '', 'short'])(
    'rejects missing or weak secret %s',
    (value) => {
      if (value !== undefined) process.env.JWT_SECRET = value;
      expect(() => getJwtSecret()).toThrow('JWT_SECRET');
    },
  );

  it('uses the configured secret', () => {
    process.env.JWT_SECRET = 'a'.repeat(32);
    expect(getJwtSecret()).toBe('a'.repeat(32));
  });
});