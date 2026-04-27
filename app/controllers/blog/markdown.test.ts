import * as assert from "remix/assert";
import { describe, it } from "remix/test";
import { blogPostHandler } from "./post";
import { CACHE_CONTROL } from "../../utils/cache-control";
import { routes } from "../../routes";
import { createRouteTestRouter } from "../../../test/create-route-test-router";
describe("Blog markdown routes", () => {
  it("serves source markdown for a valid slug at /blog/:slug.md", async () => {
    let router = createRouteTestRouter();
    router.map(routes.blogPost, blogPostHandler);
    let response = await router.fetch("http://localhost:3000/blog/remix-v2.md");
    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("Content-Type"),
      "text/markdown; charset=utf-8",
    );
    assert.equal(response.headers.get("Cache-Control"), CACHE_CONTROL.DEFAULT);
    let markdown = await response.text();
    assert.ok(markdown.includes("title:"));
    assert.ok(markdown.includes("summary:"));
  });
  it("returns 404 for missing markdown slug", async () => {
    let router = createRouteTestRouter();
    router.map(routes.blogPost, blogPostHandler);
    let response = await router.fetch(
      "http://localhost:3000/blog/this-slug-does-not-exist.md",
    );
    assert.equal(response.status, 404);
  });
});
