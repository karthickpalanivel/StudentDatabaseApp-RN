import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { COLORS } from "../theme/colors";
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function InitialPage({ navigation }) {
  return (
    <SafeAreaProvider style={styles.container}>
      {/* Top Section with the newly added Illustration Asset */}
      <View style={styles.topSection}>
        <Image
          source={require("../../assets/Images/initial_page.png")} // Make sure this path is correct
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Bottom Section with Text and Buttons */}
      <View style={styles.bottomSection}>
        <Text style={styles.title}>Student</Text>
        <Text style={styles.title}>App...</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.buttonText}>LOG IN</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
            <Text style={styles.linkText}>SignUp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  topSection: {
    flex: 1,
    // backgroundColor: COLORS.primary, // The dark teal background (#07575B)
    justifyContent: "flex-end",
    alignItems: "center",
    
  },
  image: {
    width: "100%", // Scales the image nicely relative to the screen size
    height: "100%",
  },
  bottomSection: {
    flex: 1,
    paddingBottom: 30,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  title: {
    fontFamily: "Roboto-Bold",
    fontWeight: "bold",
    fontSize: 45,
    color: COLORS.primary,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 40,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: "Roboto-Bold",
    letterSpacing: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  
  footerText: {
    fontFamily: "Roboto-Regular",
    color: "gray",
    fontSize: 14,
  },

  linkText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "bold",
  },
});
