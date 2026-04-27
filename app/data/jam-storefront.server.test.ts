import * as assert from "remix/assert";
import { describe, it } from "remix/test";
import { parseCart, parsePhotos, parseProduct } from "./jam-storefront.server";
describe("parseProduct", () => {
  it("parses valid product data", () => {
    let product = parseProduct({
      id: "gid://shopify/Product/123",
      price: "399.00",
      productId: "gid://shopify/ProductVariant/456",
      availableForSale: true,
    });
    assert.deepEqual(product, {
      id: "gid://shopify/Product/123",
      price: "399.00",
      productId: "gid://shopify/ProductVariant/456",
      availableForSale: true,
    });
  });
  it("rejects invalid product data", () => {
    assert.throws(() => parseProduct({ id: "x" }));
    assert.throws(() =>
      parseProduct({
        id: 123,
        price: "1",
        productId: "p",
        availableForSale: true,
      }),
    );
  });
});
describe("parseCart", () => {
  it("parses valid cart data", () => {
    let cart = parseCart({
      id: "gid://shopify/Cart/abc",
      checkoutUrl: "https://jam.remix.run/checkout/abc",
    });
    assert.equal(cart.checkoutUrl, "https://jam.remix.run/checkout/abc");
  });
  it("rejects invalid checkoutUrl", () => {
    assert.throws(() =>
      parseCart({
        id: "cart-id",
        checkoutUrl: "not-a-valid-url",
      }),
    );
  });
  it("rejects missing checkoutUrl", () => {
    assert.throws(() =>
      parseCart({
        id: "cart-id",
      }),
    );
  });
});
describe("parsePhotos", () => {
  it("parses valid photos array", () => {
    let photos = parsePhotos([
      {
        url: "https://example.com/photo.jpg",
        width: 800,
        height: 600,
      },
      {
        url: "https://example.com/photo2.jpg",
        altText: "Alt text",
        width: 400,
        height: 300,
      },
    ]);
    assert.equal(photos.length, 2);
    assert.equal(photos[0].url, "https://example.com/photo.jpg");
    assert.equal(photos[1].altText, "Alt text");
  });
  it("rejects invalid url in photo", () => {
    assert.throws(() =>
      parsePhotos([
        {
          url: "not-a-url",
          width: 100,
          height: 100,
        },
      ]),
    );
  });
});
