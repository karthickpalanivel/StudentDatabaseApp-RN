// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
//   ScrollView,
//   ActivityIndicator,
//   SafeAreaView,
//   Dimensions,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import MapView, { Marker, UrlTile } from "react-native-maps";
// import db from "../database/database";
// import { COLORS } from "../theme/colors";

// const { width } = Dimensions.get("window");

// // ==========================================
// // REUSABLE UI COMPONENTS
// // ==========================================

// // 1. Info Square (Gender, DOB, Blood)
// const InfoSquare = ({ title, value }) => (
//   <View style={styles.infoSquare}>
//     <Text style={styles.infoSquareTitle}>{title}</Text>
//     <Text style={styles.infoSquareValue}>{value || "-"}</Text>
//   </View>
// );

// // 2. Outlined Section (Fieldset Style)
// const DetailSection = ({ title, children }) => (
//   <View style={styles.sectionContainer}>
//     <Text style={styles.sectionTitle}>{title}</Text>
//     {children}
//   </View>
// );

// // 3. Detail Row (Key / Value pair)
// const DetailRow = ({ label, value }) => (
//   <View style={styles.detailRow}>
//     <Text style={styles.detailLabel}>{label}</Text>
//     <Text style={styles.detailValue} numberOfLines={1}>
//       {value || "-"}
//     </Text>
//   </View>
// );

// const staticMapHTML = (lat, lon) => `<!DOCTYPE html>
// <html><head>
// <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
// <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
// <style>*{margin:0;padding:0}#map{width:100vw;height:100vh}</style>
// </head><body><div id="map"></div>
// <script>
// var map=L.map('map',{zoomControl:false,dragging:false,touchZoom:false,
//   scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false})
//   .setView([${lat},${lon}],16);
// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
//   {maxZoom:19,attribution:''}).addTo(map);
// L.circleMarker([${lat},${lon}],
//   {radius:10,color:'#07575B',fillColor:'#07575B',fillOpacity:1,weight:2}).addTo(map);
// </script></body></html>`;

// // ==========================================
// // MAIN SCREEN COMPONENT
// // ==========================================
// export default function ViewStudentDetailPage({ route, navigation }) {
//   const [student, setStudent] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);

//   // Extract the ID passed from the previous screen
//   const { studentId } = route.params;

//   useEffect(() => {
//     // Fetch the specific student's full profile
//     try {
//       if (studentId) {
//         const data = db.getFirstSync(
//           "SELECT * FROM students WHERE student_id = ?",
//           [studentId],
//         );
//         setStudent(data);
//       }
//     } catch (error) {
//       console.error("Failed to fetch student details:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [studentId]);

//   if (isLoading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//       </View>
//     );
//   }

//   if (!student) {
//     return (
//       <View style={styles.loadingContainer}>
//         <Text style={{ color: COLORS.primary, fontSize: 18 }}>
//           Student not found.
//         </Text>
//       </View>
//     );
//   }

//   // Format the Class String (e.g., "6 Standard "A" Section")
//   const formattedClass = `${student.student_class} Standard "${student.student_section}" Section`;

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <ScrollView
//         contentContainerStyle={styles.scrollContainer}
//         bounces={false}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* ========================================== */}
//         {/* TOP HEADER SECTION (Dark Teal Background)    */}
//         {/* ========================================== */}
//         <View style={styles.headerSection}>
//           {/* Back Button */}
//           <TouchableOpacity
//             style={styles.backButton}
//             onPress={() => navigation.goBack()}
//           >
//             <Ionicons name="arrow-back" size={28} color={COLORS.white} />
//           </TouchableOpacity>

//           {/* Profile Picture */}
//           <View style={styles.profileImageContainer}>
//             <Image
//               source={
//                 student.student_picture_uri
//                   ? { uri: student.student_picture_uri }
//                   : require("../../assets/Images/profileIcon.png")
//               }
//               style={styles.profileImage}
//             />
//           </View>

