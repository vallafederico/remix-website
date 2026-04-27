import * as assert from "remix/assert";
import { describe, it } from "remix/test";
import { jam2025LineupHandler } from "./2025-lineup";
import { routes } from "../../routes";
import { createRouteTestRouter } from "../../../test/create-route-test-router";
describe("Jam lineup route", () => {
  it("renders the jam stylesheet link", async () => {
    let router = createRouteTestRouter();
    router.map(routes.jam.y2025.lineup, jam2025LineupHandler);
    let response = await router.fetch("http://localhost:3000/jam/2025/lineup");
    assert.equal(response.status, 200);
    let html = await response.text();
    assert.ok(html.includes("Schedule and Lineup | Remix Jam 2025"));
    assert.ok(html.includes('href="/styles/jam.css"'));
  });
});
