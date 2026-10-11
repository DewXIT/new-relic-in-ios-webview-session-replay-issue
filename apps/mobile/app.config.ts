import { ExpoConfig } from "expo/config";
import { variant } from "./variant.json";
const config: ExpoConfig = {
  name: variant === "fixed" ? "Frame Lab Fixed" : "Frame Lab Broken",
  slug: "new-relic-webview-demo",
  version: "1.0.0",
  orientation: "portrait",
  ios: { bundleIdentifier: "com.dewxit.framelab." + variant, supportsTablet: true },
  android: { package: "com.dewxit.framelab." + variant },
  extra: { variant },
};
export default config;
