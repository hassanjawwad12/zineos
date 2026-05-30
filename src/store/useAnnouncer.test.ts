import { beforeEach, describe, expect, it } from "vitest";

import { announce, useAnnouncer } from "./useAnnouncer";

describe("useAnnouncer", () => {
  beforeEach(() => useAnnouncer.setState({ message: "", nth: 0 }));

  it("sets the message and increments nth", () => {
    useAnnouncer.getState().announce("Sticker added");
    expect(useAnnouncer.getState().message).toBe("Sticker added");
    expect(useAnnouncer.getState().nth).toBe(1);
  });

  it("re-increments nth even for a repeated identical message", () => {
    announce("Moved to front");
    announce("Moved to front");
    expect(useAnnouncer.getState().message).toBe("Moved to front");
    expect(useAnnouncer.getState().nth).toBe(2);
  });
});
