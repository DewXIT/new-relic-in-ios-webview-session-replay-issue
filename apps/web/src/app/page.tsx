"use client";
import { useEffect, useState } from "react";
import { configured, getLab, type LabEvent } from "@/lib/replay";
export default function Page() {
  const [view, setView] = useState({ enabled: false, status: "Connecting to demo…", events: [] as LabEvent[] });
  const [count, setCount] = useState(0);
  useEffect(() => {
    const lab = getLab();
    const refresh = () => setView({ enabled: lab.enabled, status: lab.status, events: [...lab.events] });
    const unsubscribe = lab.subscribe(refresh);
    refresh();
    return unsubscribe;
  }, []);
  return <main>
    <header><a className="brand" href="./">FRAME / LAB</a><span className="version">NEW RELIC 1.323.0</span></header>
    <section className="hero">
      <div className="eyebrow">ONE HIDDEN FRAME. ONE NATIVE CRASH.</div>
      <h1>The page you<br/>never opened<span>.</span></h1>
      <p className="lead">A small lab for the Session Replay iframe that became a new page inside an iOS app.</p>
    </section>
    <section className="control panel">
      <div><div className="eyebrow">SESSION REPLAY</div><h2>{view.enabled ? "Requested ON" : "OFF"}</h2><p role="status">{view.status}</p></div>
      <button className={view.enabled ? "secondary" : "primary"} disabled={!configured} onClick={() => getLab().setMode(!view.enabled)}>
        {view.enabled ? "Turn replay OFF ↗" : "Turn replay ON ↗"}
      </button>
      <small>Switching reloads the page. OFF loads no New Relic agent. ON requests recording; the event log shows what actually happened.</small>
    </section>
    {!configured && <aside className="notice"><strong>Bring your own New Relic account.</strong><p>Add the Browser configuration in <code>.env.local</code> or GitHub repository variables, then rebuild. Use the Browser configuration from your own account.</p></aside>}
    <div className="columns">
      <section className="panel sample"><div className="eyebrow">THE ORDINARY PAGE</div><h2>Nothing unusual here.</h2><p>Scroll, tap, interact. Any hidden frame in this demo comes from the recorder itself.</p><button className="secondary" onClick={() => setCount(count + 1)}>Tap count: {count}</button><div className="receipt"><span>DEMO VISITOR</span><strong>Hello, WebView.</strong><span>No sign-in. No personal data.</span></div></section>
      <section className="panel log"><div className="eyebrow">OBSERVED EVENTS</div><h2>Follow the trail.</h2><ol aria-live="polite">{view.events.map((event, i) => <li key={event.time + i}><time>{event.time.slice(11, 23)} UTC</time><span>{event.message}</span></li>)}</ol></section>
    </div>
    <footer><span>about:blank ≠ file://</span><p>A requested recording mode is not proof of an active recorder. This demo does not force New Relic to create an iframe.</p></footer>
  </main>;
}
