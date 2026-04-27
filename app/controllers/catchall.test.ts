import * as assert from "remix/assert";
import { describe, it } from "remix/test";
import { catchallHandler } from "./catchall";
import { createRouteTestRouter } from "../../test/create-route-test-router";
function createContext(pathname: string) {
  return {
    request: new Request(`https://remix.run${pathname}`),
  };
}
describe("catchall route", () => {
  it("redirects trailing slash paths", async () => {
    let response = catchallHandler(createContext("/docs/"));
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("Location"), "https://remix.run/docs");
  });
  it("redirects docs paths to v2", async () => {
    let response = catchallHandler(createContext("/docs/en/main/guides"));
    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("Location"),
      "https://v2.remix.run/docs/guides",
    );
  });
  it("redirects /docs/en/v1 docs paths to the final v1 GitHub snapshot", async () => {
    let response = catchallHandler(
      createContext("/docs/en/v1/guides/data-loading"),
    );
    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("Location"),
      "https://github.com/remix-run/remix/blob/remix%401.19.3/docs/guides/data-loading.md",
    );
  });
  it("redirects /docs/v1 docs paths to the final v1 GitHub snapshot", async () => {
    let response = catchallHandler(
      createContext("/docs/v1/guides/data-loading"),
    );
    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("Location"),
      "https://github.com/remix-run/remix/blob/remix%401.19.3/docs/guides/data-loading.md",
    );
  });
  it("redirects arbitrary 1.x.x docs paths to their matching GitHub tag", async () => {
    let response = catchallHandler(
      createContext("/docs/en/1.19.2/guides/data-loading"),
    );
    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("Location"),
      "https://github.com/remix-run/remix/blob/remix%401.19.2/docs/guides/data-loading.md",
    );
  });
  it("redirects <=1.6.4 docs paths using the legacy v-prefixed tag", async () => {
    let response = catchallHandler(
      createContext("/docs/en/1.6.4/guides/data-loading"),
    );
    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("Location"),
      "https://github.com/remix-run/remix/blob/v1.6.4/docs/guides/data-loading.md",
    );
  });
  it("redirects resources paths to v2", async () => {
    let response = catchallHandler(createContext("/resources"));
    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("Location"),
      "https://v2.remix.run/resources",
    );
  });
  it("returns 404 for unknown paths", async () => {
    let router = createRouteTestRouter();
    router.map("*", catchallHandler);
    let response = await router.fetch("https://remix.run/not-real");
    assert.equal(response.status, 404);
  });
});
