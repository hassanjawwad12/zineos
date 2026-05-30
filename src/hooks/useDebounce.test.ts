import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("a", 300));
    expect(result.current).toBe("a");
  });

  it("delays updates until the value settles", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "a" } },
    );

    rerender({ value: "ab" });
    rerender({ value: "abc" });
    expect(result.current).toBe("a"); // not yet elapsed

    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("abc"); // only the final value lands
  });

  it("resets the timer on each change", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "x" } },
    );

    rerender({ value: "xy" });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: "xyz" });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe("x"); // timer kept resetting

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe("xyz");
  });
});
