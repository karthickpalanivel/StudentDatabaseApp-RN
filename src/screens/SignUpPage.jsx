import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  Dimensions,
  BackHandler,
  StatusBar,
} from "react-native";
import { COLORS } from "../theme/colors";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"; // <-- Imported Library

import db from "../database/database";
import { validatePhone } from "../database/validators";

const { width, height } = Dimensions.get("window");

export default function SignUpPage({ navigation }) {
  const [userName, setUserName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  // ==========================================
  // HANDLE HARDWARE BACK BUTTON (ANDROID)
  // ==========================================
  useEffect(() => {
    const backAction = () => {
      navigation.navigate("Initial");
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, [navigation]);

  const handleSignUp = async () => {
    setErrorMessage("");

    if (!userName || !phone || !password || !confirmPassword) {
      setErrorMessage("Please fill in all the fields.");
      return;
    }

    if (!validatePhone(phone)) {
      setErrorMessage("Phone number must be exactly 10 digits.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      const existingUserByName = db.getFirstSync(
        "SELECT * FROM student_app_users WHERE user_name = ?",
        [userName],
      );

      if (existingUserByName) {
        setErrorMessage("User already exists with this name.");
        return;
      }

      const existingUserByPhone = db.getFirstSync(
        "SELECT * FROM student_app_users WHERE phone_number = ?",
        [phone],
      );

      if (existingUserByPhone) {
        setErrorMessage("Phone number already registered.");
        return;
      }

      db.runSync(
        "INSERT INTO student_app_users (user_name, phone_number, password) VALUES (?, ?, ?)",
        [userName, phone, password],
      );

      Alert.alert("Success!", "Account created successfully.", [
        { text: "Login Now", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (error) {
      console.log(error);
      setErrorMessage("Something went wrong.");
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

      {/* ── KEYBOARD AWARE SCROLL VIEW ── */}
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContainer}
        enableOnAndroid={true}
        extraScrollHeight={80} // Pushes the focused input up toward the center
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── TOP TEAL SECTION ── */}
        <View style={styles.topSection}>
          <Image
            source={require("../../assets/Images/studentImg.png")}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* ── OVERLAPPING FORM CARD ── */}
        <View style={styles.cardContainer}>
          <View style={styles.formWrapper}>
            <Text style={styles.headerTitle}>SIGN UP</Text>

            <TextInput
              style={styles.input}
              placeholder="User Name"
              placeholderTextColor={COLORS.light}
              value={userName}
              onChangeText={setUserName}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Phone no"
              placeholderTextColor={COLORS.light}
              keyboardType="numeric"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />

            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.inputFlex}
                placeholder="Password"
                placeholderTextColor={COLORS.light}
                secureTextEntry={!isPasswordVisible}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <Ionicons
                  name={isPasswordVisible ? "eye-off" : "eye"}
                  size={22}
                  color={COLORS.light}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.inputFlex}
                placeholder="Confirm Password"
                placeholderTextColor={COLORS.light}
                secureTextEntry={!isConfirmPasswordVisible}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                onPress={() =>
                  setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                }
              >
                <Ionicons
                  name={isConfirmPasswordVisible ? "eye-off" : "eye"}
                  size={22}
                  color={COLORS.light}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSignUp}
              activeOpacity={0.9}
            >
              <Text style={styles.buttonText}>SIGN UP</Text>
            </TouchableOpacity>
          </View>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.linkText}>SignIn</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.white },
  scrollContainer: { flexGrow: 1, backgroundColor: COLORS.white },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : (StatusBar.currentHeight || 24) + 15,
    left: 20,
    zIndex: 20,
    padding: 5,
  },
  topSection: {
    height: height * 0.42,
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: width * 0.35,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 30,
  },
  image: { width: "75%", height: "75%" },
  cardContainer: {
    marginTop: -50,
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formWrapper: {
    backgroundColor: "#F2F7F7",
    borderRadius: 15,
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 35,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Roboto-Bold",
    color: COLORS.primary,
    marginBottom: 25,
    letterSpacing: 0.5,
  },
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#8CAEAE",
    fontFamily: "Roboto-Regular",
    fontSize: 16,
    paddingVertical: 10,
    marginBottom: 20,
    color: COLORS.darkest,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#8CAEAE",
    marginBottom: 25,
  },
  inputFlex: {
    flex: 1,
    fontFamily: "Roboto-Regular",
    fontSize: 16,
    paddingVertical: 10,
    color: COLORS.darkest,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: "Roboto-Bold",
    letterSpacing: 1.2,
  },
  errorText: {
    fontFamily: "Roboto-Medium",
    color: "#D9534F",
    textAlign: "center",
    marginTop: 20,
  },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 30 },
  footerText: { fontFamily: "Roboto-Regular", color: "#7A9595", fontSize: 15 },
  linkText: { fontFamily: "Roboto-Bold", color: COLORS.primary, fontSize: 15 },
});
