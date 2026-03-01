// import React, { useState, useCallback, useRef } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   Image,
//   TouchableOpacity,
//   Platform,
//   StatusBar,
//   Alert,
// } from "react-native";
// import MapView, { Marker, UrlTile } from "react-native-maps";
// import { useFocusEffect } from "@react-navigation/native";
// import LottieView from "lottie-react-native";
// import { Ionicons } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { SafeAreaProvider } from "react-native-safe-area-context";
// import * as Location from "expo-location";
// import * as Network from "expo-network";

// import db from "../database/database";
// import { COLORS } from "../theme/colors";

// export default function MapViewPage({ navigation }) {
//   const mapRef = useRef(null);
//   const [students, setStudents] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [loadingText, setLoadingText] = useState("Initializing...");
//   const [selectedStudentId, setSelectedStudentId] = useState(null);

//   // Default fallback region
//   const [region, setRegion] = useState({
//     latitude: 13.0145,
//     longitude: 80.2234,
//     latitudeDelta: 0.05,
//     longitudeDelta: 0.05,
//   });

//   useFocusEffect(
//     useCallback(() => {
//       initializeMapPage();
//     }, []),
//   );

//   const initializeMapPage = async () => {
//     setIsLoading(true);
//     try {
//       // 1. Authentication Check
//       setLoadingText("Authenticating...");
//       const token = await AsyncStorage.getItem("userToken");
//       if (!token) {
//         navigation.reset({ index: 0, routes: [{ name: "Login" }] });
//         return;
//       }

//       // 2. Network Check
//       setLoadingText("Checking Network...");
//       const networkState = await Network.getNetworkStateAsync();
//       if (!networkState.isConnected) {
//         Alert.alert(
//           "No Internet",
//           "Please connect to the internet to load the maps.",
//           [{ text: "Go Back", onPress: () => navigation.goBack() }],
//         );
//         setIsLoading(false);
//         return;
//       }

//       // 3. Location Permission Check
//       setLoadingText("Checking Permissions...");
//       let { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") {
//         // We don't block them from seeing the map, but we warn them.
//         Alert.alert(
//           "Permission Denied",
//           "Location access was denied. Map will center on a default location.",
//         );
//       }

//       // 4. Fetch Active Students with Coordinates
//       setLoadingText("Fetching Students...");
//       const result = db.getAllSync(`
//         SELECT
//           student_id,
//           student_name,
//           student_picture_uri,
//           student_location_lat,
//           student_location_lon
//         FROM students
//         WHERE student_is_active = 1
//           AND student_location_lat IS NOT NULL
//           AND student_location_lon IS NOT NULL
//       `);

//       setStudents(result);

//       // 5. Dynamic Map Bounds Calculation
//       if (result.length > 0) {
//         const coordinates = result.map((student) => ({
//           latitude: student.student_location_lat,
//           longitude: student.student_location_lon,
//         }));

//         setTimeout(() => {
//           mapRef.current?.fitToCoordinates(coordinates, {
//             edgePadding: { top: 120, right: 50, bottom: 50, left: 50 },
//             animated: true,
//           });
//         }, 600);
//       } else if (status === "granted") {
//         // If no students exist, but they granted permission, center on *their* location
//         let userLocation = await Location.getCurrentPositionAsync({
//           accuracy: Location.Accuracy.Balanced,
//         });
//         setRegion({
//           latitude: userLocation.coords.latitude,
//           longitude: userLocation.coords.longitude,
//           latitudeDelta: 0.05,
//           longitudeDelta: 0.05,
//         });
//       }
//     } catch (error) {
//       console.error("Failed to initialize map page:", error);
//       Alert.alert("Error", "Could not load map data.");
//     } finally {
//       setTimeout(() => {
//         setIsLoading(false);
//       }, 800);
//     }
//   };

//   const handleMarkerPress = (studentId, lat, lon) => {
//     setSelectedStudentId(studentId);
//     mapRef.current?.animateToRegion(
//       {
//         latitude: lat,
//         longitude: lon,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       },
//       500,
//     );
//   };

//   // ==========================================
//   // LOTTIE LOADING SCREEN
//   // ==========================================
//   if (isLoading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <LottieView
//           source={require("../../assets/loader/circleLoader.json")}
//           autoPlay
//           loop
//           style={styles.lottieLoader}
//         />
//         <Text style={styles.loadingText}>{loadingText}</Text>
//       </View>
//     );
//   }

