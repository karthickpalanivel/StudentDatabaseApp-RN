import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";

import db from "../database/database";
import { COLORS } from "../theme/colors";

// ==========================================
// HELPER FUNCTION: Ordinal Suffix (1st, 2nd, 3rd)
// ==========================================
const getOrdinalSuffix = (number) => {
  if (!number) return "";
  const j = number % 10;
  const k = number % 100;
  if (j === 1 && k !== 11) return number + "st";
  if (j === 2 && k !== 12) return number + "nd";
  if (j === 3 && k !== 13) return number + "rd";
  return number + "th";
};

// ==========================================
// REUSABLE UI COMPONENT: Student Card
// ==========================================
const StudentCard = ({ student, onPress }) => {
  // Construct the formatted subtitle string exactly like the mockup
  const formattedClass = getOrdinalSuffix(student.student_class);
  const subtitle = `${formattedClass} Std - ${student.student_section} / ${student.student_school_name}`;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      {/* Profile Image */}
      <View style={styles.imageContainer}>
        <Image
          source={
            student.student_picture_uri
              ? { uri: student.student_picture_uri }
              : require("../../assets/Images/profileIcon.png") // Fallback avatar
          }
          style={styles.avatar}
        />
      </View>

      {/* Text Details */}
      <View style={styles.textContainer}>
        <Text style={styles.nameText} numberOfLines={1}>
          {student.student_name}
        </Text>
        <Text style={styles.subtitleText} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {/* Arrow Button */}
      <View style={styles.arrowButton}>
        <Ionicons name="arrow-forward" size={22} color={COLORS.white} />
      </View>
    </TouchableOpacity>
  );
};

// ==========================================
// MAIN SCREEN COMPONENT
// ==========================================
export default function ViewStudentPage({ navigation }) {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // useFocusEffect ensures the database is queried EVERY time this screen is opened.
  // This means newly added students will appear instantly without app restarts.
  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, []),
  );

  const fetchStudents = () => {
    setIsLoading(true);
    try {
      // Query the database for the exact fields we need for the UI list
      const result = db.getAllSync(`
        SELECT 
          student_id, 
          student_name, 
          student_class, 
          student_section, 
          student_school_name,
          student_picture_uri
        FROM students 
        WHERE student_is_active = 1
        ORDER BY student_id DESC
      `);

      setStudents(result);
    } catch (error) {
      console.error("Failed to fetch students from SQLite:", error);
    } finally {
      // Small delay for the Lottie animation to play smoothly
      setTimeout(() => {
        setIsLoading(false);
      }, 800);
    }
  };

  // --- Loader State ---
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require("../../assets/loader/circleLoader.json")}
          autoPlay
          loop
          style={styles.lottieLoader}
        />
        <Text style={styles.loadingText}>Fetching Students...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {students.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No students found.</Text>
          <Text style={styles.emptySubtext}>
            Go back to the Home screen and add a student to see them here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => String(item.student_id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <StudentCard
              student={item}
              onPress={() =>
                // Navigate to the detail page, passing the specific student_id
                navigation.navigate("ViewStudentDetail", {
                  studentId: item.student_id,
                })
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  /* --- Loader Styles --- */
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  lottieLoader: {
    width: 150,
    height: 150,
  },
  loadingText: {
    fontFamily: "Roboto-Medium",
    color: COLORS.primary,
    fontSize: 16,
    marginTop: -20,
  },
  /* --- List Styles --- */
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  /* --- Reusable Card Styles --- */
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F7F7", // Very light blue-grey matching your mockup
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 16,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 1.5,
    borderColor: "#E0EBEB",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    resizeMode: "cover",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  nameText: {
    fontFamily: "Roboto-Regular",
    fontSize: 18,
    color: COLORS.darkest,
    marginBottom: 4,
  },
  subtitleText: {
    fontFamily: "Roboto-Regular",
    fontSize: 13,
    color: "#8CAEAE", // Muted teal-grey matching mockup
  },
  arrowButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary, // Dark Teal
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  /* --- Empty State Styles --- */
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontFamily: "Roboto-Bold",
    fontSize: 18,
    color: COLORS.darkest,
    marginBottom: 10,
  },
  emptySubtext: {
    fontFamily: "Roboto-Regular",
    fontSize: 15,
    color: "#7A9595",
    textAlign: "center",
    lineHeight: 22,
  },
});
