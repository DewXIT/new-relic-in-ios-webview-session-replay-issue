export type LabEvent = { time: string; message: string };
type ReplayAPI = { recordReplay(): void; pauseReplay(): void };
declare global {
  interface Window {
    newrelic?: ReplayAPI;
    NREUM?: Record<string, unknown>;
    ReactNativeWebView?: { postMessage(message: string): void };
    __replayDemo?: ReturnType<typeof createLab>;
  }
}
const configuration = {
  accountID: process.env.NEXT_PUBLIC_NR_ACCOUNT_ID,
  trustKey: process.env.NEXT_PUBLIC_NR_TRUST_KEY,
  agentID: process.env.NEXT_PUBLIC_NR_AGENT_ID,
  licenseKey: process.env.NEXT_PUBLIC_NR_LICENSE_KEY,
  applicationID: process.env.NEXT_PUBLIC_NR_APPLICATION_ID,
};
const beacon = process.env.NEXT_PUBLIC_NR_BEACON || "bam.eu01.nr-data.net";
export const configured = Object.values(configuration).every(Boolean);
export const loaderURL = "https://js-agent.newrelic.com/nr-loader-spa-1.323.0.min.js";

// Diagnostic observation only: no patching DOM prototypes and no synthetic frames.
function createLab() {
  const events: LabEvent[] = [];
  const listeners = new Set<() => void>();
  const enabled = new URL(location.href).searchParams.get("replay") === "on";
  let status = "Replay OFF — agent not loaded";
  const emit = (message: string) => {
    const entry = { time: new Date().toISOString(), message };
    events.unshift(entry);
    events.splice(80);
    console.info("[REPLAY-DEMO]", entry.time, message);
    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "lab-event", ...entry }));
    listeners.forEach(listener => listener());
  };
  const update = (message: string) => { status = message; emit(message); };
  emit("Page loaded; requested replay mode: " + (enabled ? "ON" : "OFF"));
  if (!configured) {
    update("Configuration needed — add your New Relic Browser settings");
  } else if (enabled) {
    const observer = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node instanceof HTMLIFrameElement) {
          emit("IFRAME inserted; src=" + (node.getAttribute("src") || "(unset → blank document)"));
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    if ("PerformanceObserver" in window) {
      const network = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes("nr-spa-recorder-1.323.0")) {
            emit("Recorder resource observed: nr-spa-recorder-1.323.0");
          }
        }
      });
      network.observe({ type: "resource", buffered: true });
    }
    window.NREUM = {
      init: {
        browser_consent_mode: { enabled: false },
        distributed_tracing: { enabled: true },
        performance: { capture_measures: true },
        privacy: { cookies_enabled: true },
        ajax: { deny_list: [beacon], capture_payloads: "none" },
        session_replay: {
          enabled: true, autoStart: true, preload: false,
          sampling_rate: 100, error_sampling_rate: 0,
          block_selector: "", mask_text_selector: "*", mask_all_inputs: true,
          collect_fonts: true, inline_images: false, inline_stylesheet: true,
          fix_stylesheets: true, mask_input_options: {},
        },
      },
      loader_config: configuration,
      info: {
        beacon, errorBeacon: beacon,
        licenseKey: configuration.licenseKey,
        applicationID: configuration.applicationID,
        sa: 1,
      },
    };
    update("Loading New Relic 1.323.0…");
    const script = document.createElement("script");
    script.src = loaderURL;
    script.async = true;
    script.onload = () => {
      if (!window.newrelic?.recordReplay) {
        update("Loader finished, but recordReplay API is unavailable");
        return;
      }
      window.newrelic.recordReplay();
      update("Replay requested — waiting for recorder evidence");
    };
    script.onerror = () => update("New Relic loader failed — check network or content blockers");
    document.head.appendChild(script);
  }
  return {
    enabled,
    events,
    get status() { return status; },
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    setMode(on: boolean) {
      if (!on) window.newrelic?.pauseReplay();
      const url = new URL(location.href);
      url.searchParams.set("replay", on ? "on" : "off");
      // Full navigation: OFF starts a document with no agent, rather than a paused loaded recorder.
      location.assign(url.href);
    },
  };
}
export function getLab() {
  return window.__replayDemo ??= createLab();
}
