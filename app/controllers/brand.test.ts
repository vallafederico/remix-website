import * as assert from "remix/assert";
import { describe, it } from "remix/test";
import { brandHandler } from "./brand";
import { CACHE_CONTROL } from "../utils/cache-control";
import { routes } from "../routes";
import { createRouteTestRouter } from "../../test/create-route-test-router";
describe("Brand route", () => {
  it("renders expected content and metadata", async () => {
    let router = createRouteTestRouter();
    router.map(routes.brand, brandHandler);
    let response = await router.fetch("http://localhost:3000/brand");
    assert.equal(response.status, 200);
    assert.ok(response.headers.get("Content-Type")?.includes("text/html"));
    assert.equal(response.headers.get("Cache-Control"), CACHE_CONTROL.DEFAULT);
    let html = await response.text();
    assert.ok(html.includes("<html"));
    assert.ok(html.includes("Remix Assets and Branding Guidelines"));
    assert.ok(html.includes("Remix Brand"));
    assert.ok(html.includes("Trademark Usage Agreement"));
    assert.ok(html.includes('href="/_brand/remix-light.svg"'));
    assert.ok(html.includes("#github"));
  });
});
