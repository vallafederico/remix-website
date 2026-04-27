import * as assert from "remix/assert";
import { describe, it } from "remix/test";
import { routes } from "../routes";
import { createRouteTestRouter } from "../../test/create-route-test-router";
import { blogOgImageHandler, parseOgImageQuery } from "./blog-og-image";
describe("Blog OG image route", () => {
  it("returns 400 when required params are missing", async () => {
    let router = createRouteTestRouter();
    router.map(routes.blogOgImage, blogOgImageHandler);
    let response = await router.fetch("http://localhost:3000/img/remix-v2");
    let body = await response.json();
    assert.equal(response.status, 400);
    assert.deepEqual(body, { error: "Missing required params" });
  });
  it("returns 400 when author params are mismatched", async () => {
    let router = createRouteTestRouter();
    router.map(routes.blogOgImage, blogOgImageHandler);
    let response = await router.fetch(
      "http://localhost:3000/img/remix-v2?title=Title&date=Date&authorName=Ada&authorName=Grace&authorTitle=Engineer",
    );
    let body = await response.json();
    assert.equal(response.status, 400);
    assert.deepEqual(body, {
      error: "Number of authorNames must match number of authorTitles",
    });
  });
  it("parses valid query params into a typed payload", () => {
    let result = parseOgImageQuery(
      new Request(
        "http://localhost:3000/img/remix-v2?title=Hello%20%F0%9F%91%8B&date=April%2011%2C%202026&authorName=Ada%20Lovelace&authorTitle=Engineer",
      ),
    );
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.value.title, "Hello");
    assert.equal(result.value.displayDate, "April 11, 2026");
    assert.equal(result.value.authors.length, 1);
    assert.deepEqual(result.value.authors[0], {
      name: "Ada Lovelace",
      title: "Engineer",
      imgSrc: "http://localhost:3000/authors/profile-ada-lovelace.png",
    });
  });
});
