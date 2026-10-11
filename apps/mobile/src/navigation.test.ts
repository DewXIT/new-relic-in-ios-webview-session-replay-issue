import test from "node:test";
import assert from "node:assert/strict";
import { decideNavigation } from "./navigation.ts";

const demoURL = "https://example.com/demo/";
test("a blank child frame becomes an app page only in the broken variant", () => {
  const request = { url: "about:blank", isTopFrame: false };
  assert.equal(decideNavigation("broken", request, demoURL), "open-page");
  assert.equal(decideNavigation("fixed", request, demoURL), "allow");
});
test("fixed top-level blank cannot open a page", () => {
  for (const url of ["", "about:blank", "about:blank#fragment"]) {
    assert.equal(decideNavigation("fixed", {url, isTopFrame:true}, demoURL), "block");
  }
});
test("demo reloads and replay switches stay in the current WebView without a marker", () => {
  for (const variant of ["broken", "fixed"] as const) {
    for (const url of [demoURL, demoURL + "?replay=on", demoURL + "?replay=off", demoURL + "#section"]) {
      assert.equal(decideNavigation(variant, {url, isTopFrame:true}, demoURL), "allow");
    }
  }
});
test("different pages and origins open separately", () => {
  for (const variant of ["broken", "fixed"] as const) {
    for (const url of ["https://example.com/details", "https://other.example/demo/"]) {
      assert.equal(decideNavigation(variant, {url, isTopFrame:true}, demoURL), "open-page");
    }
  }
});
