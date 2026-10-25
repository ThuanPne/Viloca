import { loadIconFontWithRetry } from '../src/lib/icon-font';

// A sleep stub that records the delays it was asked for instead of waiting.
function recordingSleep() {
  const delays: number[] = [];
  return {
    delays,
    sleep: (ms: number) => {
      delays.push(ms);
      return Promise.resolve();
    },
  };
}

describe('loadIconFontWithRetry', () => {
  it('loads on the first attempt and does not retry', async () => {
    const load = jest.fn().mockResolvedValue(undefined);

    await expect(loadIconFontWithRetry(load)).resolves.toBe(true);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('retries after a failure and reports success', async () => {
    const load = jest
      .fn()
      .mockRejectedValueOnce(new Error('purged'))
      .mockRejectedValueOnce(new Error('purged'))
      .mockResolvedValue(undefined);
    const { sleep } = recordingSleep();

    await expect(loadIconFontWithRetry(load, { sleep })).resolves.toBe(true);
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('gives up after the attempt budget and resolves false instead of throwing', async () => {
    const load = jest.fn().mockRejectedValue(new Error('Unable to download asset'));
    const { sleep } = recordingSleep();

    await expect(
      loadIconFontWithRetry(load, { attempts: 3, sleep })
    ).resolves.toBe(false);
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('never exceeds the attempt budget — this is what stops the retry storm', async () => {
    const load = jest.fn().mockRejectedValue(new Error('purged'));
    const { sleep } = recordingSleep();

    await loadIconFontWithRetry(load, { attempts: 5, sleep });

    expect(load).toHaveBeenCalledTimes(5);
  });

  it('backs off exponentially and does not sleep after the final attempt', async () => {
    const load = jest.fn().mockRejectedValue(new Error('purged'));
    const { delays, sleep } = recordingSleep();

    await loadIconFontWithRetry(load, { attempts: 4, delayMs: 100, sleep });

    expect(delays).toEqual([100, 200, 400]);
  });

  it('reports every failure with a 1-based attempt number', async () => {
    const load = jest.fn().mockRejectedValue(new Error('boom'));
    const onError = jest.fn();
    const { sleep } = recordingSleep();

    await loadIconFontWithRetry(load, { attempts: 3, sleep, onError });

    expect(onError).toHaveBeenCalledTimes(3);
    expect(onError.mock.calls.map((c) => c[1])).toEqual([1, 2, 3]);
  });

  it('treats a sub-1 attempt budget as a single attempt', async () => {
    const load = jest.fn().mockRejectedValue(new Error('purged'));
    const { sleep } = recordingSleep();

    await expect(
      loadIconFontWithRetry(load, { attempts: 0, sleep })
    ).resolves.toBe(false);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
