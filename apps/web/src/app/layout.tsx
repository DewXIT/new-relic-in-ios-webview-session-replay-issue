import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "The blank frame — New Relic × iOS WebView",
  description: "A small reproduction lab for a hidden iframe and an iOS WebView crash.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