//   return (
//     <SafeAreaProvider style={styles.container}>
//       <MapView
//         ref={mapRef}
//         style={styles.map}
//         initialRegion={region}
//         mapType="none"
//         onPress={() => setSelectedStudentId(null)}
//       >
//         <UrlTile
//           urlTemplate="https://a.tile.openstreetmap.de/{z}/{x}/{y}.png"
//           maximumZ={19}
//           flipY={false}
//         />

//         {/* Render Dynamic Markers */}
//         {students.map((student) => {
//           const isSelected = selectedStudentId === student.student_id;

//           return (
//             <Marker
//               key={student.student_id}
//               coordinate={{
//                 latitude: student.student_location_lat,
//                 longitude: student.student_location_lon,
//               }}
//               onPress={(e) => {
//                 e.stopPropagation();
//                 handleMarkerPress(
//                   student.student_id,
//                   student.student_location_lat,
//                   student.student_location_lon,
//                 );
//               }}
//               zIndex={isSelected ? 100 : 1}
//             >
//               <View style={{ alignItems: "center" }}>
//                 <View
//                   style={[
//                     styles.markerWrapper,
//                     isSelected && styles.markerWrapperSelected,
//                   ]}
//                 >
//                   <Image
//                     source={
//                       student.student_picture_uri
//                         ? { uri: student.student_picture_uri }
//                         : require("../../assets/Images/profileIcon.png")
//                     }
//                     style={[
//                       styles.markerImage,
//                       isSelected && styles.markerImageSelected,
//                     ]}
//                   />

//                   {isSelected && (
//                     <Text style={styles.markerText} numberOfLines={1}>
//                       {student.student_name}
//                     </Text>
//                   )}
//                 </View>
//                 <View
//                   style={[
//                     styles.markerPointer,
//                     isSelected && styles.markerPointerSelected,
//                   ]}
//                 />
//               </View>
//             </Marker>
//           );
//         })}
//       </MapView>
//     </SafeAreaProvider>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.white,
//   },
//   loadingContainer: {
//     flex: 1,
//     backgroundColor: COLORS.white,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   lottieLoader: {
//     width: 150,
//     height: 150,
//   },
//   loadingText: {
//     fontFamily: "Roboto-Medium",
//     color: COLORS.primary,
//     fontSize: 16,
//     marginTop: -20,
//   },
//   /* --- Floating Header --- */
//   header: {
//     position: "absolute",
//     top: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
//     left: 0,
//     right: 0,
//     height: 60,
//     backgroundColor: COLORS.primary,
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 15,
//     zIndex: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 5,
//     elevation: 8,
//   },
//   backButton: {
//     padding: 5,
//     marginRight: 15,
//   },
//   headerTitle: {
//     fontFamily: "Roboto-Bold",
//     fontSize: 20,
//     color: COLORS.white,
//   },
//   /* --- Map --- */
//   map: {
//     ...StyleSheet.absoluteFillObject,
//   },
//   /* --- Custom Marker Styles --- */
//   markerWrapper: {
//     backgroundColor: COLORS.white,
//     padding: 3,
//     borderRadius: 25,
//     borderWidth: 2,
//     borderColor: "#8CAEAE",
//     flexDirection: "row",
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 3,
//     elevation: 4,
//   },
//   markerWrapperSelected: {
//     paddingRight: 15,
//     borderRadius: 30,
//     backgroundColor: "#CDE1E2",
//     borderColor: "#CDE1E2",
//   },
//   markerImage: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     resizeMode: "cover",
//   },
//   markerImageSelected: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     borderWidth: 2,
//     borderColor: COLORS.white,
//   },
//   markerText: {
//     fontFamily: "Roboto-Regular",
//     color: COLORS.darkest,
//     fontSize: 16,
//     marginLeft: 10,
//     maxWidth: 120,
//   },
//   markerPointer: {
//     width: 0,
//     height: 0,
//     backgroundColor: "transparent",
//     borderStyle: "solid",
//     borderLeftWidth: 8,
//     borderRightWidth: 8,
//     borderTopWidth: 10,
//     borderLeftColor: "transparent",
//     borderRightColor: "transparent",
//     borderTopColor: "#8CAEAE",
//     marginTop: -2,
//   },
//   markerPointerSelected: {
//     borderTopColor: "#CDE1E2",
//   },
// });

