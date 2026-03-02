import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Network from "expo-network";

import db from "../database/database";
import { COLORS } from "../theme/colors";

// ─────────────────────────────────────────────────────────────
// Helpers for fallback initials avatars
// ─────────────────────────────────────────────────────────────
const PALETTE = [
  "#07575B",
  "#66A5AD",
  "#003B46",
  "#1B6CA8",
  "#2E8B57",
  "#8B4513",
  "#6A0572",
  "#C4901A",
];
const colorFromName = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
};
const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

// ─────────────────────────────────────────────────────────────
// PHASE 1 HTML  –  tiny, no base64, loads instantly
// Images are placeholders (initials SVG) at this point.
// PHASE 2 happens after onLoad via injectJavaScript.
// ─────────────────────────────────────────────────────────────
const buildMapHTML = (students, highlightId) => {
  // Only pass id / name / coords / color — NO picture URIs here
  const safe = students.map((s) => ({
    id: s.student_id,
    name: s.student_name,
    lat: s.student_location_lat,
    lon: s.student_location_lon,
    color: colorFromName(s.student_name),
    init: initials(s.student_name),
  }));

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body,#map{width:100%;height:100%;overflow:hidden}

    .mk{display:flex;flex-direction:column;align-items:center}

    /* photo / initials circle */
    .mk-avatar{
      width:46px;height:46px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      border:3px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      font-family:sans-serif;font-size:15px;font-weight:700;color:#fff;
      flex-shrink:0;
      object-fit:cover;         /* when it becomes an <img> */
      overflow:hidden;
    }
    /* pin triangle */
    .mk-pin{
      width:0;height:0;
      border-left:8px solid transparent;
      border-right:8px solid transparent;
      border-top:12px solid #fff;
      margin-top:-2px;
      filter:drop-shadow(0 2px 2px rgba(0,0,0,0.2));
    }
    /* idle bubble */
    .mk-bubble{
      display:flex;align-items:center;
      background:#fff;border-radius:30px;padding:3px;
      box-shadow:0 3px 10px rgba(0,0,0,0.28);
    }
    /* name label */
    .mk-label{
      display:none;
      font-family:sans-serif;font-size:13px;font-weight:700;
      color:#07575B;margin-left:8px;padding-right:10px;
      white-space:nowrap;max-width:130px;
      overflow:hidden;text-overflow:ellipsis;
    }
    /* selected state */
    .mk-bubble.sel{background:#CDE1E2;}
    .mk-bubble.sel .mk-avatar{width:54px;height:54px;font-size:17px}
    .mk-bubble.sel .mk-label{display:block}
    .mk-bubble.sel~.mk-pin{border-top-color:#CDE1E2}
  </style>
</head>
<body>
<div id="map"></div>
<script>
(function(){
  var students    = ${JSON.stringify(safe)};
  var highlightId = ${JSON.stringify(highlightId)};
  var selectedId  = null;
  var markers = {};   // id → Leaflet marker
  var photos  = {};   // id → base64 data URI (persists forever once injected)

  /* centroid */
  var defLat=13.0145, defLon=80.2234;
  if(students.length){
    defLat=students.reduce(function(a,s){return a+s.lat},0)/students.length;
    defLon=students.reduce(function(a,s){return a+s.lon},0)/students.length;
  }

  var map=L.map('map',{zoomControl:true,attributionControl:false}).setView([defLat,defLon],13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);

  /* Build marker icon – uses real photo if available, else initials */
  function mkIcon(s, sel){
    var sz   = sel ? 54 : 46;
    var bubW = sel ? (sz+6+Math.min(s.name.length*8,130)+20) : (sz+6);
    var label = sel ? '<span class="mk-label">'+s.name+'</span>' : '';

    /* Avatar: photo <img> if we have one, otherwise coloured initials div */
    var avatarInner;
    if(photos[s.id]){
      avatarInner = '<img src="'+photos[s.id]+'" '
        +'style="width:'+sz+'px;height:'+sz+'px;border-radius:50%;'
        +'object-fit:cover;display:block;border:3px solid #fff;flex-shrink:0;" />';
    } else {
      avatarInner = '<div class="mk-avatar" '
        +'style="background:'+s.color+';width:'+sz+'px;height:'+sz+'px">'
        +s.init+'</div>';
    }

    var html = '<div class="mk">'
      +'<div class="mk-bubble'+(sel?' sel':'')+'">'+avatarInner+label+'</div>'
      +'<div class="mk-pin" style="border-top-color:'+(sel?'#CDE1E2':'#fff')+'"></div>'
      +'</div>';
    return L.divIcon({html:html, className:'', iconSize:[bubW,74], iconAnchor:[bubW/2,72]});
  }

  function select(id){
    if(selectedId!==null&&markers[selectedId]){
      var p=students.find(function(s){return s.id===selectedId});
      if(p){markers[selectedId].setIcon(mkIcon(p,false));markers[selectedId].setZIndexOffset(1);}
    }
    if(selectedId===id){selectedId=null;return;}
    selectedId=id;
    var s=students.find(function(s){return s.id===id});
    if(s&&markers[id]){
      markers[id].setIcon(mkIcon(s,true));
      markers[id].setZIndexOffset(1000);
      map.panTo([s.lat,s.lon],{animate:true,duration:.5});
    }
    window.ReactNativeWebView&&
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'select',id:id}));
  }

  /* Called from React Native after WebView loads (PHASE 2).
     Store photos then rebuild ALL marker icons so every marker
     immediately shows the real photo in both idle AND selected state. */
  window.injectPhotos = function(photoMap){
    Object.keys(photoMap).forEach(function(sid){
      photos[parseInt(sid,10)] = photoMap[sid];   // persist in JS scope
    });
    /* Rebuild every marker icon with the now-available photos */
    students.forEach(function(s){
      if(photos[s.id] && markers[s.id]){
        var isSel = (selectedId === s.id);
        markers[s.id].setIcon(mkIcon(s, isSel));
      }
    });
  };

  var latlngs=[];
  students.forEach(function(s){
    var isSel=(s.id===highlightId);
    var m=L.marker([s.lat,s.lon],{icon:mkIcon(s,isSel),zIndexOffset:isSel?1000:1});
    m.on('click',function(e){L.DomEvent.stopPropagation(e);select(s.id);});
    m.addTo(map);
    markers[s.id]=m;
    latlngs.push([s.lat,s.lon]);
    if(isSel)selectedId=s.id;
  });

  if(latlngs.length===1) map.setView(latlngs[0],15);
  else if(latlngs.length>1) map.fitBounds(latlngs,{padding:[90,60]});

  if(highlightId){
    var hs=students.find(function(s){return s.id===highlightId});
    if(hs) setTimeout(function(){map.setView([hs.lat,hs.lon],15,{animate:true});},900);
  }

  map.on('click',function(){
    if(selectedId!==null){
      var p=students.find(function(s){return s.id===selectedId});
      if(p){markers[selectedId].setIcon(mkIcon(p,false));markers[selectedId].setZIndexOffset(1);}
      selectedId=null;
    }
  });
})();
</script>
</body>
</html>`;
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function MapViewPage({ route, navigation }) {
  const webViewRef = useRef(null);
  const studentsRef = useRef([]); // keep full rows (with pic) for injection

  const [htmlContent, setHtmlContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Initializing...");

  const highlightId = route?.params?.highlightStudentId ?? null;

  useFocusEffect(
    useCallback(() => {
      initializePage();
    }, []),
  );

  const initializePage = async () => {
    setIsLoading(true);
    setHtmlContent(null);
    try {
      setLoadingText("Authenticating...");
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      setLoadingText("Checking network...");
      const net = await Network.getNetworkStateAsync();
      if (!net.isConnected) {
        Alert.alert("No Internet", "Internet is needed for map tiles.", [
          { text: "Go Back", onPress: () => navigation.goBack() },
        ]);
        setIsLoading(false);
        return;
      }

      setLoadingText("Loading students...");
      const rows = db.getAllSync(`
        SELECT student_id, student_name, student_picture_uri,
               student_location_lat, student_location_lon
        FROM   students
        WHERE  student_is_active = 1
          AND  student_location_lat  IS NOT NULL
          AND  student_location_lon  IS NOT NULL
      `);

      studentsRef.current = rows; // store full rows for photo injection
      setHtmlContent(buildMapHTML(rows, highlightId));
    } catch (err) {
      console.error("MapViewPage error:", err);
      Alert.alert("Error", "Could not load student data: " + err.message);
    } finally {
      setTimeout(() => setIsLoading(false), 400);
    }
  };

  // ── PHASE 2: inject photos after WebView has fully loaded ──
  const handleWebViewLoad = () => {
    const rows = studentsRef.current;
    if (!rows.length || !webViewRef.current) return;

    // Build a map of { student_id: base64_uri }
    // Send in small batches of 3 to avoid a single huge injection call
    const BATCH = 3;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const photoMap = {};
      batch.forEach((s) => {
        if (s.student_picture_uri)
          photoMap[s.student_id] = s.student_picture_uri;
      });

      if (Object.keys(photoMap).length === 0) continue;

      // Delay each batch slightly so the WebView isn't overwhelmed
      const delay = Math.floor(i / BATCH) * 300;
      setTimeout(() => {
        const js = `
          (function(){
            try{
              window.injectPhotos(${JSON.stringify(photoMap)});
            }catch(e){ console.error('injectPhotos error',e); }
          })();true;
        `;
        webViewRef.current?.injectJavaScript(js);
      }, delay);
    }
  };

  // ── Loading screen ─────────────────────────────────────────
  if (isLoading || !htmlContent) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require("../../assets/loader/circleLoader.json")}
          autoPlay
          loop
          style={styles.lottie}
        />
        <Text style={styles.loadingText}>{loadingText}</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={StyleSheet.absoluteFillObject}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        mixedContentMode="always"
        allowUniversalAccessFromFileURLs
        allowFileAccess
        scrollEnabled={false}
        onLoad={handleWebViewLoad} // ← triggers photo injection
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg.type === "select") console.log("Tapped student:", msg.id);
          } catch (_) {}
        }}
        onError={(e) => console.error("WebView error:", e.nativeEvent)}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <LottieView
              source={require("../../assets/loader/circleLoader.json")}
              autoPlay
              loop
              style={styles.lottie}
            />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
        startInLoadingState
      />

    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  lottie: { width: 150, height: 150 },
  loadingText: {
    fontFamily: "Roboto-Medium",
    color: COLORS.primary,
    fontSize: 16,
    marginTop: -20,
  },
  header: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    zIndex: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  backBtn: { padding: 5, marginRight: 10 },
  headerTitle: {
    fontFamily: "Roboto-Bold",
    fontSize: 20,
    color: COLORS.white,
    flex: 1,
  },
});