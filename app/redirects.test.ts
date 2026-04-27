import * as assert from "remix/assert";
import { describe, it } from "remix/test";
import { createRouter } from "remix/fetch-router";
import {
  createRedirectRoutes,
  loadRedirectsFromFile,
  parseRedirectsFile,
} from "./redirects";
let redirects = loadRedirectsFromFile();
let { redirectController, redirectRoutes } = createRedirectRoutes(redirects);
let router = createRouter();
router.map(redirectRoutes, redirectController);
async function getRedirectResult(
  pathname: string,
  targetRouter: ReturnType<typeof createRouter> = router,
) {
  let url = `https://example.com${pathname || "/"}`;
  let response = await targetRouter.fetch(url);
  if (response.status >= 300 && response.status < 400) {
    return {
      redirect: response,
      url: response.headers.get("Location"),
      status: response.status,
    };
  }
  return { redirect: null as null, url: null, status: null };
}
describe("redirects (fetch-router)", () => {
  describe("parser", () => {
    it("skips invalid lines and defaults invalid status codes", () => {
      let redirects = parseRedirectsFile(`
        # comment
        /one /target 301
        /two /target-two not-a-code
        /broken-only-one-token
      `);
      assert.equal(redirects.length, 2);
      assert.equal(redirects[0]?.status, 301);
      assert.equal(redirects[1]?.status, 302);
    });
  });
  describe("exact matches", () => {
    it("redirects /login to the legacy app", async () => {
      let { url, status } = await getRedirectResult("/login");
      assert.equal(url, "https://remix-run.web.app/login");
      assert.equal(status, 302);
    });
    it("redirects /features to root", async () => {
      let { url, status } = await getRedirectResult("/features");
      assert.equal(url, "/");
      assert.equal(status, 302);
    });
  });
  describe("splat matches (* and :splat)", () => {
    let splatRedirects = parseRedirectsFile(
      "/conf/2023/* https://v2.remix.run/conf/2023/:splat 302",
    );
    let splatModule = createRedirectRoutes(splatRedirects);
    let splatRouter = createRouter();
    splatRouter.map(splatModule.redirectRoutes, splatModule.redirectController);
    it("redirects /conf/2023/any/nested/path", async () => {
      let { url } = await getRedirectResult(
        "/conf/2023/any/nested/path",
        splatRouter,
      );
      assert.equal(url, "https://v2.remix.run/conf/2023/any/nested/path");
    });
  });
  describe("no redirect", () => {
    it("returns non-redirect for unmatched paths", async () => {
      let result = await getRedirectResult("/some/random/path");
      assert.equal(result.redirect, null);
      assert.equal(result.url, null);
    });
  });
});