// import React, { useState, useCallback, useRef } from "react";
// import {
//   View, Text, StyleSheet, TouchableOpacity,
//   Platform, StatusBar, Alert,
// } from "react-native";
// import { WebView } from "react-native-webview";
// import { useFocusEffect } from "@react-navigation/native";
// import LottieView from "lottie-react-native";
// import { Ionicons } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { SafeAreaProvider } from "react-native-safe-area-context";
// import * as Network from "expo-network";

// import db from "../database/database";
// import { COLORS } from "../theme/colors";

// // Build the full Leaflet HTML with all student data baked in
// const buildMapHTML = (students, highlightId) => {
//   // Escape for safe JSON embedding
//   const safeStudents = students.map(s => ({
//     id: s.student_id,
//     name: s.student_name,
//     lat: s.student_location_lat,
//     lon: s.student_location_lon,
//     // picture URI already a base64 string or remote URI
//     pic: s.student_picture_uri || "",
//   }));

//   const studentsJSON = JSON.stringify(safeStudents);
//   const highlightJSON = JSON.stringify(highlightId);

//   return `<!DOCTYPE html>
// <html><head>
// <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
// <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
// <style>
// *{margin:0;padding:0;box-sizing:border-box}
// #map{width:100vw;height:100vh}

// /* Marker wrapper */
// .mk-wrap{display:flex;flex-direction:column;align-items:center;cursor:pointer}

// /* Bubble: idle state */
// .mk-bubble{
//   display:flex;align-items:center;
//   background:#fff;border:2.5px solid #07575B;border-radius:30px;
//   padding:3px;
//   box-shadow:0 3px 8px rgba(0,0,0,0.3);
//   transition:all .2s ease;
// }
// .mk-bubble img{
//   width:42px;height:42px;border-radius:50%;object-fit:cover;
//   background:#cde1e2;
// }

// /* Bubble: selected state */
// .mk-bubble.sel{
//   background:#CDE1E2;border-color:#07575B;padding-right:12px;
// }
// .mk-bubble.sel img{
//   width:52px;height:52px;border:2.5px solid #fff;
// }
// .mk-name{
//   font-family:sans-serif;font-size:14px;font-weight:700;
//   color:#07575B;margin-left:9px;white-space:nowrap;
//   max-width:130px;overflow:hidden;text-overflow:ellipsis;
//   display:none;
// }
// .mk-bubble.sel .mk-name{display:block}

// /* Pin triangle */
// .mk-pin{
//   width:0;height:0;
//   border-left:9px solid transparent;
//   border-right:9px solid transparent;
//   border-top:12px solid #07575B;
//   margin-top:-2px;
// }
// .mk-bubble.sel~.mk-pin{border-top-color:#07575B}
// </style>
// </head><body>
// <div id="map"></div>
// <script>
// (function(){
//   var students=${studentsJSON};
//   var highlightId=${highlightJSON};
//   var selectedId=null;
//   var markerMap={};

//   var map=L.map('map',{zoomControl:true}).setView([13.0145,80.2234],13);
//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
//     {maxZoom:19,attribution:''}).addTo(map);

//   function makeIcon(s,sel){
//     var nameHtml=sel?('<span class="mk-name">'+s.name+'</span>'):'';
//     // estimate width
//     var bw=sel?(52+6+Math.min(s.name.length*8,130)+24):50;
//     var html='<div class="mk-wrap">'
//       +'<div class="mk-bubble'+(sel?' sel':'')+'"><img src="'+s.pic+'" onerror="this.style.background=\'#cde1e2\'"/>'+nameHtml+'</div>'
//       +'<div class="mk-pin"></div></div>';
//     return L.divIcon({html:html,className:'',iconSize:[bw,70],iconAnchor:[bw/2,68]});
//   }

//   function select(id){
//     // deselect previous
//     if(selectedId!==null&&markerMap[selectedId]){
//       var prev=students.find(function(s){return s.id===selectedId});
//       if(prev){markerMap[selectedId].setIcon(makeIcon(prev,false));markerMap[selectedId].setZIndexOffset(1)}
//     }
//     if(selectedId===id){selectedId=null;return}
//     selectedId=id;
//     var s=students.find(function(s){return s.id===id});
//     if(s&&markerMap[id]){
//       markerMap[id].setIcon(makeIcon(s,true));
//       markerMap[id].setZIndexOffset(1000);
//       map.panTo([s.lat,s.lon],{animate:true,duration:.5});
//     }
//     window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'select',id:id}));
//   }