//           {/* Core Info */}
//           <Text style={styles.studentName}>{student.student_name}</Text>
//           <Text style={styles.studentSubtext}>{formattedClass}</Text>
//           <Text style={styles.studentSubtext}>
//             {student.student_school_name}
//           </Text>

//           {/* The 3 Floating Squares */}
//           <View style={styles.squaresRow}>
//             <InfoSquare title="Gender" value={student.student_gender} />
//             <InfoSquare title="DOB" value={student.student_date_of_birth} />
//             <InfoSquare title="Blood" value={student.student_blood_group} />
//           </View>
//         </View>

//         {/* ========================================== */}
//         {/* BOTTOM BODY SECTION (White Background)       */}
//         {/* ========================================== */}
//         <View style={styles.bodySection}>
//           {/* Parents Details */}
//           <DetailSection title="Parents Details">
//             <DetailRow
//               label="Father's name"
//               value={student.student_father_name}
//             />
//             <DetailRow
//               label="Mother's name"
//               value={student.student_mother_name}
//             />
//             <DetailRow
//               label="Contact no."
//               value={student.student_parent_contact_no}
//             />
//             <DetailRow
//               label="Emergency contact no."
//               value={student.student_emergency_contact}
//             />
//           </DetailSection>

//           {/* Residential Details */}
//           <DetailSection title="Residential Details">
//             <DetailRow label="Address 1" value={student.student_address_1} />
//             <DetailRow label="Address 2" value={student.student_address_2} />
//             <DetailRow label="City" value={student.student_city} />
//             <DetailRow label="State" value={student.student_state} />
//             <DetailRow label="Zip" value={student.student_zip_code} />
//           </DetailSection>

//           {/* Location Map Thumbnail */}

//           {/* <DetailSection title="Location">
//             <View style={styles.mapContainer}>
//               {student.student_location_lat && student.student_location_lon ? (
//                 <MapView
//                   style={styles.map}
//                   initialRegion={{
//                     latitude: student.student_location_lat,
//                     longitude: student.student_location_lon,
//                     latitudeDelta: 0.005,
//                     longitudeDelta: 0.005,
//                   }}
//                   scrollEnabled={false}
//                   zoomEnabled={false}
//                   pitchEnabled={false}
//                   rotateEnabled={false}
//                   mapType="none" // Disables Google API requirement
//                 >
//                   <UrlTile
//                     urlTemplate="https://a.tile.openstreetmap.de/{z}/{x}/{y}.png"
//                     maximumZ={19}
//                     flipY={false}
//                   />
//                   <Marker
//                     coordinate={{
//                       latitude: student.student_location_lat,
//                       longitude: student.student_location_lon,
//                     }}
//                     pinColor="#4285F4"
//                   />
//                 </MapView>
//               ) : (
//                 <View style={styles.noMapContainer}>
//                   <Text style={{ color: "#8CAEAE" }}>
//                     Location not provided
//                   </Text>
//                 </View>
//               )}

