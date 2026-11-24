import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PRODUCTS } from "./clips.ts";
import { ProductPage } from "./ProductPage.tsx";

describe("ProductPage", () => {
  it("shows the product and the simulated click line when opened from the clip", () => {
    const html = renderToStaticMarkup(<ProductPage clipId="c" product={PRODUCTS.get("fixture-pan")} fromClip />);
    expect(html).toContain("Everyday Skillet");
    expect(html).toContain("Simulated click recorded.");
    expect(html).toContain('href="#/clip/c"');
  });
  it("claims no click on a reload or shared link", () => {
    const html = renderToStaticMarkup(<ProductPage clipId="c" product={PRODUCTS.get("fixture-pan")} fromClip={false} />);
    expect(html).not.toContain("Simulated click recorded.");
  });
  it("shows Product not found for an unknown ID, with the Back link", () => {
    const html = renderToStaticMarkup(<ProductPage clipId="c" product={undefined} fromClip={false} />);
    expect(html).toContain("Product not found.");
    expect(html).toContain('href="#/clip/c"');
  });
});