//   var bounds=[];
//   students.forEach(function(s){
//     var isSel=(s.id===highlightId);
//     var m=L.marker([s.lat,s.lon],{icon:makeIcon(s,isSel),zIndexOffset:isSel?1000:1});
//     m.on('click',function(e){e.originalEvent.stopPropagation();select(s.id)});
//     m.addTo(map);
//     markerMap[s.id]=m;
//     bounds.push([s.lat,s.lon]);
//     if(isSel)selectedId=s.id;
//   });

//   if(bounds.length>0){
//     map.fitBounds(bounds,{padding:[80,50]});
//     if(highlightId){
//       var hs=students.find(function(s){return s.id===highlightId});
//       if(hs)setTimeout(function(){map.panTo([hs.lat,hs.lon],{animate:true})},900);
//     }
//   }

//   map.on('click',function(){
//     if(selectedId!==null){
//       var prev=students.find(function(s){return s.id===selectedId});
//       if(prev){markerMap[selectedId].setIcon(makeIcon(prev,false));markerMap[selectedId].setZIndexOffset(1)}
//       selectedId=null;
//     }
//   });
// })();
// </script></body></html>`;
// };

// export default function MapViewPage({ route, navigation }) {
//   const [students, setStudents] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [loadingText, setLoadingText] = useState("Initializing...");
//   const highlightId = route?.params?.highlightStudentId ?? null;

//   useFocusEffect(
//     useCallback(() => {
//       initializePage();
//     }, [])
//   );

//   const initializePage = async () => {
//     setIsLoading(true);
//     try {
//       setLoadingText("Authenticating...");
//       const token = await AsyncStorage.getItem("userToken");
//       if (!token) { navigation.reset({ index: 0, routes: [{ name: "Login" }] }); return; }

//       setLoadingText("Checking Network...");
//       const net = await Network.getNetworkStateAsync();
//       if (!net.isConnected) {
//         Alert.alert("No Internet", "Connect to load the map.", [{ text: "Go Back", onPress: () => navigation.goBack() }]);
//         setIsLoading(false);
//         return;
//       }

//       setLoadingText("Loading Students...");
//       const result = db.getAllSync(`
//         SELECT student_id, student_name, student_picture_uri,
//                student_location_lat, student_location_lon
//         FROM students
//         WHERE student_is_active = 1
//           AND student_location_lat IS NOT NULL
//           AND student_location_lon IS NOT NULL
//       `);
//       setStudents(result);
//     } catch (e) {
//       console.error(e);
//       Alert.alert("Error", "Could not load map data.");
//     } finally {
//       setTimeout(() => setIsLoading(false), 600);
//     }
//   };

//   if (isLoading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <LottieView
//           source={require("../../assets/loader/circleLoader.json")}
//           autoPlay loop style={styles.lottie}
//         />
//         <Text style={styles.loadingText}>{loadingText}</Text>
//       </View>
//     );
//   }

//   return (
//     <SafeAreaProvider style={styles.container}>
//       {/* Full-screen Leaflet map */}
//       <WebView
//         source={{ html: buildMapHTML(students, highlightId) }}
//         style={StyleSheet.absoluteFillObject}
//         javaScriptEnabled
//         originWhitelist={["*"]}
//         scrollEnabled={false}
//         // onMessage can be used later for navigation on marker press
//         onMessage={(e) => {
//           try {
//             const msg = JSON.parse(e.nativeEvent.data);
//             console.log("Marker selected:", msg.id);
//           } catch (_) {}
//         }}
//       />

//     </SafeAreaProvider>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.white },
//   lottie: { width: 150, height: 150 },
//   loadingText: { fontFamily: "Roboto-Medium", color: COLORS.primary, fontSize: 16, marginTop: -20 },
//   header: {
//     position: "absolute",
//     top: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
//     left: 0, right: 0, height: 60,
//     backgroundColor: COLORS.primary,
//     flexDirection: "row", alignItems: "center",
//     paddingHorizontal: 15, zIndex: 10,
//     elevation: 8, shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.25, shadowRadius: 5,
//   },
//   backBtn: { padding: 5, marginRight: 10 },
//   headerTitle: { fontFamily: "Roboto-Bold", fontSize: 20, color: COLORS.white, flex: 1 },
// });

// import React, { useState, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Platform,
//   StatusBar,
//   Alert,
// } from "react-native";
// import { WebView } from "react-native-webview";
// import { useFocusEffect } from "@react-navigation/native";
// import LottieView from "lottie-react-native";
// import { Ionicons } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { SafeAreaProvider } from "react-native-safe-area-context";
// import * as Network from "expo-network";

