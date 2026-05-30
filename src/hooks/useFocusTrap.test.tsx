import { describe, expect, it } from "vitest";
import { useRef } from "react";
import { fireEvent, render } from "@testing-library/react";

import { useFocusTrap } from "./useFocusTrap";

function Trapped({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, active);
  return (
    <div ref={ref}>
      <button type="button">first</button>
      <button type="button">middle</button>
      <button type="button">last</button>
    </div>
  );
}

describe("useFocusTrap", () => {
  it("focuses the first focusable when activated", () => {
    const { getByText } = render(<Trapped active />);
    expect(document.activeElement).toBe(getByText("first"));
  });

  it("wraps focus from last to first on Tab", () => {
    const { getByText } = render(<Trapped active />);
    const last = getByText("last");
    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    expect(document.activeElement).toBe(getByText("first"));
  });

  it("wraps focus from first to last on Shift+Tab", () => {
    const { getByText } = render(<Trapped active />);
    const first = getByText("first");
    first.focus();
    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(getByText("last"));
  });

  it("does nothing when inactive", () => {
    render(
      <>
        <button type="button">outside</button>
        <Trapped active={false} />
      </>,
    );
    // No element was force-focused by the trap.
    expect(document.activeElement).not.toBe(null);
  });
});
