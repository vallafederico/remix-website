import * as assert from "remix/assert";
import { describe, it } from "remix/test";
import { submitNewsletterRequest } from "./newsletter-subscribe";

describe("submitNewsletterRequest", () => {
  it("returns idle state when the request is aborted", async (t) => {
    let controller = new AbortController();
    controller.abort();

    let fetchImpl = t.mock.fn<typeof fetch>(() => {
      return Promise.reject(new DOMException("Aborted", "AbortError"));
    });

    let formData = new FormData();
    formData.set("email", "hello@example.com");

    let result = await submitNewsletterRequest({
      action: "/_actions/newsletter",
      formData,
      signal: controller.signal,
      fetchImpl,
    });

    assert.deepEqual(result, {
      state: "idle",
      error: null,
      shouldReset: false,
    });
  });

  it("returns error state for non-abort failures", async (t) => {
    let fetchImpl = t.mock.fn<typeof fetch>(() => {
      return Promise.reject(new Error("network down"));
    });

    let formData = new FormData();
    formData.set("email", "hello@example.com");

    let result = await submitNewsletterRequest({
      action: "/_actions/newsletter",
      formData,
      signal: new AbortController().signal,
      fetchImpl,
    });

    assert.deepEqual(result, {
      state: "error",
      error: "Something went wrong",
      shouldReset: false,
    });
  });
});