//               <View style={styles.expandIconContainer}>
//                 <Ionicons name="expand" size={18} color={COLORS.primary} />
//               </View>
//             </View>
//           </DetailSection> */}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: COLORS.primary, // Keeps the notch area dark teal on iOS
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     backgroundColor: COLORS.white,
//   },
//   loadingContainer: {
//     flex: 1,
//     backgroundColor: COLORS.white,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   /* --- Top Header Section --- */
//   headerSection: {
//     backgroundColor: COLORS.primary,
//     alignItems: "center",
//     paddingBottom: 40,
//     position: "relative",
//   },
//   backButton: {
//     position: "absolute",
//     top: 20,
//     left: 20,
//     zIndex: 10,
//     padding: 5,
//   },
//   profileImageContainer: {
//     width: 110,
//     height: 110,
//     borderRadius: 55,
//     backgroundColor: COLORS.white,
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 40,
//     marginBottom: 15,
//   },
//   profileImage: {
//     width: 102,
//     height: 102,
//     borderRadius: 51,
//     resizeMode: "cover",
//   },
//   studentName: {
//     fontFamily: "Roboto-Bold",
//     fontSize: 24,
//     color: COLORS.white,
//     marginBottom: 5,
//   },
//   studentSubtext: {
//     fontFamily: "Roboto-Regular",
//     fontSize: 14,
//     color: "#8CAEAE", // Light teal text
//     marginBottom: 4,
//   },
//   /* --- Floating Squares --- */
//   squaresRow: {
//     flexDirection: "row",
//     justifyContent: "center",
//     marginTop: 25,
//     marginBottom: -60, // Pulls the squares down to overlap the white body
//     zIndex: 10,
//   },
//   infoSquare: {
//     backgroundColor: COLORS.white,
//     width: width * 0.25,
//     height: 65,
//     borderRadius: 10,
//     justifyContent: "center",
//     alignItems: "center",
//     marginHorizontal: 8,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   infoSquareTitle: {
//     fontFamily: "Roboto-Bold",
//     fontSize: 14,
//     color: COLORS.primary,
//     marginBottom: 5,
//   },
//   infoSquareValue: {
//     fontFamily: "Roboto-Regular",
//     fontSize: 13,
//     color: "#66A5AD",
//   },
//   /* --- Body Section --- */
//   bodySection: {
//     backgroundColor: COLORS.white,
//     borderTopLeftRadius: 35,
//     borderTopRightRadius: 35,
//     paddingHorizontal: 25,
//     paddingTop: 65, // Push content down so floating squares don't cover it
//     paddingBottom: 40,
//     flex: 1,
//   },
//   /* --- Detail Sections (Fieldset look) --- */
//   sectionContainer: {
//     borderWidth: 1.5,
//     borderColor: "#CDE1E2",
//     borderRadius: 8,
//     paddingHorizontal: 20,
//     paddingTop: 20,
//     paddingBottom: 10,
//     marginBottom: 35,
//     position: "relative",
//   },
//   sectionTitle: {
//     position: "absolute",
//     top: -10, // Pulls the text up to break the border
//     left: 15,
//     backgroundColor: COLORS.white,
//     paddingHorizontal: 8,
//     fontFamily: "Roboto-Bold",
//     fontSize: 14,
//     color: "#8CAEAE", // Matched with mockup border title color
//   },
//   /* --- MODIFIED: Detail Row Alignment to match Mockup --- */
//   detailRow: {
//     flexDirection: "row",
//     marginBottom: 15,
//   },
//   detailLabel: {
//     flex: 1, // Takes up the left side
//     fontFamily: "Roboto-Regular",
//     fontSize: 14,
//     color: "#B0C4C4",
//   },
//   detailValue: {
//     flex: 1.2, // Pushes slightly past center
//     fontFamily: "Roboto-Regular",
//     fontSize: 14,
//     color: "#66A5AD",
//     textAlign: "left", // Left-aligned exactly like the mockup!
//   },
//   /* --- Map Thumbnail --- */
//   mapContainer: {
//     height: 120,
//     borderRadius: 6,
//     overflow: "hidden",
//     position: "relative",
//     marginBottom: 10,
//   },
//   map: {
//     ...StyleSheet.absoluteFillObject,
//   },
//   noMapContainer: {
//     flex: 1,
//     backgroundColor: "#F4F8F8",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   expandIconContainer: {
//     position: "absolute",
//     top: 8,
//     right: 8,
//     backgroundColor: COLORS.white,
//     width: 28,
//     height: 28,
//     borderRadius: 4,
//     justifyContent: "center",
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//     elevation: 3,
//   },
// });

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview"; // <-- Replaced react-native-maps with WebView
import db from "../database/database";
import { COLORS } from "../theme/colors";

const { width } = Dimensions.get("window");

// ==========================================
// REUSABLE UI COMPONENTS
// ==========================================

// 1. Info Square (Gender, DOB, Blood)
const InfoSquare = ({ title, value }) => (
  <View style={styles.infoSquare}>
    <Text style={styles.infoSquareTitle}>{title}</Text>
    <Text style={styles.infoSquareValue}>{value || "-"}</Text>
  </View>
);

