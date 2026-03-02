// ============================================================
// FILE 1: AddLocationPage.jsx
// Interactive Leaflet map – pan to pick location
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import * as Network from "expo-network";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import { useContext } from "react";
import { StudentFormContext } from "../context/StudentFormContext";

// Leaflet HTML – map moves, crosshair stays fixed, postMessage on moveend
const interactiveMapHTML = (lat, lon) => `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  #map{width:100vw;height:100vh}
  #crosshair{
    position:fixed;top:50%;left:50%;
    transform:translate(-50%,-50%);
    z-index:9999;pointer-events:none;
    display:flex;flex-direction:column;align-items:center;
  }
  #crosshair .outer{
    width:22px;height:22px;border-radius:50%;
    background:#fff;border:2px solid #07575B;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,0.35);
  }
  #crosshair .inner{width:12px;height:12px;border-radius:50%;background:#4285F4}
  #crosshair .pulse{
    width:60px;height:60px;border-radius:50%;
    border:2px solid rgba(66,133,244,0.4);
    position:absolute;top:50%;left:50%;
    transform:translate(-50%,-50%);
  }
  #coords{
    position:fixed;bottom:100px;left:50%;transform:translateX(-50%);
    background:rgba(255,255,255,0.93);padding:6px 14px;
    border-radius:20px;font-family:sans-serif;font-size:12px;
    color:#07575B;z-index:999;box-shadow:0 1px 4px rgba(0,0,0,0.2);
    white-space:nowrap;
  }
</style>
</head><body>
<div id="map"></div>
<div id="crosshair"><div class="pulse"></div><div class="outer"><div class="inner"></div></div></div>
<div id="coords">Move map to select location</div>
<script>
var map=L.map('map',{zoomControl:true}).setView([${lat},${lon}],16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:''}).addTo(map);
var coordEl=document.getElementById('coords');

function sendCenter(){
  var c=map.getCenter();
  coordEl.textContent=c.lat.toFixed(5)+', '+c.lng.toFixed(5);
  window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(
    JSON.stringify({type:'center',lat:c.lat,lon:c.lng})
  );
}

map.on('moveend',sendCenter);
sendCenter();

// Listen for "flyTo" commands from React Native
document.addEventListener('message',function(e){handleCmd(e.data)});
window.addEventListener('message',function(e){handleCmd(e.data)});
function handleCmd(raw){
  try{
    var d=JSON.parse(raw);
    if(d.type==='flyTo') map.flyTo([d.lat,d.lon],16,{animate:true,duration:1});
  }catch(e){}
}
</script></body></html>`;

export default function AddLocationPage({ navigation }) {
  const webViewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const { updateFormData } = useContext(StudentFormContext);

  // currentCoords tracks what the map center is (updated via postMessage)
  const currentCoords = useRef({ lat: 13.0145, lon: 80.2234 });
  const [initCoords, setInitCoords] = useState({ lat: 13.0145, lon: 80.2234 });
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const net = await Network.getNetworkStateAsync();
        if (!net.isConnected) {
          Alert.alert("No Internet", "Connect to the internet to load maps.");
          setIsLoading(false);
          return;
        }
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Using default location.");
          setIsLoading(false);
          return;
        }
        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = { lat: loc.coords.latitude, lon: loc.coords.longitude };
        currentCoords.current = coords;
        setInitCoords(coords);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Called when WebView posts the map center after each drag
  const handleMessage = (e) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === "center") {
        currentCoords.current = { lat: msg.lat, lon: msg.lon };
      }
    } catch (_) {}
  };

  // "Locate Me" – get device location and tell Leaflet to flyTo
  const handleLocateMe = async () => {
    try {
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude: lat, longitude: lon } = loc.coords;
      currentCoords.current = { lat, lon };
      webViewRef.current?.injectJavaScript(
        `handleCmd(JSON.stringify({type:'flyTo',lat:${lat},lon:${lon}}));true;`,
      );
    } catch (_) {
      Alert.alert("Location Issue", "Could not fetch current location.");
    }
  };

  // Confirm: reverse-geocode the crosshair center, save to context
  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const { lat, lon } = currentCoords.current;
      const geocode = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lon,
      });
      let address = "Unknown Location";
      if (geocode.length > 0) {
        const p = geocode[0];
        address = [
          p.streetNumber,
          p.street,
          p.city || p.subregion,
          p.region,
          p.postalCode,
        ]
          .filter(Boolean)
          .join(", ");
      }
      updateFormData("location", { lat, lng: lon, address });
      navigation.goBack();
    } catch (_) {
      Alert.alert("Coordinate Issue", "Could not process location.");
    } finally {
      setConfirming(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Fetching Location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
            {/* Map */}
      <View style={styles.mapWrapper}>
        <WebView
          ref={webViewRef}
          source={{ html: interactiveMapHTML(initCoords.lat, initCoords.lon) }}
          style={StyleSheet.absoluteFillObject}
          onMessage={handleMessage}
          javaScriptEnabled
          originWhitelist={["*"]}
          scrollEnabled={false}
        />

        {/* Locate Me FAB */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fabWhite}
            onPress={handleLocateMe}
            activeOpacity={0.8}
          >
            <MaterialIcons name="my-location" size={24} color="#4285F4" />
          </TouchableOpacity>
        </View>

        {/* Confirm button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirm}
            activeOpacity={0.9}
          >
            {confirming ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons
                  name="location"
                  size={20}
                  color={COLORS.white}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.addLocationtext}>Add LOCATION</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  loadingText: {
    fontFamily: "Roboto-Regular",
    marginTop: 15,
    color: COLORS.primary,
    fontSize: 16,
  },
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontFamily: "Roboto-Regular",
    fontSize: 20,
    color: COLORS.white,
  },
  iconBtn: { padding: 5, width: 36 },
  mapWrapper: { flex: 1, position: "relative" },
  fabContainer: { position: "absolute", right: 15, bottom: 110 },
  fabWhite: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  bottomContainer: { position: "absolute", bottom: 28, left: 20, right: 20 },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  addLocationtext: {
    fontFamily: "Roboto-Regular",
    color: COLORS.white,
    fontSize: 16,
    letterSpacing: 1,
  },
});
