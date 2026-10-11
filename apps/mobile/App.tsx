import React, { useCallback, useRef, useState } from "react";
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { StatusBar } from "expo-status-bar";
import { variant as configuredVariant } from "./variant.json";
import { decideNavigation, Variant } from "./src/navigation";

const variant = configuredVariant as Variant;
const defaultURL = process.env.EXPO_PUBLIC_DEMO_URL || "https://dewxit.github.io/new-relic-in-ios-webview-session-replay-issue/";
function Demo() {
  const [input, setInput] = useState(defaultURL);
  const [browserURL, setBrowserURL] = useState<string | null>(null);
  const [pageURL, setPageURL] = useState<string | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  const [error, setError] = useState("");
  const browser = useRef<WebView<object>>(null);
  const log = useCallback((message: string) => {
    const line = new Date().toISOString() + " " + message;
    console.info("[FRAME-LAB]", line);
    setEvents(previous => [line, ...previous].slice(0, 35));
  }, []);
  function start() {
    try {
      const url = new URL(input.trim());
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("Use an HTTP or HTTPS URL");
      if (!url.searchParams.has("replay")) url.searchParams.set("replay", "off");
      setError(""); setPageURL(null); setBrowserURL(url.href);
      log("Browser source=" + url.href);
    } catch (e) { setError(e instanceof Error ? e.message : "Invalid URL"); }
  }
  return <SafeAreaView style={styles.container}>
    <StatusBar style="dark"/>
    <View style={styles.header}><Text style={styles.title}>FRAME / LAB</Text><Text style={styles.badge}>{variant.toUpperCase()} · WebView 13.16.2</Text></View>
    {!browserURL ? <View style={styles.setup}>
      <Text style={styles.heading}>One frame. Two outcomes.</Text>
      <Text style={styles.copy}>{variant === "broken" ? "Unprotected navigation and native URL handling. A recorder frame may terminate this app." : "Child frames stay in the current page. Only file URLs use the native file loader."}</Text>
      <Text style={styles.label}>DEMO PAGE URL</Text>
      <TextInput style={styles.input} value={input} onChangeText={setInput} autoCapitalize="none" autoCorrect={false} keyboardType="url" accessibilityLabel="Demo page URL"/>
      <Button title="Load demo page" onPress={start}/>
    </View> : <>
      <View style={styles.toolbar}><Button title="Change URL" onPress={() => {setBrowserURL(null);setPageURL(null);}}/><Button title={pageURL ? "Back to demo" : "Reload"} onPress={() => pageURL ? setPageURL(null) : browser.current?.reload()}/></View>
      <View style={styles.web}>
        <WebView<object> ref={browser} source={{uri:browserURL}} style={pageURL ? styles.hidden : styles.web}
          originWhitelist={["*"]} webviewDebuggingEnabled
          onShouldStartLoadWithRequest={request => {
            const decision = decideNavigation(variant, request, browserURL);
            log("Browser.navigation " + JSON.stringify({url:request.url,isTopFrame:request.isTopFrame,decision}));
            if (decision === "open-page") { log("Page source=" + request.url);setPageURL(request.url);return false; }
            return decision === "allow";
          }}
          onMessage={event => log("Web: " + event.nativeEvent.data)}
          onError={event => {setError(event.nativeEvent.description);log("Browser.error " + event.nativeEvent.description);}}
          onHttpError={event => setError("HTTP " + event.nativeEvent.statusCode)}
        />
        {pageURL !== null && <WebView<object> key={pageURL} source={{uri:pageURL}} style={styles.overlay}
          originWhitelist={["*"]} webviewDebuggingEnabled
          onShouldStartLoadWithRequest={request => variant === "broken" || !(request.isTopFrame !== false && /^about:blank(?:[?#]|$)/i.test(request.url))}
          onError={event => {setError(event.nativeEvent.description);log("Page.error " + event.nativeEvent.description);}}/>}
      </View>
    </>}
    {!!error && <Text style={styles.error}>{error}</Text>}
    <View style={styles.console}><Text style={styles.label}>NATIVE NAVIGATION TRACE · UTC</Text><ScrollView>{events.map((line,i)=><Text selectable key={i} style={styles.event}>{line}</Text>)}</ScrollView></View>
  </SafeAreaView>;
}
export default function App() { return <SafeAreaProvider><Demo/></SafeAreaProvider>; }
const styles=StyleSheet.create({
  container:{flex:1,backgroundColor:"#f3f4ec"},
  header:{padding:16,borderBottomWidth:1,borderColor:"#d4dad0"},
  title:{fontSize:22,fontWeight:"900",color:"#172a2b"},badge:{fontSize:11,marginTop:5,color:"#546766"},
  setup:{padding:24,flex:1},heading:{fontSize:35,fontWeight:"800",color:"#172a2b",marginBottom:20},
  copy:{fontSize:16,lineHeight:24,color:"#546766",marginBottom:30},
  label:{fontSize:10,fontWeight:"700",color:"#546766",marginBottom:8},
  input:{borderWidth:1,borderColor:"#bdccbe",padding:13,borderRadius:8,marginBottom:15},
  toolbar:{flexDirection:"row",justifyContent:"space-between",paddingHorizontal:10},
  web:{flex:1},hidden:{position:"absolute",width:1,height:1,opacity:0},
  overlay:{position:"absolute",top:0,right:0,bottom:0,left:0},
  console:{height:135,padding:12,borderTopWidth:1,borderColor:"#d4dad0"},
  event:{fontFamily:"Courier",fontSize:10,color:"#172a2b",marginBottom:6},
  error:{padding:10,color:"#a52c2c"},
});
