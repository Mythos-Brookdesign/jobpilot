import { act, renderHook } from '@testing-library/react-native';

import { useLiveRows } from '@/db/use-live-rows';

type ChangeListener = (event: { tableName: string }) => void;
const mockListeners = new Set<ChangeListener>();

jest.mock('expo-sqlite', () => ({
  addDatabaseChangeListener: (listener: ChangeListener) => {
    mockListeners.add(listener);
    return { remove: () => mockListeners.delete(listener) };
  },
}));

function emit(tableName: string, times = 1) {
  for (let i = 0; i < times; i++) mockListeners.forEach((listener) => listener({ tableName }));
}

beforeEach(() => {
  jest.useFakeTimers();
  mockListeners.clear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useLiveRows', () => {
  it('liest sofort beim ersten Rendern', async () => {
    const read = jest.fn(() => ['a']);
    const { result } = await renderHook(() => useLiveRows(read, ['applications']));

    expect(result.current).toEqual(['a']);
  });

  it('liest nach vielen Änderungen nur einmal neu', async () => {
    let rows = ['a'];
    const read = jest.fn(() => rows);
    const { result } = await renderHook(() => useLiveRows(read, ['applications']));
    const readsAfterMount = read.mock.calls.length;

    rows = ['a', 'b'];
    emit('applications', 25);
    await act(() => jest.runAllTimers());

    expect(read.mock.calls.length - readsAfterMount).toBe(1);
    expect(result.current).toEqual(['a', 'b']);
  });

  it('ignoriert Änderungen an anderen Tabellen', async () => {
    const read = jest.fn(() => ['a']);
    await renderHook(() => useLiveRows(read, ['applications']));
    const readsAfterMount = read.mock.calls.length;

    emit('status_events', 5);
    await act(() => jest.runAllTimers());

    expect(read.mock.calls.length).toBe(readsAfterMount);
  });

  it('meldet sich beim Unmount ab', async () => {
    const { unmount } = await renderHook(() => useLiveRows(() => [], ['applications']));
    expect(mockListeners.size).toBe(1);

    await unmount();
    expect(mockListeners.size).toBe(0);
  });
});
