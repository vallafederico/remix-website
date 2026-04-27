import * as assert from "remix/assert";
import { describe, it } from "remix/test";
import { blogHandler } from "./controller";
import { CACHE_CONTROL } from "../../utils/cache-control";
import { routes } from "../../routes";
import { createRouteTestRouter } from "../../../test/create-route-test-router";
describe("Blog route", () => {
  it("renders expected content and metadata", async () => {
    let router = createRouteTestRouter();
    router.map(routes.blog, blogHandler);
    let response = await router.fetch("http://localhost:3000/blog");
    assert.equal(response.status, 200);
    assert.ok(response.headers.get("Content-Type")?.includes("text/html"));
    assert.equal(response.headers.get("Cache-Control"), CACHE_CONTROL.DEFAULT);
    let html = await response.text();
    assert.ok(html.includes("<html"));
    assert.ok(html.includes("<title>Remix Blog</title>"));
    assert.ok(
      html.includes(
        "Thoughts about building excellent user experiences with Remix.",
      ),
    );
    assert.ok(html.includes("Featured Articles"));
    assert.ok(html.includes('action="/_actions/newsletter"'));
  });
});