// import db from "../database/database";
// import { COLORS } from "../theme/colors";

// // ─────────────────────────────────────────────────────────────
// //  HTML builder – Leaflet loaded from CDN with a valid baseUrl
// //  so Android WebView grants network access
// // ─────────────────────────────────────────────────────────────
// const buildMapHTML = (students, highlightId) => {
//   const safe = students.map((s) => ({
//     id: s.student_id,
//     name: s.student_name,
//     lat: s.student_location_lat,
//     lon: s.student_location_lon,
//     pic: s.student_picture_uri || "",
//   }));

//   return `<!DOCTYPE html>
// <html>
// <head>
//   <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
//   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
//   <style>
//     * { margin:0; padding:0; box-sizing:border-box }
//     html, body, #map { width:100%; height:100%; overflow:hidden }

//     /* ── idle marker ── */
//     .mk { display:flex; flex-direction:column; align-items:center }
//     .mk-bubble {
//       display:flex; align-items:center;
//       background:#fff; border:2.5px solid #07575B; border-radius:30px;
//       padding:3px;
//       box-shadow:0 3px 10px rgba(0,0,0,0.28);
//       transition:all .18s ease;
//     }
//     .mk-bubble img {
//       width:44px; height:44px; border-radius:50%;
//       object-fit:cover; background:#cde1e2; flex-shrink:0;
//     }
//     .mk-pin {
//       width:0; height:0;
//       border-left:9px solid transparent;
//       border-right:9px solid transparent;
//       border-top:13px solid #07575B;
//       margin-top:-1px;
//     }

//     /* ── selected marker ── */
//     .mk-bubble.sel {
//       background:#CDE1E2; border-color:#07575B;
//       padding-right:13px;
//     }
//     .mk-bubble.sel img {
//       width:54px; height:54px;
//       border:2.5px solid #fff;
//     }
//     .mk-name {
//       display:none;
//       font-family:sans-serif; font-size:14px; font-weight:700;
//       color:#07575B; margin-left:9px;
//       white-space:nowrap; max-width:140px;
//       overflow:hidden; text-overflow:ellipsis;
//     }
//     .mk-bubble.sel .mk-name { display:block }
//   </style>
// </head>
// <body>
//   <div id="map"></div>
//   <script>
//   (function(){
//     var students = ${JSON.stringify(safe)};
//     var highlightId = ${JSON.stringify(highlightId)};
//     var selectedId = null;
//     var markers = {};

//     // default centre = centroid of all students (or Chennai fallback)
//     var defLat = 13.0145, defLon = 80.2234;
//     if(students.length){
//       defLat = students.reduce(function(a,s){return a+s.lat},0)/students.length;
//       defLon = students.reduce(function(a,s){return a+s.lon},0)/students.length;
//     }

//     var map = L.map('map', { zoomControl:true, attributionControl:false })
//                .setView([defLat, defLon], 13);

//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
//       { maxZoom:19 }).addTo(map);

//     /* Build a DivIcon for a student */
//     function mkIcon(s, sel){
//       var nm   = sel ? '<span class="mk-name">' + s.name + '</span>' : '';
//       var imgW = sel ? 54 : 44;
//       var bubW = sel ? (imgW + 6 + Math.min(s.name.length * 8, 140) + 26) : (imgW + 6);
//       var html = '<div class="mk">'
//         + '<div class="mk-bubble' + (sel?' sel':'') + '">'
//         +   '<img src="' + s.pic + '" onerror="this.src=\'\'"/>'
//         +   nm
//         + '</div>'
//         + '<div class="mk-pin"></div>'
//         + '</div>';
//       return L.divIcon({
//         html: html, className: '',
//         iconSize:   [bubW, 72],
//         iconAnchor: [bubW / 2, 70]
//       });
//     }

//     /* Select / deselect a marker */
//     function select(id){
//       // collapse previous
//       if(selectedId !== null && markers[selectedId]){
//         var prev = students.find(function(s){return s.id===selectedId});
//         if(prev){ markers[selectedId].setIcon(mkIcon(prev,false)); markers[selectedId].setZIndexOffset(1); }
//       }
//       // toggle off if same
//       if(selectedId === id){ selectedId = null; return; }

