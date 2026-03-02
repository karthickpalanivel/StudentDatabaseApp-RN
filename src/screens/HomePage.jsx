import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  BackHandler, // <-- Imported
} from "react-native";
import { useFocusEffect } from "@react-navigation/native"; // <-- Imported
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";

import { COLORS } from "../theme/colors";

const { width, height } = Dimensions.get("window");

export default function HomePage({ navigation }) {
  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeUser, setActiveUser] = useState("User");

  // ==========================================
  // HARDWARE BACK BUTTON (Exit App)
  // ==========================================
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Only exit the app if the logout modal is NOT visible.
        // If modal is visible, pressing back should just close the modal.
        if (isLogoutModalVisible) {
          setLogoutModalVisible(false);
          return true;
        }

        BackHandler.exitApp();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [isLogoutModalVisible]), // Re-bind if modal state changes
  );

  // ==========================================
  // AUTHENTICATION & DATA FETCHING
  // ==========================================
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          return;
        }

        const storedName = await AsyncStorage.getItem("userName");
        if (storedName) {
          setActiveUser(storedName);
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["userToken", "userName"]);
      setLogoutModalVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require("../../assets/loader/circleLoader.json")}
          autoPlay
          loop
          style={styles.lottieLoader}
        />
      </View>
    );
  }

  return (
    <SafeAreaProvider style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.backgroundSweep} />

        <View style={styles.headerRow}>
          <Image
            source={require("../../assets/Images/logo.png")}
            style={styles.logoIcon}
            resizeMode="contain"
          />
          <TouchableOpacity onPress={() => setLogoutModalVisible(true)}>
            <Image
              source={require("../../assets/Images/profileIcon.png")}
              style={styles.profileIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.welcomeSubtext}>Welcome, {activeUser}</Text>
          <Text style={styles.welcomeTitle}>Student Database App</Text>
        </View>

        <View style={styles.cardsRow}>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("AddStudent")}
          >
            <View style={styles.iconCircle}>
              <Image
                source={require("../../assets/Images/addStudentIcon.png")}
                style={styles.cardIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.cardText}>Add{"\n"}Student</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("ViewStudent")}
          >
            <View style={styles.iconCircle}>
              <Image
                source={require("../../assets/Images/viewStudentIcon.png")}
                style={styles.cardIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.cardText}>View{"\n"}Student</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("MapView")}
          >
            <View style={styles.iconCircle}>
              <Image
                source={require("../../assets/Images/locationPageIcon.png")}
                style={styles.cardIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.cardText}>Map{"\n"}View</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.middleSection}>
        <Image
          source={require("../../assets/Images/student.png")}
          style={styles.fadedImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.bottomSection} />

      <Modal
        animationType="fade"
        transparent={true}
        visible={isLogoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Logout</Text>

            <View style={styles.activeUserBadge}>
              <Text style={styles.activeUserText}>
                Logged in as: {activeUser}
              </Text>
            </View>

            <Text style={styles.modalMessage}>
              Are you sure you want to log out?
            </Text>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.logoutButton]}
                onPress={handleLogout}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  lottieLoader: { width: 150, height: 150 },
  loadingText: {
    fontFamily: "Roboto-Medium",
    color: COLORS.primary,
    fontSize: 16,
    marginTop: -20,
  },
  topSection: {
    height: "55%",
    paddingTop: 20,
    zIndex: 10,
  },
  backgroundSweep: {
    position: "absolute",
    width: width * 1.4,
    height: height * 0.45,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: width * 1.89,
    borderBottomRightRadius: width * 0.7,
    top: 0,
    bottom: -40,
    right: -50,
    zIndex: -1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
    marginTop: 15,
  },
  logoIcon: { width: 35, height: 35, tintColor: COLORS.white },
  profileIcon: { width: 50, height: 50 },
  textContainer: { paddingHorizontal: 30, marginTop: 35 },
  welcomeSubtext: {
    fontFamily: "Roboto-Regular",
    fontSize: 18,
    color: "#8CAEAE",
    marginBottom: 5,
  },
  welcomeTitle: {
    fontFamily: "Roboto-Bold",
    fontSize: 28,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingHorizontal: 15,
    marginTop: "10%",
  },
  card: {
    backgroundColor: COLORS.lightest,
    width: width * 0.28,
    height: 140,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  iconCircle: {
    borderRadius: 25, // Changed from "100%"
    backgroundColor: "#0A4E51",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    padding: 5,
  },
  cardIcon: { width: 35, height: 35 },
  cardText: {
    fontFamily: "Roboto-Bold",
    fontSize: 14,
    color: COLORS.primary,
    textAlign: "center",
    lineHeight: 18,
  },
  middleSection: {
    height: "40%",
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  fadedImage: { width: "80%", height: "100%", padding: 10 },
  bottomSection: { height: "5%", backgroundColor: COLORS.white },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(4, 32, 38, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    elevation: 10,
  },
  modalTitle: {
    fontFamily: "Roboto-Bold",
    fontSize: 22,
    color: COLORS.darkest,
    marginBottom: 10,
  },
  activeUserBadge: {
    backgroundColor: "#E6F0F0",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  activeUserText: {
    fontFamily: "Roboto-Medium",
    color: COLORS.primary,
    fontSize: 14,
  },
  modalMessage: {
    fontFamily: "Roboto-Regular",
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: { backgroundColor: "#E0E0E0" },
  cancelButtonText: { fontFamily: "Roboto-Bold", color: "#555", fontSize: 15 },
  logoutButton: { backgroundColor: "#2B6D73" },
  logoutButtonText: {
    fontFamily: "Roboto-Bold",
    color: COLORS.white,
    fontSize: 15,
  },
});
