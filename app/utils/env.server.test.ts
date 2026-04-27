import * as assert from "remix/assert";
import { afterEach, beforeEach, describe, it } from "remix/test";
import { parseEnv } from "./env.server";
describe("parseEnv", () => {
  let originalNodeEnv: string | undefined;
  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });
  it("parses valid env with all optional fields", () => {
    let result = parseEnv({
      CONVERTKIT_KEY: "test-key",
      PUBLIC_STOREFRONT_API_TOKEN: "token",
    });
    assert.equal(result.CONVERTKIT_KEY, "test-key");
    assert.equal(result.PUBLIC_STOREFRONT_API_TOKEN, "token");
  });
  it("accepts missing CONVERTKIT_KEY in development", () => {
    process.env.NODE_ENV = "development";
    let result = parseEnv({});
    assert.equal(result.CONVERTKIT_KEY, undefined);
  });
  it("rejects missing CONVERTKIT_KEY in production", () => {
    process.env.NODE_ENV = "production";
    assert.throws(() => parseEnv({}));
  });
  it("accepts missing PUBLIC_STOREFRONT_API_TOKEN", () => {
    let result = parseEnv({});
    assert.equal(result.PUBLIC_STOREFRONT_API_TOKEN, undefined);
  });
});