//       selectedId = id;
//       var s = students.find(function(s){return s.id===id});
//       if(s && markers[id]){
//         markers[id].setIcon(mkIcon(s, true));
//         markers[id].setZIndexOffset(1000);
//         map.panTo([s.lat, s.lon], {animate:true, duration:.5});
//       }
//       // tell React Native which student is selected
//       window.ReactNativeWebView &&
//         window.ReactNativeWebView.postMessage(JSON.stringify({type:'select', id:id}));
//     }

//     /* Create markers */
//     var latlngs = [];
//     students.forEach(function(s){
//       var isSel = (s.id === highlightId);
//       var m = L.marker([s.lat, s.lon], {
//         icon: mkIcon(s, isSel),
//         zIndexOffset: isSel ? 1000 : 1
//       });
//       m.on('click', function(e){
//         L.DomEvent.stopPropagation(e);
//         select(s.id);
//       });
//       m.addTo(map);
//       markers[s.id] = m;
//       latlngs.push([s.lat, s.lon]);
//       if(isSel) selectedId = s.id;
//     });

//     /* Fit all markers into view */
//     if(latlngs.length === 1){
//       map.setView(latlngs[0], 15);
//     } else if(latlngs.length > 1){
//       map.fitBounds(latlngs, { padding:[80,60] });
//     }

//     /* If a highlight was requested, pan to it after fit */
//     if(highlightId){
//       var hs = students.find(function(s){return s.id===highlightId});
//       if(hs) setTimeout(function(){
//         map.setView([hs.lat, hs.lon], 15, {animate:true});
//       }, 900);
//     }

//     /* Tap on empty map → deselect */
//     map.on('click', function(){
//       if(selectedId !== null){
//         var prev = students.find(function(s){return s.id===selectedId});
//         if(prev){ markers[selectedId].setIcon(mkIcon(prev,false)); markers[selectedId].setZIndexOffset(1); }
//         selectedId = null;
//       }
//     });
//   })();
//   </script>
// </body>
// </html>`;
// };

// // ─────────────────────────────────────────────────────────────
// //  Component
// // ─────────────────────────────────────────────────────────────
// export default function MapViewPage({ route, navigation }) {
//   const [students, setStudents] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [loadingText, setLoadingText] = useState("Initializing...");

//   // highlightStudentId may come from ViewStudentDetailPage
//   const highlightId = route?.params?.highlightStudentId ?? null;

//   useFocusEffect(
//     useCallback(() => {
//       initializePage();
//     }, []),
//   );

//   const initializePage = async () => {
//     setIsLoading(true);
//     try {
//       setLoadingText("Authenticating...");
//       const token = await AsyncStorage.getItem("userToken");
//       if (!token) {
//         navigation.reset({ index: 0, routes: [{ name: "Login" }] });
//         return;
//       }

//       setLoadingText("Checking network...");
//       const net = await Network.getNetworkStateAsync();
//       if (!net.isConnected) {
//         Alert.alert(
//           "No Internet",
//           "An internet connection is required to load the map.",
//           [{ text: "Go Back", onPress: () => navigation.goBack() }],
//         );
//         setIsLoading(false);
//         return;
//       }

//       setLoadingText("Loading students...");
//       const rows = db.getAllSync(`
//         SELECT student_id, student_name, student_picture_uri,
//                student_location_lat, student_location_lon
//         FROM   students
//         WHERE  student_is_active = 1
//           AND  student_location_lat  IS NOT NULL
//           AND  student_location_lon  IS NOT NULL
//       `);
//       setStudents(rows);
//     } catch (err) {
//       console.error("MapViewPage init error:", err);
//       Alert.alert("Error", "Could not load student data.");
//     } finally {
//       setTimeout(() => setIsLoading(false), 500);
//     }
//   };

//   // ── Loading screen ──────────────────────────────────────────
//   if (isLoading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <LottieView
//           source={require("../../assets/loader/circleLoader.json")}
//           autoPlay
//           loop
//           style={styles.lottie}
//         />
//         <Text style={styles.loadingText}>{loadingText}</Text>
//       </View>
//     );
//   }

//   // ── No students ─────────────────────────────────────────────
//   if (students.length === 0) {
//     return (
//       <SafeAreaProvider style={styles.emptyContainer}>
//         <View style={styles.header}>
//           <TouchableOpacity
//             style={styles.backBtn}
//             onPress={() => navigation.goBack()}
//           >
//             <Ionicons name="arrow-back" size={26} color={COLORS.white} />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Map View</Text>
//           <View style={{ width: 36 }} />
//         </View>
//         <View style={styles.emptyBody}>
//           <Ionicons name="map-outline" size={60} color="#cde1e2" />
//           <Text style={styles.emptyText}>
//             No students with saved locations yet.
//           </Text>
//         </View>
//       </SafeAreaProvider>
//     );
//   }

