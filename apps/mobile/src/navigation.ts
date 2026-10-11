export type Variant = "broken" | "fixed";
export type NavigationDecision = "allow" | "block" | "open-page";

export function decideNavigation(
  variant: Variant,
  request: { url: string; isTopFrame?: boolean },
  demoURL: string,
): NavigationDecision {
  if (variant === "fixed") {
    // Embedded frame navigation must not open another app page.
    if (request.isTopFrame === false) return "allow";
    if (!request.url.trim() || /^about:blank(?:[?#]|$)/i.test(request.url)) return "block";
  }

  // Keep the demo document in this WebView, including replay query changes.
  // The broken variant intentionally mistakes frame URLs for separate pages.
  try {
    const target = new URL(request.url);
    const demo = new URL(demoURL);
    if (target.origin === demo.origin && target.pathname === demo.pathname) return "allow";
  } catch {
    return variant === "fixed" ? "block" : "open-page";
  }
  return "open-page";
}
