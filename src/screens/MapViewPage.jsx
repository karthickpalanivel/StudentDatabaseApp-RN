import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { useFocusEffect } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Location from "expo-location";
import * as Network from "expo-network";

import db from "../database/database";
import { COLORS } from "../theme/colors";

export default function MapViewPage({ navigation }) {
  const mapRef = useRef(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Initializing...");
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // Default fallback region
  const [region, setRegion] = useState({
    latitude: 13.0145,
    longitude: 80.2234,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useFocusEffect(
    useCallback(() => {
      initializeMapPage();
    }, []),
  );

  const initializeMapPage = async () => {
    setIsLoading(true);
    try {
      // 1. Authentication Check
      setLoadingText("Authenticating...");
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      // 2. Network Check
      setLoadingText("Checking Network...");
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        Alert.alert(
          "No Internet",
          "Please connect to the internet to load the maps.",
          [{ text: "Go Back", onPress: () => navigation.goBack() }],
        );
        setIsLoading(false);
        return;
      }

      // 3. Location Permission Check
      setLoadingText("Checking Permissions...");
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        // We don't block them from seeing the map, but we warn them.
        Alert.alert(
          "Permission Denied",
          "Location access was denied. Map will center on a default location.",
        );
      }

      // 4. Fetch Active Students with Coordinates
      setLoadingText("Fetching Students...");
      const result = db.getAllSync(`
        SELECT 
          student_id, 
          student_name, 
          student_picture_uri, 
          student_location_lat, 
          student_location_lon 
        FROM students 
        WHERE student_is_active = 1 
          AND student_location_lat IS NOT NULL 
          AND student_location_lon IS NOT NULL
      `);

      setStudents(result);

      // 5. Dynamic Map Bounds Calculation
      if (result.length > 0) {
        const coordinates = result.map((student) => ({
          latitude: student.student_location_lat,
          longitude: student.student_location_lon,
        }));

        setTimeout(() => {
          mapRef.current?.fitToCoordinates(coordinates, {
            edgePadding: { top: 120, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }, 600);
      } else if (status === "granted") {
        // If no students exist, but they granted permission, center on *their* location
        let userLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setRegion({
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    } catch (error) {
      console.error("Failed to initialize map page:", error);
      Alert.alert("Error", "Could not load map data.");
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 800);
    }
  };

  const handleMarkerPress = (studentId, lat, lon) => {
    setSelectedStudentId(studentId);
    mapRef.current?.animateToRegion(
      {
        latitude: lat,
        longitude: lon,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500,
    );
  };

  // ==========================================
  // LOTTIE LOADING SCREEN
  // ==========================================
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require("../../assets/loader/circleLoader.json")}
          autoPlay
          loop
          style={styles.lottieLoader}
        />
        <Text style={styles.loadingText}>{loadingText}</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        mapType="none"
        onPress={() => setSelectedStudentId(null)}
      >
        <UrlTile
          urlTemplate="https://a.tile.openstreetmap.de/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />

        {/* Render Dynamic Markers */}
        {students.map((student) => {
          const isSelected = selectedStudentId === student.student_id;

          return (
            <Marker
              key={student.student_id}
              coordinate={{
                latitude: student.student_location_lat,
                longitude: student.student_location_lon,
              }}
              onPress={(e) => {
                e.stopPropagation();
                handleMarkerPress(
                  student.student_id,
                  student.student_location_lat,
                  student.student_location_lon,
                );
              }}
              zIndex={isSelected ? 100 : 1}
            >
              <View style={{ alignItems: "center" }}>
                <View
                  style={[
                    styles.markerWrapper,
                    isSelected && styles.markerWrapperSelected,
                  ]}
                >
                  <Image
                    source={
                      student.student_picture_uri
                        ? { uri: student.student_picture_uri }
                        : require("../../assets/Images/profileIcon.png")
                    }
                    style={[
                      styles.markerImage,
                      isSelected && styles.markerImageSelected,
                    ]}
                  />

                  {isSelected && (
                    <Text style={styles.markerText} numberOfLines={1}>
                      {student.student_name}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.markerPointer,
                    isSelected && styles.markerPointerSelected,
                  ]}
                />
              </View>
            </Marker>
          );
        })}
      </MapView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  lottieLoader: {
    width: 150,
    height: 150,
  },
  loadingText: {
    fontFamily: "Roboto-Medium",
    color: COLORS.primary,
    fontSize: 16,
    marginTop: -20,
  },
  /* --- Floating Header --- */
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontFamily: "Roboto-Bold",
    fontSize: 20,
    color: COLORS.white,
  },
  /* --- Map --- */
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  /* --- Custom Marker Styles --- */
  markerWrapper: {
    backgroundColor: COLORS.white,
    padding: 3,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#8CAEAE",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  markerWrapperSelected: {
    paddingRight: 15,
    borderRadius: 30,
    backgroundColor: "#CDE1E2",
    borderColor: "#CDE1E2",
  },
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: "cover",
  },
  markerImageSelected: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  markerText: {
    fontFamily: "Roboto-Regular",
    color: COLORS.darkest,
    fontSize: 16,
    marginLeft: 10,
    maxWidth: 120,
  },
  markerPointer: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#8CAEAE",
    marginTop: -2,
  },
  markerPointerSelected: {
    borderTopColor: "#CDE1E2",
  },
});
