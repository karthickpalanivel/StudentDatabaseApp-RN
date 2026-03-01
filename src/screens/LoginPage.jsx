import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  Dimensions,
  Alert,
  Modal,
  BackHandler,
  StatusBar,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";

import db from "../database/database";
import { COLORS } from "../theme/colors";

const { width, height } = Dimensions.get("window");

// How tall the teal hero area is
const HERO_HEIGHT = height * 0.46;

export default function LoginPage({ navigation }) {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ==========================================
  // HANDLE HARDWARE BACK BUTTON (ANDROID)
  // ==========================================
  useEffect(() => {
    const backAction = () => {
      navigation.navigate("Initial");
      return true; // Prevents default behavior (exiting the app)
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, [navigation]);

  const handleLogin = async () => {
    if (!userName || !password) {
      Alert.alert(
        "Missing Fields",
        "Please enter both your username and password.",
      );
      return;
    }
    setIsLoading(true);
    try {
      const user = db.getFirstSync(
        "SELECT * FROM student_app_users WHERE user_name = ? AND password = ?",
        [userName, password],
      );
      await new Promise((r) => setTimeout(r, 1500));
      if (user) {
        await AsyncStorage.setItem("userToken", String(user.user_id));
        await AsyncStorage.setItem("userName", user.user_name);
        setIsLoading(false);
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      } else {
        setIsLoading(false);
        Alert.alert(
          "Login Failed",
          "Invalid username or password. Please try again.",
        );
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Authentication Error: ", error);
      Alert.alert(
        "Error",
        "Something went wrong while connecting to the database.",
      );
    }
  };

  return (
    <SafeAreaProvider style={styles.root}>
      {/* ── BACK BUTTON ── */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate("Initial")}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={28} color={COLORS.white} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* ── TEAL HERO BACKGROUND ── */}
          <View style={styles.heroBg} />

          {/* ── ILLUSTRATION ── */}
          <Image
            source={require("../../assets/Images/initial_page.png")}
            style={styles.heroImage}
            resizeMode="contain"
          />

          {/* ── FORM CARD ── */}
          <View style={styles.cardWrapper}>
            <View style={styles.card}>
              <Text style={styles.headerTitle}>SIGN IN</Text>

              {/* User Name */}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="User Name"
                  placeholderTextColor="#88A1A1"
                  value={userName}
                  onChangeText={setUserName}
                  autoCapitalize="none"
                />
              </View>

              {/* Password */}
              <View style={styles.inputWrapper}>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Password"
                    placeholderTextColor="#88A1A1"
                    secureTextEntry={!isPasswordVisible}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={isPasswordVisible ? "eye-off" : "eye"}
                      size={22}
                      color={COLORS.light}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPasswordContainer}>
                <Text style={styles.forgotPasswordText}>Forget Password ?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>LOG IN</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
                <Text style={styles.linkText}>SignUp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* LOTTIE LOADER */}
      <Modal transparent visible={isLoading} animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.loaderContainer}>
            <LottieView
              source={require("../../assets/loader/circleLoader.json")}
              autoPlay
              loop
              style={styles.lottie}
            />
            <Text style={styles.loaderText}>Authenticating...</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : (StatusBar.currentHeight || 24) + 15,
    left: 20,
    zIndex: 20, // High zIndex so it floats over everything
    padding: 5,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  heroBg: {
    width: width,
    height: HERO_HEIGHT,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: width * 0.25,
  },
  heroImage: {
    position: "absolute",
    width: width,
    height: HERO_HEIGHT,
    zIndex: 2,
  },
  cardWrapper: {
    position: "absolute",
    width: width,
    top: "40%",
    zIndex: 5,
  },
  card: {
    marginHorizontal: "5%",
    backgroundColor: COLORS.lightest,
    borderRadius: 18,
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 35,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 30,
    fontFamily: "Roboto-Bold",
    color: COLORS.darkest,
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    marginBottom: 24,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    fontFamily: "Roboto-Regular",
    height: 45,
    borderBottomWidth: 1.5,
    borderBottomColor: "#8CAEAE",
    fontSize: 17,
    color: COLORS.darkest,
    paddingBottom: 8,
  },
  eyeIcon: {
    position: "absolute",
    right: 0,
    bottom: 10,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginTop: -8,
    marginBottom: 36,
  },
  forgotPasswordText: {
    fontFamily: "Roboto-Regular",
    color: COLORS.light,
    fontSize: 15,
    textDecorationLine: "underline",
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "Roboto-Bold",
    color: COLORS.white,
    fontSize: 16,
    letterSpacing: 1.4,
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
  },
  footerText: {
    fontFamily: "Roboto-Regular",
    color: "#7A9595",
    fontSize: 15,
  },
  linkText: {
    fontFamily: "Roboto-Bold",
    color: COLORS.primary,
    fontSize: 15,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(4, 32, 38, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContainer: {
    width: 200,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    elevation: 10,
  },
  lottie: { width: 120, height: 120 },
  loaderText: {
    fontFamily: "Roboto-Medium",
    color: COLORS.primary,
    marginTop: 10,
    fontSize: 16,
  },
});
