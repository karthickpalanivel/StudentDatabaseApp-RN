import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../theme/colors";

export default function ViewStudentPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>View Student Page</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: COLORS.darkest,
    fontSize: 20,
    fontWeight: "bold",
  },
});