//   // ── Main map ────────────────────────────────────────────────
//   return (
//     <SafeAreaProvider style={styles.container}>
//       {/*
//         KEY FIX:
//         ─────────────────────────────────────────────────────────
//         1. baseUrl="https://leafletjs.com"
//            Gives the Android WebView a real HTTPS origin so it
//            allows outbound network requests (CDN CSS/JS + OSM tiles).
//            Without this, the HTML string has "null" origin and Android
//            blocks all external fetches → blank white screen.

//         2. mixedContentMode="always"
//            Allows http tile URLs inside an https context (OSM uses http
//            sub-domains on some Android versions).

//         3. allowUniversalAccessFromFileURLs + allowFileAccess
//            Required on older Android WebView versions so the JS can
//            run normally even when loaded from a string source.
//         ─────────────────────────────────────────────────────────
//       */}
//       <WebView
//         source={{
//           html: buildMapHTML(students, highlightId),
//           baseUrl: "https://leafletjs.com", // ← THE KEY FIX
//         }}
//         style={StyleSheet.absoluteFillObject}
//         javaScriptEnabled
//         domStorageEnabled
//         originWhitelist={["*"]}
//         mixedContentMode="always"
//         allowUniversalAccessFromFileURLs
//         allowFileAccess
//         scrollEnabled={false}
//         onMessage={(e) => {
//           try {
//             const msg = JSON.parse(e.nativeEvent.data);
//             if (msg.type === "select") {
//               console.log("Selected student id:", msg.id);
//             }
//           } catch (_) {}
//         }}
//         onError={(e) => console.error("WebView error:", e.nativeEvent)}
//         renderLoading={() => (
//           <View style={styles.loadingContainer}>
//             <LottieView
//               source={require("../../assets/loader/circleLoader.json")}
//               autoPlay
//               loop
//               style={styles.lottie}
//             />
//             <Text style={styles.loadingText}>Loading map...</Text>
//           </View>
//         )}
//         startInLoadingState
//       />

//       {/* Native header floats ABOVE the WebView */}
//       {/* <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.backBtn}
//           onPress={() => navigation.goBack()}
//         >
//           <Ionicons name="arrow-back" size={26} color={COLORS.white} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Map View</Text>
//         <View style={{ width: 36 }} />
//       </View> */}
//     </SafeAreaProvider>
//   );
// }

// // ─────────────────────────────────────────────────────────────
// //  Styles
// // ─────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: COLORS.white,
//   },
//   lottie: { width: 150, height: 150 },
//   loadingText: {
//     fontFamily: "Roboto-Medium",
//     color: COLORS.primary,
//     fontSize: 16,
//     marginTop: -20,
//   },
//   emptyContainer: { flex: 1, backgroundColor: COLORS.white },
//   emptyBody: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     gap: 14,
//   },
//   emptyText: { fontFamily: "Roboto-Regular", color: "#8CAEAE", fontSize: 15 },

//   /* Floating native header rendered on top of the WebView */
//   header: {
//     position: "absolute",
//     top: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
//     left: 0,
//     right: 0,
//     height: 60,
//     backgroundColor: COLORS.primary,
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 15,
//     zIndex: 10,
//     elevation: 8,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.25,
//     shadowRadius: 5,
//   },
//   backBtn: { padding: 5, marginRight: 10 },
//   headerTitle: {
//     fontFamily: "Roboto-Bold",
//     fontSize: 20,
//     color: COLORS.white,
//     flex: 1,
//   },
// });

// ─── STEP 1: Install if not already present ───────────────────
// npx expo install expo-file-system
// ──────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from "react";
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
// Deterministic colour from student name (keeps marker colours
// consistent across re-renders without any image data)
// ─────────────────────────────────────────────────────────────
const PALETTE = [
  "#07575B",
  "#C4DFE6",
  "#66A5AD",
  "#003B46",
  "#1B6CA8",
  "#2E8B57",
  "#8B4513",
  "#6A0572",
];
function colorFromName(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}
function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

