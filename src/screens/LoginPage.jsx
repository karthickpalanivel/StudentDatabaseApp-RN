import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";

// Database and Theme Imports
import db from "../database/database";
import { COLORS } from "../theme/colors";

const { width, height } = Dimensions.get("window");
const FORM_BACKGROUND = "#fff";

export default function LoginPage({ navigation }) {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // 1. Basic Validation
    if (!userName || !password) {
      Alert.alert(
        "Missing Fields",
        "Please enter both your username and password.",
      );
      return;
    }

    // Start the Loader
    setIsLoading(true);

    try {
      // 2. Query the Database (Table name: student_app_users)
      // We search for a match where both username and password are correct
      const user = db.getFirstSync(
        "SELECT * FROM student_app_users WHERE user_name = ? AND password = ?",
        [userName, password],
      );

      // Artificial delay for smooth Lottie UX
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (user) {
        // 3. Success! Save both the User ID and User Name to AsyncStorage
        await AsyncStorage.setItem("userToken", String(user.user_id));
        await AsyncStorage.setItem("userName", user.user_name); // <-- NEW: Store the name

        setIsLoading(false);

        // 4. Navigate to Home and clear the stack
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      } else {
        // 5. Failure
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
    <SafeAreaProvider style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Section with Illustration */}
          <View style={styles.topSection}>
            <View style={styles.backgroundSweep} />
            <Image
              source={require("../../assets/Images/studentImg.png")}
              style={styles.image}
            />
          </View>

          {/* Form Section */}
          <View style={styles.wrapper}>
            <View style={styles.formSection}>
              <Text style={styles.headerTitle}>SIGN IN</Text>

              {/* User Name Input */}
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

              {/* Password Input with Visibility Toggle */}
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
                      color="#8CAEAE"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forget Password Link */}
              <TouchableOpacity style={styles.forgotPasswordContainer}>
                <Text style={styles.forgotPasswordText}>Forget Password ?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>SIGN IN</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Footer Section */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
              <Text style={styles.linkText}>SignUp</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ========================================== */}
      {/* LOTTIE LOADER MODAL                        */}
      {/* ========================================== */}
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
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  scrollContainer: {
    flexGrow: 1,
    backgroundColor: FORM_BACKGROUND,
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
  topSection: {
    width: width,
    height: 380,
    // backgroundColor: COLORS.primary,
  },
  image: {
    width: "80%",
    height: "80%",
    // resizeMode: "cover",
  },
  formSection: {
    flex: 1,
    backgroundColor: FORM_BACKGROUND,
    paddingHorizontal: 35,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: "Roboto-Bold",
    color: COLORS.darkest,
    marginBottom: 40,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    marginBottom: 25,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
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
    bottom: 12,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginTop: -5,
    marginBottom: 40,
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
    letterSpacing: 1.2,
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
    paddingVertical: 35,
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
  /* Loader Styles */
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(4, 32, 38, 0.4)", // Dark semi-transparent overlay
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
  lottie: {
    width: 120,
    height: 120,
  },
  loaderText: {
    fontFamily: "Roboto-Medium",
    color: COLORS.primary,
    marginTop: 10,
    fontSize: 16,
  },
});
