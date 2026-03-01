import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from "react-native";
import { COLORS } from "../theme/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

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
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={40}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Image Section */}
            <View style={styles.topSection}>
              <View style={styles.backgroundSweep} />
              <Image
                source={require("../../assets/Images/studentImg.png")}
                style={styles.image}
                resizeMode="contain"
              />
            </View>

            {/* Form Card Section */}
            <View style={styles.Wrapper}>
              <View style={styles.formWrapper}>
                <Text style={styles.headerTitle}>SIGN UP</Text>

                {/* <View style={styles.formCard}> */}
                {/* Username */}
                <TextInput
                  style={styles.input}
                  placeholder="User Name"
                  placeholderTextColor={COLORS.light}
                  value={userName}
                  onChangeText={setUserName}
                  autoCapitalize="none"
                />

                {/* Phone */}
                <TextInput
                  style={styles.input}
                  placeholder="Phone no"
                  placeholderTextColor={COLORS.light}
                  keyboardType="numeric"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                />

                {/* Password */}
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
                      size={20}
                      color={COLORS.light}
                    />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password */}
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
                      size={20}
                      color={COLORS.light}
                    />
                  </TouchableOpacity>
                </View>
                {/* </View> */}

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
                <Text style={styles.footerText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.linkText}> SignIn</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#fff",
  },

  backgroundSweep: {
    position: "absolute",
    width: width * 1.5,
    height: height * 0.45,
    backgroundColor: "#07575B",
    // borderBottomLeftRadius: width * 1,
    borderBottomRightRadius: width * 2.5,
    top: 0,
    bottom: -40,
    right: -50,
    zIndex: -1,
  },

  /* Top Section with Bottom-Right Curve */
  topSection: {
    // backgroundColor: COLORS.primary,
    height: 280,
    // borderBottomRightRadius: 120,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  image: {
    width: "80%",
    height: "80%",
  },

  /* Form Wrapper */
  formWrapper: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 30,
    backgroundColor: "#C4DFE6",
    padding: "10%",
    marginVertical: "5%",
    marginHorizontal: "5%",
    borderRadius: 10,
  },
  Wrapper: {
    position: "absolute",
    top: "30%",
    width: width * 1,
  },

  headerTitle: {
    fontSize: 28,
    fontFamily: "Roboto-Bold",
    color: COLORS.primary,
    marginBottom: 20,
  },

  /* Light Box Card */
  formCard: {
    backgroundColor: COLORS.light,
    padding: 20,
    borderRadius: 20,
    marginBottom: 25,
  },

  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.light,
    fontSize: 16,
    paddingVertical: 12,
    marginBottom: 20,
    color: COLORS.darkest,
  },

  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.light,
    marginBottom: 20,
  },

  inputFlex: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: COLORS.darkest,
  },

  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    // marginHorizontal: "5%",
  },

  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: "Roboto-Bold",
    letterSpacing: 1,
  },

  errorText: {
    color: "#D9534F",
    textAlign: "center",
    marginTop: 15,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
  },

  footerText: {
    color: "#7A9595",
    fontSize: 15,
  },

  linkText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 15,
  },
});
