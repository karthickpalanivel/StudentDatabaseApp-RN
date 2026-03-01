import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { initDB } from "./src/database/database";
import { COLORS } from "./src/theme/colors";

import InitialPage from "./src/screens/InitialPage";
import LoginPage from "./src/screens/LoginPage";
import SignUpPage from "./src/screens/SignUpPage";
import MainPage from "./src/screens/MainPage";
import AddStudentPage from "./src/screens/AddStudentPage";
import ViewStudentPage from "./src/screens/ViewStudentPage";
import MapViewPage from "./src/screens/MapViewPage";
import AddLocationPage from "./src/screens/AddLocationPage"; 

const Stack = createNativeStackNavigator();

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState("Initial");

  useEffect(() => {
    async function prepareApp() {
      try {
        initDB();

        const userToken = await AsyncStorage.getItem("userToken");
        if (userToken) {
          setInitialRoute("Main"); 
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setIsAppReady(true);
      }
    }

    prepareApp();
  }, []);

  if (!isAppReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.darkest,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    );
  }

  return (
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

        {/* Main App Flow */}
        <Stack.Screen
          name="Main"
          component={MainPage}
          options={{ headerShown: false }}
        />

        {/* Internal Pages (Showing headers with back buttons) */}
        <Stack.Screen
          name="AddStudent"
          component={AddStudentPage}
          options={{ title: "Add Data" }}
        />
        <Stack.Screen
          name="AddLocation"
          component={AddLocationPage}
          options={{ title: "Select Location" }}
        />
        <Stack.Screen
          name="ViewStudent"
          component={ViewStudentPage}
          options={{ title: "View Data" }}
        />
        <Stack.Screen
          name="MapView"
          component={MapViewPage}
          options={{ title: "Map View" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
