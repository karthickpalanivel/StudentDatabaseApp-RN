import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import MapView, { Circle } from "react-native-maps";
import * as Location from "expo-location";
import * as Network from "expo-network";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../theme/colors";
import { useContext } from "react";
import { StudentFormContext } from "../context/StudentFormContext";

const { width, height } = Dimensions.get("window");

export default function AddLocationPage({ navigation }) {
  const mapRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const { updateFormData } = useContext(StudentFormContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentRegion, setCurrentRegion] = useState({
    latitude: 13.0145, // Default fallback (Chennai)
    longitude: 80.2234,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // --- 1. Initialization: Check Network & Permissions ---
  useEffect(() => {
    (async () => {
      try {
        // Check Internet Connection
        const networkState = await Network.getNetworkStateAsync();
        if (!networkState.isConnected) {
          Alert.alert(
            "No Internet",
            "Please connect to the internet to load maps.",
          );
          setIsLoading(false);
          return;
        }

        // Request Location Permissions
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "We need location access to find where you are. Using default location.",
          );
          setIsLoading(false);
          return;
        }

        // Get Actual Current Location
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const initialLoc = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };

        setCurrentRegion(initialLoc);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching location:", error);
        setIsLoading(false);
      }
    })();
  }, []);

  // --- 2. Handlers ---

  
  const handleLocateMe = async () => {
    try {
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      // Animate camera smoothly to the user's location
      mapRef.current?.animateToRegion(newRegion, 1000);
      setCurrentRegion(newRegion);
    } catch (error) {
      Alert.alert("Error", "Could not fetch current location.");
    }
  };

  const handleAddLocation = async () => {
    setIsLoading(true);
    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude: currentRegion.latitude,
        longitude: currentRegion.longitude,
      });

      let addressString = "Unknown Location";
      if (geocode.length > 0) {
        const place = geocode[0];
        addressString =
          `${place.streetNumber || ""} ${place.street || ""}, ${place.city || place.subregion || ""}, ${place.region || ""} ${place.postalCode || ""}`.trim();
        if (addressString.startsWith(","))
          addressString = addressString.substring(1).trim();
      }

      // 3. Save directly to global state
      updateFormData("location", {
        lat: currentRegion.latitude,
        lng: currentRegion.longitude,
        address: addressString,
      });

      // 4. Safely go back without resetting the Add Student screen
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Could not process location data.");
    } finally {
      setIsLoading(false);
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
      {/* --- Header (Dark Teal) --- */}
      

      <View style={styles.mapWrapper}>
        {/* --- Map View --- */}
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={currentRegion}
          onRegionChangeComplete={(region) => setCurrentRegion(region)}
          showsUserLocation={false} // We are building a custom center selector
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {/* Light Blue Radius Circle */}
          <Circle
            center={{
              latitude: currentRegion.latitude,
              longitude: currentRegion.longitude,
            }}
            radius={200} // Radius in meters
            fillColor="rgba(66, 133, 244, 0.15)"
            strokeColor="rgba(66, 133, 244, 0.3)"
            strokeWidth={1}
          />
        </MapView>

        {/* --- Center Target Marker (Fixed to screen center) --- */}
        <View style={styles.centerMarkerContainer} pointerEvents="none">
          <View style={styles.centerMarkerOuter}>
            <View style={styles.centerMarkerInner} />
          </View>
        </View>

        {/* --- Floating Search Bar --- */}
        <View style={styles.searchBarContainer}>
          <MaterialIcons
            name="menu"
            size={26}
            color="#555"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Try gas stations, ATMs"
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Ionicons
            name="mic"
            size={24}
            color="#555"
            style={styles.searchIcon}
          />
        </View>

        {/* --- Floating Action Buttons (Right Side) --- */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fabWhite}
            onPress={handleLocateMe}
            activeOpacity={0.8}
          >
            <MaterialIcons name="my-location" size={24} color="#4285F4" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.fabBlue} activeOpacity={0.8}>
            <MaterialIcons name="directions" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* --- Bottom Add Button --- */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddLocation}
            activeOpacity={0.9}
          >
            <Text style={styles.addButtonText}>ADD</Text>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  /* --- Header --- */
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
  iconButton: {
    padding: 5,
  },
  /* --- Map --- */
  mapWrapper: {
    flex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  /* --- Custom Center Marker --- */
  centerMarkerContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -10, // Half of outer width
    marginTop: -10, // Half of outer height
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  centerMarkerOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  centerMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4285F4", // Google Blue
  },
  /* --- Floating Search Bar --- */
  searchBarContainer: {
    position: "absolute",
    top: 20,
    left: 15,
    right: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Roboto-Regular",
    fontSize: 16,
    color: COLORS.darkest,
    marginHorizontal: 10,
  },
  searchIcon: {
    padding: 2,
  },
  /* --- Floating Action Buttons --- */
  fabContainer: {
    position: "absolute",
    right: 15,
    bottom: 120, // Sit above the bottom ADD button
    alignItems: "center",
  },
  fabWhite: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabBlue: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  /* --- Bottom Add Button --- */
  bottomContainer: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
  },
  addButton: {
    backgroundColor: COLORS.primary, // Dark Teal
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  addButtonText: {
    fontFamily: "Roboto-Regular",
    color: COLORS.white,
    fontSize: 16,
    letterSpacing: 1,
  },
});
