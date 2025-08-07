import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWithRetry, NetworkErrorType } from '../api';

// Mock fetch
(window as any).fetch = vi.fn();

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return data on successful request', async () => {
    const mockResponse = { data: 'test' };
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await fetchWithRetry('https://api.test.com', {
      method: 'GET',
    });

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on network error', async () => {
    const mockResponse = { data: 'test' };

    // First call fails, second succeeds
    (fetch as any)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

    const result = await fetchWithRetry(
      'https://api.test.com',
      {
        method: 'GET',
      },
      { maxRetries: 1 }
    );

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'));

    await expect(
      fetchWithRetry(
        'https://api.test.com',
        {
          method: 'GET',
        },
        { maxRetries: 2 }
      )
    ).rejects.toThrow('Network error');

    expect(fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should handle rate limit errors', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    });

    await expect(
      fetchWithRetry(
        'https://api.test.com',
        {
          method: 'GET',
        },
        { maxRetries: 1 }
      )
    ).rejects.toThrow();

    expect(fetch).toHaveBeenCalledTimes(2); // Initial + 1 retry with longer delay
  });

  it('should handle server errors', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(
      fetchWithRetry(
        'https://api.test.com',
        {
          method: 'GET',
        },
        { maxRetries: 1 }
      )
    ).rejects.toThrow();

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('NetworkErrorType', () => {
  it('should have correct error types', () => {
    expect(NetworkErrorType.TIMEOUT).toBe('TIMEOUT');
    expect(NetworkErrorType.RATE_LIMIT).toBe('RATE_LIMIT');
    expect(NetworkErrorType.SERVER_ERROR).toBe('SERVER_ERROR');
    expect(NetworkErrorType.NETWORK_ERROR).toBe('NETWORK_ERROR');
  });
});
