import * as assert from "remix/assert";
import { describe, it } from "remix/test";
import { homeHandler } from "./controller";
import { CACHE_CONTROL } from "../../utils/cache-control";
import { routes } from "../../routes";
import { createRouteTestRouter } from "../../../test/create-route-test-router";
describe("Home route", () => {
  it("renders expected content and metadata", async () => {
    let router = createRouteTestRouter();
    router.map(routes.home, homeHandler);
    let response = await router.fetch("http://localhost:3000/");
    assert.equal(response.status, 200);
    assert.ok(response.headers.get("Content-Type")?.includes("text/html"));
    assert.equal(response.headers.get("Cache-Control"), CACHE_CONTROL.DEFAULT);
    let html = await response.text();
    assert.ok(html.includes("<html"));
    assert.ok(
      html.includes("Remix - A Full Stack Framework Built on Web APIs"),
    );
    assert.ok(html.includes("Remix 3 is under active development."));
    assert.ok(html.includes('href="/styles/app.css"'));
    assert.ok(html.includes('class="marketing-home"'));
    assert.ok(html.includes('content="http://localhost:3000/"'));
    assert.ok(html.includes("#github"));
    assert.ok(html.includes("og:title"));
    assert.ok(html.includes("twitter:card"));
  });
});
