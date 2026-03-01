import React, { useState, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";

// Imports
import { COLORS } from "../theme/colors";
import db from "../database/database";
import { validatePhone, validateZipCode } from "../database/validators";
import { StudentFormContext } from "../context/StudentFormContext";

// ==========================================
// REUSABLE UI COMPONENTS
// ==========================================

const FormInput = ({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  maxLength,
  icon,
  isReadOnly = false,
}) => (
  <View style={styles.inputContainer}>
    <View style={styles.inputBorder}>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        editable={!isReadOnly}
      />
      {icon && <View style={styles.inputIcon}>{icon}</View>}
    </View>
    <View style={styles.floatingLabelContainer}>
      <Text style={styles.floatingLabel}>{label}</Text>
    </View>
  </View>
);

const FormDropdown = ({ label, value, options, onSelect }) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
        style={styles.inputContainer}
      >
        <View style={styles.inputBorder}>
          <Text
            style={[
              styles.textInput,
              { color: value ? COLORS.darkest : "transparent" },
            ]}
          >
            {value}
          </Text>
          <MaterialIcons
            name="arrow-drop-down"
            size={24}
            color={COLORS.primary}
            style={styles.inputIcon}
          />
        </View>
        <View style={styles.floatingLabelContainer}>
          <Text style={styles.floatingLabel}>{label}</Text>
        </View>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.dropdownModal}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    onSelect(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

// ==========================================
// MAIN SCREEN COMPONENT
// ==========================================

export default function AddStudentPage({ navigation }) {
  const scrollViewRef = useRef(null);

  // --- Global State ---
  const { formData, updateFormData, resetForm } =
    useContext(StudentFormContext);

  // --- Local UI States ---
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // ==========================================
  // IMAGE HANDLING (Camera & Gallery)
  // ==========================================
  const takePhoto = async () => {
    try {
      // 1. Request Camera Permissions
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "You need to grant camera access to take a photo.",
        );
        return;
      }

      // 2. Launch Camera
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        updateFormData("imageUri", base64Uri);
      }
    } catch (error) {
      console.error("Camera Error: ", error);
      Alert.alert("Error", "Could not open the camera.");
    }
  };

  const pickFromGallery = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        updateFormData("imageUri", base64Uri);
      }
    } catch (error) {
      console.error("Image Picker Error: ", error);
      Alert.alert("Error", "Could not open the photo library.");
    }
  };

  const handleImageSelection = () => {
    // Show native action sheet to choose between Camera and Gallery
    Alert.alert(
      "Profile Picture",
      "Choose an option to set the profile picture",
      [
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Gallery", onPress: pickFromGallery },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  // --- Handlers ---
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) updateFormData("dob", selectedDate);
  };

  const throwError = (msg) => {
    setErrorMessage(msg);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleSubmit = () => {
    setErrorMessage("");
    const finalAddress2 = formData.isSameAddress
      ? formData.address1
      : formData.address2;
    const safeDate = new Date(formData.dob);
    const formattedDob = safeDate.toLocaleDateString("en-GB");

    // Strict Validation
    if (!formData.imageUri)
      return throwError("Please select a profile image for the student.");
    if (
      !formData.name ||
      !formData.studentClass ||
      !formData.section ||
      !formData.schoolName ||
      !formData.bloodGroup ||
      !formData.fatherName ||
      !formData.motherName ||
      !formData.address1 ||
      !formData.city ||
      !formData.state
    ) {
      return throwError("Please fill out all required text fields.");
    }
    if (
      !validatePhone(formData.parentContact) ||
      !validatePhone(formData.emergencyContact)
    ) {
      return throwError(
        "Phone and Emergency contacts must be exactly 10 digits.",
      );
    }
    if (!validateZipCode(formData.zip)) {
      return throwError("Zip Code must be exactly 6 digits.");
    }

    try {
      const existingStudent = db.getFirstSync(
        "SELECT * FROM students WHERE LOWER(student_name) = LOWER(?) AND student_parent_contact_no = ?",
        [formData.name, formData.parentContact],
      );

      if (existingStudent) {
        return throwError(
          "A student with this name and parent contact already exists.",
        );
      }

      db.runSync(
        `INSERT INTO students (
          student_picture_uri, student_name, student_class, student_section, student_school_name,
          student_gender, student_date_of_birth, student_blood_group, student_father_name, student_mother_name,
          student_parent_contact_no, student_address_1, student_address_2, student_city, student_state,
          student_zip_code, student_emergency_contact, student_location_lat, student_location_lon
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          formData.imageUri,
          formData.name,
          parseInt(formData.studentClass, 10),
          formData.section,
          formData.schoolName,
          formData.gender,
          formattedDob,
          formData.bloodGroup,
          formData.fatherName,
          formData.motherName,
          formData.parentContact,
          formData.address1,
          finalAddress2,
          formData.city,
          formData.state,
          formData.zip,
          formData.emergencyContact,
          formData.location.lat,
          formData.location.lng,
        ],
      );

      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
        resetForm();
        navigation.navigate("ViewStudent");
      }, 2500);
    } catch (error) {
      console.error("Database Save Error:", error);
      throwError("Database failed to save. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={20} color={COLORS.white} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* 1. Image Picker (Updated to use handleImageSelection) */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            onPress={handleImageSelection}
            activeOpacity={0.8}
            style={styles.imagePickerContainer}
          >
            {formData.imageUri ? (
              <Image
                source={{ uri: formData.imageUri }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.placeholderCircle}>
                <Ionicons
                  name="image-outline"
                  size={40}
                  color={COLORS.primary}
                />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color={COLORS.white} />
            </View>
          </TouchableOpacity>
        </View>

        {/* 2. Basic Info */}
        <FormInput
          label="Name"
          value={formData.name}
          onChangeText={(val) => updateFormData("name", val)}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <FormDropdown
              label="Class"
              value={formData.studentClass}
              options={[
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "10",
                "11",
                "12",
              ]}
              onSelect={(val) => updateFormData("studentClass", val)}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <FormDropdown
              label="Section"
              value={formData.section}
              options={["A", "B", "C", "D", "E", "F"]}
              onSelect={(val) => updateFormData("section", val)}
            />
          </View>
        </View>

        <FormInput
          label="School name"
          value={formData.schoolName}
          onChangeText={(val) => updateFormData("schoolName", val)}
        />

        {/* 3. Gender */}
        <View style={styles.radioGroup}>
          <Text style={styles.radioLabelText}>Gender :</Text>
          <Pressable
            style={styles.radioButton}
            onPress={() => updateFormData("gender", "Male")}
          >
            <Text style={styles.radioText}>Male</Text>
            <View
              style={[
                styles.radioCircle,
                formData.gender === "Male" && styles.radioCircleSelected,
              ]}
            >
              {formData.gender === "Male" && (
                <View style={styles.radioInnerCircle} />
              )}
            </View>
          </Pressable>
          <Pressable
            style={styles.radioButton}
            onPress={() => updateFormData("gender", "Female")}
          >
            <Text style={styles.radioText}>Female</Text>
            <View
              style={[
                styles.radioCircle,
                formData.gender === "Female" && styles.radioCircleSelected,
              ]}
            >
              {formData.gender === "Female" && (
                <View style={styles.radioInnerCircle} />
              )}
            </View>
          </Pressable>
        </View>

        {/* 4. DOB & Blood Group */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowDatePicker(true)}
        >
          <FormInput
            label="DOB"
            value={new Date(formData.dob).toLocaleDateString("en-GB")}
            isReadOnly
            icon={
              <Ionicons
                name="calendar-outline"
                size={20}
                color={COLORS.light}
              />
            }
          />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(formData.dob)}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <FormDropdown
          label="Blood Group"
          value={formData.bloodGroup}
          options={[
            "A+",
            "A-",
            "B+",
            "B-",
            "O+",
            "O-",
            "AB+",
            "AB-",
            "A1+",
            "A1-",
          ]}
          onSelect={(val) => updateFormData("bloodGroup", val)}
        />

        {/* 5. Parent Info */}
        <FormInput
          label="Father's name"
          value={formData.fatherName}
          onChangeText={(val) => updateFormData("fatherName", val)}
        />
        <FormInput
          label="Mother's name"
          value={formData.motherName}
          onChangeText={(val) => updateFormData("motherName", val)}
        />
        <FormInput
          label="Parent's contact no"
          value={formData.parentContact}
          onChangeText={(val) => updateFormData("parentContact", val)}
          keyboardType="numeric"
          maxLength={10}
        />

        {/* 6. Address Info */}
        <FormInput
          label="Address 1"
          value={formData.address1}
          onChangeText={(val) => updateFormData("address1", val)}
        />

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() =>
            updateFormData("isSameAddress", !formData.isSameAddress)
          }
          activeOpacity={0.8}
        >
          <Ionicons
            name={formData.isSameAddress ? "checkbox" : "square-outline"}
            size={20}
            color={COLORS.primary}
          />
          <Text style={styles.checkboxText}>Same as Address 1</Text>
        </TouchableOpacity>

        <FormInput
          label="Address 2"
          value={formData.isSameAddress ? formData.address1 : formData.address2}
          onChangeText={(val) => updateFormData("address2", val)}
          isReadOnly={formData.isSameAddress}
        />
        <FormInput
          label="City"
          value={formData.city}
          onChangeText={(val) => updateFormData("city", val)}
        />
        <FormInput
          label="State"
          value={formData.state}
          onChangeText={(val) => updateFormData("state", val)}
        />
        <FormInput
          label="Zip"
          value={formData.zip}
          onChangeText={(val) => updateFormData("zip", val)}
          keyboardType="numeric"
          maxLength={6}
        />
        <FormInput
          label="Emergency contact no."
          value={formData.emergencyContact}
          onChangeText={(val) => updateFormData("emergencyContact", val)}
          keyboardType="numeric"
          maxLength={10}
        />

        {/* 7. Map Location View */}
        <View style={styles.mapSection}>
          <Text style={styles.mapLabelText}>Select Location</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: formData.location.lat,
                longitude: formData.location.lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              mapType="none"
            >
              <UrlTile
                urlTemplate="https://a.tile.openstreetmap.de/{z}/{x}/{y}.png"
                maximumZ={19}
                flipY={false}
              />
              <Marker
                coordinate={{
                  latitude: formData.location.lat,
                  longitude: formData.location.lng,
                }}
                pinColor={COLORS.primary}
              />
            </MapView>

            <View style={styles.mapOverlayBox}>
              <Text style={styles.mapAddressText} numberOfLines={2}>
                {formData.location.address}
              </Text>
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => navigation.navigate("AddLocation")}
              >
                <Text style={styles.mapButtonText}>Select Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 8. Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>SUBMIT</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.loaderContainer}>
            <LottieView
              source={require("../../assets/loader/successTick.json")}
              autoPlay
              loop={false}
              style={{ width: 130, height: 130 }}
            />
            <Text style={styles.successText}>Student Data Saved!</Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 40,
  },
  errorBanner: {
    backgroundColor: "#D9534F",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  errorBannerText: {
    fontFamily: "Roboto-Medium",
    color: COLORS.white,
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  profileSection: { alignItems: "center", marginBottom: 30 },
  imagePickerContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E6F0F0",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  placeholderCircle: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#B0C4C4",
  },
  profileImage: { width: "100%", height: "100%", borderRadius: 50 },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 5,
    backgroundColor: COLORS.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  inputContainer: { position: "relative", marginBottom: 25, height: 50 },
  inputBorder: {
    flex: 1,
    borderWidth: 1.2,
    borderColor: "#8CAEAE",
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  textInput: {
    flex: 1,
    fontFamily: "Roboto-Regular",
    fontSize: 16,
    color: COLORS.darkest,
    height: "100%",
  },
  inputIcon: { marginLeft: 10 },
  floatingLabelContainer: {
    position: "absolute",
    top: -10,
    left: 10,
    backgroundColor: COLORS.white,
    paddingHorizontal: 5,
  },
  floatingLabel: {
    fontFamily: "Roboto-Regular",
    fontSize: 12,
    color: "#66A5AD",
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownModal: {
    width: "80%",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    maxHeight: 300,
    padding: 10,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownItemText: {
    fontFamily: "Roboto-Regular",
    fontSize: 16,
    textAlign: "center",
    color: COLORS.darkest,
  },
  radioGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    paddingHorizontal: 5,
  },
  radioLabelText: {
    fontFamily: "Roboto-Regular",
    fontSize: 15,
    color: "#66A5AD",
    marginRight: 20,
  },
  radioButton: { flexDirection: "row", alignItems: "center", marginRight: 25 },
  radioText: {
    fontFamily: "Roboto-Regular",
    fontSize: 15,
    color: COLORS.darkest,
    marginRight: 8,
  },
  radioCircle: {
    height: 18,
    width: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.darkest,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: { borderColor: COLORS.primary },
  radioInnerCircle: {
    height: 9,
    width: 9,
    borderRadius: 4.5,
    backgroundColor: COLORS.primary,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -10,
    marginBottom: 20,
    marginLeft: 5,
  },
  checkboxText: {
    fontFamily: "Roboto-Regular",
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
  },
  mapSection: { marginBottom: 35 },
  mapLabelText: {
    fontFamily: "Roboto-Regular",
    fontSize: 13,
    color: "#66A5AD",
    marginBottom: 5,
    marginLeft: 5,
  },
  mapContainer: {
    height: 180,
    borderRadius: 5,
    overflow: "hidden",
    borderWidth: 1.2,
    borderColor: "#8CAEAE",
    position: "relative",
  },
  map: { ...StyleSheet.absoluteFillObject },
  mapOverlayBox: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mapAddressText: {
    flex: 1,
    fontFamily: "Roboto-Regular",
    fontSize: 12,
    color: COLORS.darkest,
    marginRight: 10,
  },
  mapButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  mapButtonText: {
    fontFamily: "Roboto-Regular",
    fontSize: 12,
    color: COLORS.white,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
  },
  submitButtonText: {
    fontFamily: "Roboto-Bold",
    color: COLORS.white,
    fontSize: 16,
    letterSpacing: 1,
  },
  loaderContainer: {
    width: 220,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    elevation: 10,
  },
  successText: {
    fontFamily: "Roboto-Bold",
    color: COLORS.primary,
    marginTop: -10,
    fontSize: 18,
  },
});