// 2. Outlined Section (Fieldset Style)
const DetailSection = ({ title, children }) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

// 3. Detail Row (Key / Value pair)
const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue} numberOfLines={1}>
      {value || "-"}
    </Text>
  </View>
);

// ==========================================
// STATIC MAP HTML GENERATOR
// ==========================================
const staticMapHTML = (lat, lon) => `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<style>*{margin:0;padding:0}#map{width:100vw;height:100vh}</style>
</head><body><div id="map"></div>
<script>
var map=L.map('map',{zoomControl:false,dragging:false,touchZoom:false,
  scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false})
  .setView([${lat},${lon}],16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {maxZoom:19,attribution:''}).addTo(map);
L.circleMarker([${lat},${lon}],
  {radius:10,color:'#07575B',fillColor:'#07575B',fillOpacity:1,weight:2}).addTo(map);
</script></body></html>`;

// ==========================================
// MAIN SCREEN COMPONENT
// ==========================================
export default function ViewStudentDetailPage({ route, navigation }) {
  const [student, setStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extract the ID passed from the previous screen
  const { studentId } = route.params;

  useEffect(() => {
    // Fetch the specific student's full profile
    try {
      if (studentId) {
        const data = db.getFirstSync(
          "SELECT * FROM students WHERE student_id = ?",
          [studentId],
        );
        setStudent(data);
      }
    } catch (error) {
      console.error("Failed to fetch student details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: COLORS.primary, fontSize: 18 }}>
          Student not found.
        </Text>
      </View>
    );
  }

  // Format the Class String (e.g., "6 Standard "A" Section")
  const formattedClass = `${student.student_class} Standard "${student.student_section}" Section`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================== */}
        {/* TOP HEADER SECTION (Dark Teal Background)    */}
        {/* ========================================== */}
        <View style={styles.headerSection}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={28} color={COLORS.white} />
          </TouchableOpacity>

          {/* Profile Picture */}
          <View style={styles.profileImageContainer}>
            <Image
              source={
                student.student_picture_uri
                  ? { uri: student.student_picture_uri }
                  : require("../../assets/Images/profileIcon.png")
              }
              style={styles.profileImage}
            />
          </View>

          {/* Core Info */}
          <Text style={styles.studentName}>{student.student_name}</Text>
          <Text style={styles.studentSubtext}>{formattedClass}</Text>
          <Text style={styles.studentSubtext}>
            {student.student_school_name}
          </Text>

          {/* The 3 Floating Squares */}
          <View style={styles.squaresRow}>
            <InfoSquare title="Gender" value={student.student_gender} />
            <InfoSquare title="DOB" value={student.student_date_of_birth} />
            <InfoSquare title="Blood" value={student.student_blood_group} />
          </View>
        </View>

        {/* ========================================== */}
        {/* BOTTOM BODY SECTION (White Background)       */}
        {/* ========================================== */}
        <View style={styles.bodySection}>
          {/* Parents Details */}
          <DetailSection title="Parents Details">
            <DetailRow
              label="Father's name"
              value={student.student_father_name}
            />
            <DetailRow
              label="Mother's name"
              value={student.student_mother_name}
            />
            <DetailRow
              label="Contact no."
              value={student.student_parent_contact_no}
            />
            <DetailRow
              label="Emergency contact no."
              value={student.student_emergency_contact}
            />
          </DetailSection>

          {/* Residential Details */}
          <DetailSection title="Residential Details">
            <DetailRow label="Address 1" value={student.student_address_1} />
            <DetailRow label="Address 2" value={student.student_address_2} />
            <DetailRow label="City" value={student.student_city} />
            <DetailRow label="State" value={student.student_state} />
            <DetailRow label="Zip" value={student.student_zip_code} />
          </DetailSection>

          {/* Location Map Thumbnail */}
          <DetailSection title="Location">
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.mapContainer}
              onPress={() => {
                if (
                  student.student_location_lat &&
                  student.student_location_lon
                ) {
                  navigation.navigate("MapView", {
                    highlightStudentId: student.student_id,
                  });
                }
              }}
            >
              {student.student_location_lat && student.student_location_lon ? (
                <>
                  <WebView
                    key={`${student.student_location_lat}_${student.student_location_lon}`}
                    source={{
                      html: staticMapHTML(
                        student.student_location_lat,
                        student.student_location_lon,
                      ),
                    }}
                    style={StyleSheet.absoluteFillObject}
                    scrollEnabled={false}
                    javaScriptEnabled
                    originWhitelist={["*"]}
                    pointerEvents="none"
                  />
                  {/* Expand icon (top-right) */}
                  <View style={styles.expandIconContainer}>
                    <Ionicons name="expand" size={18} color={COLORS.primary} />
                  </View>
                  {/* "Tap to view all" pill (bottom-left) */}
                  <View style={styles.tapBadge}>
                    <Ionicons name="map" size={11} color={COLORS.white} />
                    <Text style={styles.tapBadgeText}>Tap to view all</Text>
                  </View>
                </>
              ) : (
                <View style={styles.noMapContainer}>
                  <Text style={{ color: "#8CAEAE" }}>
                    Location not provided
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </DetailSection>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary, // Keeps the notch area dark teal on iOS
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  /* --- Top Header Section --- */
  headerSection: {
    backgroundColor: COLORS.primary,
    alignItems: "center",
    paddingBottom: 40,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 5,
  },
  profileImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 15,
  },
  profileImage: {
    width: 102,
    height: 102,
    borderRadius: 51,
    resizeMode: "cover",
  },
  studentName: {
    fontFamily: "Roboto-Bold",
    fontSize: 24,
    color: COLORS.white,
    marginBottom: 5,
  },
  studentSubtext: {
    fontFamily: "Roboto-Regular",
    fontSize: 14,
    color: "#8CAEAE", // Light teal text
    marginBottom: 4,
  },
  /* --- Floating Squares --- */
  squaresRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
    marginBottom: -60, // Pulls the squares down to overlap the white body
    zIndex: 10,
  },
  infoSquare: {
    backgroundColor: COLORS.white,
    width: width * 0.25,
    height: 65,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoSquareTitle: {
    fontFamily: "Roboto-Bold",
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 5,
  },
  infoSquareValue: {
    fontFamily: "Roboto-Regular",
    fontSize: 13,
    color: "#66A5AD",
  },
  /* --- Body Section --- */
  bodySection: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 25,
    paddingTop: 65, // Push content down so floating squares don't cover it
    paddingBottom: 40,
    flex: 1,
  },
  /* --- Detail Sections (Fieldset look) --- */
  sectionContainer: {
    borderWidth: 1.5,
    borderColor: "#CDE1E2",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    marginBottom: 35,
    position: "relative",
  },
  sectionTitle: {
    position: "absolute",
    top: -10, // Pulls the text up to break the border
    left: 15,
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    fontFamily: "Roboto-Bold",
    fontSize: 14,
    color: "#8CAEAE", // Matched with mockup border title color
  },
  /* --- MODIFIED: Detail Row Alignment to match Mockup --- */
  detailRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  detailLabel: {
    flex: 1, // Takes up the left side
    fontFamily: "Roboto-Regular",
    fontSize: 14,
    color: "#B0C4C4",
  },
  detailValue: {
    flex: 1.2, // Pushes slightly past center
    fontFamily: "Roboto-Regular",
    fontSize: 14,
    color: "#66A5AD",
    textAlign: "left", // Left-aligned exactly like the mockup!
  },
  /* --- Map Thumbnail --- */
  mapContainer: {
    height: 120,
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
    marginBottom: 10,
  },
  noMapContainer: {
    flex: 1,
    backgroundColor: "#F4F8F8",
    justifyContent: "center",
    alignItems: "center",
  },
  expandIconContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: COLORS.white,
    width: 28,
    height: 28,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  tapBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tapBadgeText: {
    fontFamily: "Roboto-Regular",
    fontSize: 11,
    color: COLORS.white,
  },
});