// ─────────────────────────────────────────────────────────────
// HTML builder  –  NO base64 images, only name/coords/color
// Same source={{ html }} pattern used by other working pages
// ─────────────────────────────────────────────────────────────
const buildMapHTML = (students, highlightId) => {
  // Strip picture URI completely – only pass what's needed
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

    /* avatar circle */
    .mk-avatar{
      width:46px;height:46px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      border:3px solid #fff;
      box-shadow:0 3px 10px rgba(0,0,0,0.3);
      font-family:sans-serif;font-size:15px;font-weight:700;color:#fff;
      flex-shrink:0;
    }
    /* pin */
    .mk-pin{
      width:0;height:0;
      border-left:8px solid transparent;
      border-right:8px solid transparent;
      border-top:12px solid #fff;
      margin-top:-2px;
      filter:drop-shadow(0 2px 2px rgba(0,0,0,0.25));
    }

    /* bubble wrapper (idle) */
    .mk-bubble{
      display:flex;align-items:center;
      background:#fff;
      border-radius:30px;
      padding:3px;
      box-shadow:0 3px 10px rgba(0,0,0,0.28);
    }
    /* name label (hidden when idle) */
    .mk-label{
      display:none;
      font-family:sans-serif;font-size:13px;font-weight:700;
      color:#07575B;margin-left:8px;padding-right:10px;
      white-space:nowrap;max-width:130px;
      overflow:hidden;text-overflow:ellipsis;
    }

    /* selected */
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
  var markers     = {};

  var defLat = 13.0145, defLon = 80.2234;
  if(students.length){
    defLat = students.reduce(function(a,s){return a+s.lat},0)/students.length;
    defLon = students.reduce(function(a,s){return a+s.lon},0)/students.length;
  }

  var map = L.map('map',{zoomControl:true,attributionControl:false})
             .setView([defLat,defLon],13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {maxZoom:19}).addTo(map);

  function mkIcon(s, sel){
    var sz   = sel ? 54 : 46;
    var bubW = sel ? (sz + 6 + Math.min(s.name.length*8,130) + 20) : (sz + 6);
    var label = sel ? '<span class="mk-label">'+s.name+'</span>' : '';
    var html  =
      '<div class="mk">'
      +'<div class="mk-bubble'+(sel?' sel':'')+'"><div class="mk-avatar" style="background:'+s.color+';width:'+sz+'px;height:'+sz+'px">'+s.init+'</div>'+label+'</div>'
      +'<div class="mk-pin" style="border-top-color:'+(sel?'#CDE1E2':'#fff')+'"></div>'
      +'</div>';
    return L.divIcon({html:html,className:'',iconSize:[bubW,74],iconAnchor:[bubW/2,72]});
  }

  function select(id){
    if(selectedId!==null && markers[selectedId]){
      var p=students.find(function(s){return s.id===selectedId});
      if(p){markers[selectedId].setIcon(mkIcon(p,false));markers[selectedId].setZIndexOffset(1);}
    }
    if(selectedId===id){selectedId=null;return;}
    selectedId=id;
    var s=students.find(function(s){return s.id===id});
    if(s && markers[id]){
      markers[id].setIcon(mkIcon(s,true));
      markers[id].setZIndexOffset(1000);
      map.panTo([s.lat,s.lon],{animate:true,duration:.5});
    }
    window.ReactNativeWebView &&
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'select',id:id}));
  }

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
  const [htmlContent, setHtmlContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Initializing...");

  const highlightId = route?.params?.highlightStudentId ?? null;

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (e.data.action.type === "GO_BACK") {
        e.preventDefault();
        navigation.navigate("Home");
      }
    });
    return unsubscribe;
  }, [navigation]);

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
        Alert.alert(
          "No Internet",
          "An internet connection is needed to load map tiles.",
          [{ text: "Go Back", onPress: () => navigation.goBack() }],
        );
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

      setHtmlContent(buildMapHTML(rows, highlightId));
    } catch (err) {
      console.error("MapViewPage error:", err);
      Alert.alert("Error", "Could not load student data: " + err.message);
    } finally {
      setTimeout(() => setIsLoading(false), 400);
    }
  };

  // Loading screen
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
      {/*
        Exact same WebView pattern as the other 3 working pages.
        No base64 → HTML stays tiny → no crash.
      */}
      <WebView
        source={{ html: htmlContent }}
        style={StyleSheet.absoluteFillObject}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        mixedContentMode="always"
        allowUniversalAccessFromFileURLs
        allowFileAccess
        scrollEnabled={false}
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