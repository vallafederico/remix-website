import * as assert from "remix/assert";
import { describe, it } from "remix/test";
import type { Router } from "remix/fetch-router";
import { followFrameRedirects } from "./render";

describe("followFrameRedirects", () => {
  it("follows internal redirects until a non-redirect response is reached", async (t) => {
    let responses = [
      new Response(null, {
        status: 302,
        headers: { location: "/jam/2025" },
      }),
      new Response("ok", { status: 200 }),
    ];
    let fetch = t.mock.fn((_: Request) => Promise.resolve(responses.shift()!));

    let router = { fetch } as unknown as Router;
    let request = new Request("http://localhost/jam", { method: "GET" });
    let response = await followFrameRedirects(
      router,
      request,
      new URL("/jam", request.url),
      new Headers({ accept: "text/html" }),
    );

    assert.equal(fetch.mock.calls.length, 2);
    assert.equal(
      fetch.mock.calls[0]?.arguments[0]?.url,
      "http://localhost/jam",
    );
    assert.equal(
      fetch.mock.calls[1]?.arguments[0]?.url,
      "http://localhost/jam/2025",
    );
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "ok");
  });

  it("throws after too many redirects", async (t) => {
    let fetch = t.mock.fn((_: Request) =>
      Promise.resolve(
        new Response(null, {
          status: 302,
          headers: { location: "/loop" },
        }),
      ),
    );

    let router = { fetch } as unknown as Router;
    let request = new Request("http://localhost/start", { method: "GET" });

    await assert.rejects(
      followFrameRedirects(
        router,
        request,
        new URL("/start", request.url),
        new Headers({ accept: "text/html" }),
      ),
      /Too many frame redirects/,
    );

    assert.equal(fetch.mock.calls.length, 11);
  });
});
