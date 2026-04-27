import * as assert from "remix/assert";
import { describe, it } from "remix/test";
import { blogPostHandler } from "./post";
import { CACHE_CONTROL } from "../../utils/cache-control";
import { getBlogPost } from "../../data/blog.server";
import { routes } from "../../routes";
import { createRouteTestRouter } from "../../../test/create-route-test-router";
describe("Blog post route", () => {
  it("renders a post for a valid slug", async () => {
    let post = await getBlogPost("remix-v2");
    let router = createRouteTestRouter();
    router.map(routes.blogPost, blogPostHandler);
    let response = await router.fetch("http://localhost:3000/blog/remix-v2");
    assert.equal(response.status, 200);
    assert.ok(response.headers.get("Content-Type")?.includes("text/html"));
    assert.equal(response.headers.get("Cache-Control"), CACHE_CONTROL.DEFAULT);
    let html = await response.text();
    assert.ok(html.includes(`<title>${post.title} | Remix</title>`));
    assert.ok(html.includes(post.summary));
    assert.ok(html.includes('class="md-prose"'));
    assert.ok(html.includes("twitter:card"));
    assert.ok(html.includes('action="/_actions/newsletter"'));
    assert.ok(html.includes('rel="alternate"'));
    assert.ok(html.includes('href="/styles/md.css"'));
    assert.ok(html.includes('type="text/markdown"'));
    assert.ok(
      html.includes(
        `href="${routes.blogPost.href({ slug: "remix-v2", ext: "md" })}"`,
      ),
    );
  });
  it("returns 404 for a non-existent slug", async () => {
    let router = createRouteTestRouter();
    router.map(routes.blogPost, blogPostHandler);
    let response = await router.fetch(
      "http://localhost:3000/blog/this-slug-does-not-exist",
    );
    assert.equal(response.status, 404);
  });
});
