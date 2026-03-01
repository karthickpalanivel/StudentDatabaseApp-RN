// General Imports
import React, { useEffect, useState } from "react";
import { View, StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Font from "expo-font";
import LottieView from "lottie-react-native"; // <-- Imported Lottie

// Database, Context, and Theme Imports
import { initDB } from "./src/database/database";
import { COLORS } from "./src/theme/colors";
import { StudentFormProvider } from "./src/context/StudentFormContext";

// Screen Imports
import InitialPage from "./src/screens/InitialPage";
import LoginPage from "./src/screens/LoginPage";
import SignUpPage from "./src/screens/SignUpPage";
import HomePage from "./src/screens/HomePage";
import AddStudentPage from "./src/screens/AddStudentPage";
import ViewStudentPage from "./src/screens/ViewStudentPage";
import ViewStudentDetailPage from "./src/screens/ViewStudentDetailPage"; // <-- Added the Detail Page
import MapViewPage from "./src/screens/MapViewPage";
import AddLocationPage from "./src/screens/AddLocationPage";

const Stack = createNativeStackNavigator();

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState("Initial");

  useEffect(() => {
    async function prepareApp() {
      try {
        // 1. Load custom fonts
        await Font.loadAsync({
          "Roboto-Regular": require("./assets/fonts/Roboto-Regular.ttf"),
          "Roboto-Bold": require("./assets/fonts/Roboto-Bold.ttf"),
        });

        // 2. Initialize the Database
        // This synchronously creates the tables if they don't exist before any screen loads.
        initDB();

        // 3. Check Authentication Token
        const userToken = await AsyncStorage.getItem("userToken");
        if (userToken) {
          setInitialRoute("Home");
        }

        // 4. Artificial delay for smooth UX (Lets the Lottie animation play for at least 0.8 seconds)
        await new Promise((resolve) => setTimeout(resolve, 800));
      } catch (e) {
        console.warn("App Initialization Error: ", e);
      } finally {
        // Tell the app to remove the Splash Screen and render the Navigator
        setIsAppReady(true);
      }
    }

    prepareApp();
  }, []);

  // ==========================================
  // SPLASH / LOADING SCREEN (Using Lottie)
  // ==========================================
  if (!isAppReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.white,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <StatusBar barStyle="light-content" />
        <LottieView
          source={require("./assets/loader/circleLoader.json")} // Path adjusted for root level
          autoPlay
          loop
          style={{ width: 150, height: 150 }}
        />
      </View>
    );
  }

  // ==========================================
  // MAIN APP NAVIGATION
  // ==========================================
  return (
    <StudentFormProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.darkest} />
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.dark },
            headerTintColor: COLORS.white,
            headerTitleStyle: { fontWeight: "bold" },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen
            name="Initial"
            component={InitialPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpPage}
            options={{ headerShown: false }}
          />

          {/* Home App Flow */}
          <Stack.Screen
            name="Home"
            component={HomePage}
            options={{ headerShown: false }}
          />

          {/* Internal Pages */}
          <Stack.Screen
            name="AddStudent"
            component={AddStudentPage}
            options={{ title: "Add Student" }}
          />
          <Stack.Screen
            name="AddLocation"
            component={AddLocationPage}
            options={{ title: "Select Location" }}
          />
          <Stack.Screen
            name="ViewStudent"
            component={ViewStudentPage}
            options={{ title: "View Student" }}
          />
          {/* Detail page registered here so the arrow button works */}
          <Stack.Screen
            name="ViewStudentDetail"
            component={ViewStudentDetailPage}
            options={{ headerShown: false }} // We built a custom header for this in the previous step
          />
          <Stack.Screen
            name="MapView"
            component={MapViewPage}
            options={{ title: "Map View" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </StudentFormProvider>
  );
}
