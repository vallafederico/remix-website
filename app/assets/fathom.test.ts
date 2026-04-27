import * as assert from "remix/assert";
import { afterEach, describe, it } from "remix/test";
import { initFathomAnalytics } from "./fathom";

let originalWindow = globalThis.window;

afterEach(() => {
  globalThis.window = originalWindow;
});

describe("initFathomAnalytics", () => {
  it("does not load Fathom in development", (t) => {
    let loadImpl = t.mock.fn();
    globalThis.window = {} as Window & typeof globalThis;

    initFathomAnalytics({ isDevelopment: true, loadImpl });

    assert.equal(loadImpl.mock.calls.length, 0);
  });

  it("loads Fathom once outside development", (t) => {
    let loadImpl = t.mock.fn();
    globalThis.window = {} as Window & typeof globalThis;

    initFathomAnalytics({ isDevelopment: false, loadImpl });
    initFathomAnalytics({ isDevelopment: false, loadImpl });

    assert.equal(loadImpl.mock.calls.length, 1);
    assert.deepEqual(loadImpl.mock.calls[0]?.arguments, [
      "IRVDGCHK",
      {
        url: "https://cdn.usefathom.com/script.js",
        spa: "history",
        excludedDomains: ["localhost"],
      },
    ]);
  });
});
