import * as assert from "remix/assert";
import { describe, it } from "remix/test";
import { CACHE_CONTROL } from "../../utils/cache-control";
import { buildBlogRssResponse } from "./rss";
describe("blog RSS route handler", () => {
  it("returns an RSS XML response with cache headers", async () => {
    let response = buildBlogRssResponse([
      {
        slug: "hello-world",
        title: "Hello World",
        summary: "A first post",
        date: new Date("2025-01-01T00:00:00.000Z"),
      },
    ]);
    assert.ok(response instanceof Response);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Content-Type"), "application/xml");
    assert.equal(response.headers.get("Cache-Control"), CACHE_CONTROL.DEFAULT);
    let xml = await response.text();
    assert.ok(xml.includes("<rss"));
    assert.ok(xml.includes("<title>Remix Blog</title>"));
    assert.ok(
      xml.includes(
        "<description>Thoughts about building excellent user experiences with Remix.</description>",
      ),
    );
    assert.ok(xml.includes("<link>https://remix.run/blog/hello-world</link>"));
  });
});
