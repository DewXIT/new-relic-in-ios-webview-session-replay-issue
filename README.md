# New Relic × iOS WebView — frame lab

A small demo for the `about:blank is not a file URL` incident: a temporary frame created by New Relic Session Replay is mistaken for a request to open another app screen.

## What is in this repository

- `apps/web`: Next.js, static export for GitHub Pages. Original New Relic SPA loader **1.323.0**, not a current agent.
- `apps/mobile`: generated with `npx create-expo-app@latest ... --template blank-typescript`. Expo **57.0.27**, React Native **0.86.3**, WebView pinned to **13.16.2**.
- Two native build variants: **Frame Lab Broken** and **Frame Lab Fixed**, with different bundle identifiers.

The RN/Expo scaffold is current by choice. This is a minimal reproduction of the incident's web/navigation behavior, an isolated educational example.

## Install

Use Node 22.22.1:

```sh
nvm use
npm run install:all
```

Each app has its own committed npm lockfile. No root workspaces or global dependencies are required.

## Configure your own New Relic Browser application

Create a Browser application in your own New Relic account and enable Session Replay for it. Copy the browser configuration values from its installation snippet. The default beacon in this demo is the EU endpoint: use the beacon shown in your snippet for your region.

```sh
cp apps/web/.env.example apps/web/.env.local
```

Populate these values:

- `NEXT_PUBLIC_NR_ACCOUNT_ID`
- `NEXT_PUBLIC_NR_TRUST_KEY`
- `NEXT_PUBLIC_NR_AGENT_ID`
- `NEXT_PUBLIC_NR_LICENSE_KEY`
- `NEXT_PUBLIC_NR_APPLICATION_ID`
- `NEXT_PUBLIC_NR_BEACON`

These are the values used in the public Browser installation snippet. **Do not use a personal/admin API key.** They are embedded in the published website. Use the Browser configuration from your own account.

Until configuration is supplied, the page displays a configuration notice and disables replay controls. It does not silently use someone else's account.

## Start the website locally

```sh
npm run web
```

Open http://localhost:3000. On the iPhone, enter your Mac's LAN URL, e.g. `http://192.168.1.10:3000`, into the app's URL field. The native app defaults to the intended GitHub Pages URL.

### Replay ON and OFF

- **OFF** reloads a fresh document without loading the New Relic agent.
- **ON** reloads the document, loads the pinned agent and calls its `recordReplay()` API. Replay sampling is set to 100 for this demo, with error sampling 0.
- OFF first calls `pauseReplay()` when available, then reloads. It does not pretend that pausing removes an already-created iframe.
- A requested mode is not proof of recording. Check the observed recorder resource and iframe events. New Relic entitlement, session state, network access and the agent's internal decisions still matter.
- Diagnostic observation uses MutationObserver and PerformanceObserver. It does not override DOM prototypes or create a synthetic iframe.
- The page contains only demo content. ON can send its telemetry to your New Relic account.

In the original investigation, the active recorder temporarily created a blank iframe to obtain browser prototypes. That fallback is conditional. This demo must be checked on the phone with your account before claiming a successful reproduction.

## Run on iOS

A custom native build is required. **Do not use Expo Go**: its bundled WebView cannot test this native patch.

```sh
npm run ios:broken
# Stop the current Metro process before switching.
npm run ios:fixed
```

The commands select matching JS/native variants, regenerate the native iOS project, and ask Expo to build on your device. You need Xcode and your own signing team. Native generated projects are ignored by Git.

| Variant | App identifier | Behavior |
| --- | --- | --- |
| broken | com.dewxit.framelab.broken | Navigation outside the demo document opens another WebView, including child frames; host-based native loading condition |
| fixed | com.dewxit.framelab.fixed | Subframes remain in the current page; top-level blank URLs are blocked; native file API only receives file URLs |

The native change in `RNCWebViewImpl.m` is exactly:

```diff
- if (request.URL.host) {
+ if (!request.URL.isFileURL) {
```

`apps/mobile/scripts/variant.mjs` verifies the installed WebView version and the expected source condition before modifying it. `postinstall` reapplies the selected variant after installing dependencies. It fails rather than silently patching an unexpected file.

The two app identities have separate website storage; use the page's ON control in each. Debug builds share this checkout and Metro: do not switch variants with an old debug app still connected. Use separately built Release apps for simultaneous comparisons; stop Metro first and run the equivalent Expo commands with `--configuration Release`. Changing JS or restarting Metro alone cannot change the compiled native patch.

The initial demo WebView remains mounted when it opens the second WebView. The app logs URL, isTopFrame and navigation decision to the on-screen trace and the console. Safari inspection is enabled for these demo builds.

## GitHub Pages

The workflow `.github/workflows/pages.yml` builds and publishes the static website on pushes to main.

1. In GitHub repository settings, select **Pages → Source → GitHub Actions**.
2. Add the same `NEXT_PUBLIC_NR_*` values under **Settings → Secrets and variables → Actions → Variables**.
3. Push the code to main or run the workflow manually.

Expected URL once deployment succeeds:

https://dewxit.github.io/new-relic-in-ios-webview-session-replay-issue/

The workflow supplies the repository base path. Configuration is resolved at build time; after changing variables, rerun the workflow. Without New Relic settings the site still builds, but replay remains unavailable.

This repository being prepared locally does not mean the page has already been published.

## Validation

```sh
npm run check
cd apps/mobile
npx expo export --platform ios
```

Checks cover web lint/build, mobile TypeScript and the navigation regression:
a child-frame blank callback opens an app page in broken mode but stays inside the current WebView in fixed mode. Both preserve ordinary document/link behavior.

The final device check needs your Browser application:
load the page, switch replay ON, confirm recorder activity, capture the blank-frame callback and resulting behavior. Compare the rebuilt fixed app under active replay. A successful page load while replay is inactive does not exercise the failure.

## References

- [New Relic recordReplay / pauseReplay](https://docs.newrelic.com/docs/browser/browser-monitoring/browser-pro-features/session-replay/advanced-features/)
- [Pinned original SPA loader](https://js-agent.newrelic.com/nr-loader-spa-1.323.0.min.js)
- [Pinned recorder](https://js-agent.newrelic.com/nr-spa-recorder-1.323.0.min.js)
