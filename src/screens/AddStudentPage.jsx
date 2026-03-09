import React, { useState, useEffect, useContext, useRef } from "react";
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
import { WebView } from "react-native-webview";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { COLORS } from "../theme/colors";
import db from "../database/database";
import { validatePhone, validateZipCode } from "../database/validators";
import { StudentFormContext } from "../context/StudentFormContext";

const staticMapHTML = (lat, lon) => `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<style>*{margin:0;padding:0}#map{width:100vw;height:100vh}</style>
</head><body><div id="map"></div>
<script>
var map=L.map('map',{zoomControl:false,dragging:false,touchZoom:false,
  scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false})
  .setView([${lat},${lon}],16);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  {maxZoom:19,attribution:''}).addTo(map);
L.circleMarker([${lat},${lon}],
  {radius:9,color:'#07575B',fillColor:'#07575B',fillOpacity:1,weight:2}).addTo(map);
</script></body></html>`;

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
  const [vis, setVis] = useState(false);
  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setVis(true)}
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
      <Modal visible={vis} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVis(false)}
        >
          <View style={styles.dropdownModal}>
            <FlatList
              data={options}
              keyExtractor={(i) => i}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    onSelect(item);
                    setVis(false);
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

export default function AddStudentPage({ navigation }) {
  const scrollViewRef = useRef(null);
  const { formData, updateFormData, resetForm } =
    useContext(StudentFormContext);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (e.data.action.type === "GO_BACK") {
        e.preventDefault();
        navigation.navigate("Home");
      }
    });
    return unsubscribe;
  }, [navigation]);

  // --- RE-ENABLED 1:1 CROPPING ---
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission Required", "Camera access needed.");
      return;
    }
    let r = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true, // Cropping enabled
      aspect: [1, 1], // 1:1 Square ratio
      quality: 0.3,
      base64: true,
    });
    if (!r.canceled && r.assets?.length)
      updateFormData(
        "imageUri",
        `data:image/jpeg;base64,${r.assets[0].base64}`,
      );
  };

  const pickFromGallery = async () => {
    let r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true, // Cropping enabled
      aspect: [1, 1], // 1:1 Square ratio
      quality: 0.3,
      base64: true,
    });
    if (!r.canceled && r.assets?.length)
      updateFormData(
        "imageUri",
        `data:image/jpeg;base64,${r.assets[0].base64}`,
      );
  };

  const handleImageSelection = () =>
    Alert.alert("Profile Picture", "Choose an option", [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Gallery", onPress: pickFromGallery },
      { text: "Cancel", style: "cancel" },
    ]);

  const handleDateChange = (e, d) => {
    setShowDatePicker(Platform.OS === "ios");
    if (d) updateFormData("dob", d);
  };

  const throwError = (msg) => {
    setErrorMessage(msg);
    scrollViewRef.current?.scrollToPosition(0, 0, true);
  };

  // --- HELPER TO EXECUTE DATABASE INSERT ---
  const executeSubmission = (formattedDob, parsedClass, finalAddr2) => {
    try {
      if (formData.parentContact) {
        const existing = db.getFirstSync(
          "SELECT * FROM students WHERE LOWER(student_name)=LOWER(?) AND student_parent_contact_no=?",
          [formData.name, formData.parentContact],
        );
        if (existing)
          return throwError(
            "A student with this name and contact already exists.",
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
          parsedClass,
          formData.section || null,
          formData.schoolName || null,
          formData.gender || null,
          formattedDob,
          formData.bloodGroup || null,
          formData.fatherName || null,
          formData.motherName || null,
          formData.parentContact || null,
          formData.address1 || null,
          finalAddr2 || null,
          formData.city || null,
          formData.state || null,
          formData.zip || null,
          formData.emergencyContact || null,
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
    } catch (e) {
      console.error(e);
      throwError("Database failed to save. Please try again.");
    }
  };

  const handleSubmit = () => {
    setErrorMessage("");
    const finalAddr2 = formData.isSameAddress
      ? formData.address1
      : formData.address2;

    // --- Validations ---
    if (!formData.imageUri) return throwError("Please select a profile image.");
    if (!formData.name.trim())
      return throwError("Please enter the student's name.");

    if (formData.parentContact && !validatePhone(formData.parentContact))
      return throwError("Parent's phone must be exactly 10 digits.");
    if (formData.emergencyContact && !validatePhone(formData.emergencyContact))
      return throwError("Emergency contact must be exactly 10 digits.");
    if (formData.zip && !validateZipCode(formData.zip))
      return throwError("Zip Code must be exactly 6 digits.");

    const formattedDob = formData.dob
      ? new Date(formData.dob).toLocaleDateString("en-GB")
      : null;
    const parsedClass = formData.studentClass
      ? parseInt(formData.studentClass, 10)
      : null;

    // --- CHECK FOR DEFAULT LOCATION ---
    const isDefaultLocation =
      formData.location.lat === 13.013694312663684 &&
      formData.location.lng === 80.2219636458676;

    if (isDefaultLocation) {
      Alert.alert(
        "Default Location Detected",
        "You haven't changed the default map location. Are you sure this default address is fine to enter?",
        [
          { text: "No, Change It", style: "cancel" },
          {
            text: "Yes, Save It",
            onPress: () =>
              executeSubmission(formattedDob, parsedClass, finalAddr2),
          },
        ],
      );
    } else {
      executeSubmission(formattedDob, parsedClass, finalAddr2);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        enableOnAndroid={true}
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning" size={20} color={COLORS.white} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

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

        <FormInput
          label="Name"
          value={formData.name}
          onChangeText={(v) => updateFormData("name", v)}
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
              onSelect={(v) => updateFormData("studentClass", v)}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <FormDropdown
              label="Section"
              value={formData.section}
              options={["A", "B", "C", "D", "E", "F"]}
              onSelect={(v) => updateFormData("section", v)}
            />
          </View>
        </View>
        <FormInput
          label="School name"
          value={formData.schoolName}
          onChangeText={(v) => updateFormData("schoolName", v)}
        />

        <View style={styles.radioGroup}>
          <Text style={styles.radioLabelText}>Gender :</Text>
          {["Male", "Female"].map((g) => (
            <Pressable
              key={g}
              style={styles.radioButton}
              onPress={() => updateFormData("gender", g)}
            >
              <Text style={styles.radioText}>{g}</Text>
              <View
                style={[
                  styles.radioCircle,
                  formData.gender === g && styles.radioCircleSelected,
                ]}
              >
                {formData.gender === g && (
                  <View style={styles.radioInnerCircle} />
                )}
              </View>
            </Pressable>
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowDatePicker(true)}
        >
          <FormInput
            label="DOB"
            value={
              formData.dob
                ? new Date(formData.dob).toLocaleDateString("en-GB")
                : "--/--/----"
            }
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
            value={formData.dob ? new Date(formData.dob) : new Date()}
            mode="date"
            display="default"
            maximumDate={new Date()}
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
          onSelect={(v) => updateFormData("bloodGroup", v)}
        />
        <FormInput
          label="Father's name"
          value={formData.fatherName}
          onChangeText={(v) => updateFormData("fatherName", v)}
        />
        <FormInput
          label="Mother's name"
          value={formData.motherName}
          onChangeText={(v) => updateFormData("motherName", v)}
        />
        <FormInput
          label="Parent's contact no"
          value={formData.parentContact}
          onChangeText={(v) => updateFormData("parentContact", v)}
          keyboardType="numeric"
          maxLength={10}
        />
        <FormInput
          label="Address 1"
          value={formData.address1}
          onChangeText={(v) => updateFormData("address1", v)}
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
          onChangeText={(v) => updateFormData("address2", v)}
          isReadOnly={formData.isSameAddress}
        />
        <FormInput
          label="City"
          value={formData.city}
          onChangeText={(v) => updateFormData("city", v)}
        />
        <FormInput
          label="State"
          value={formData.state}
          onChangeText={(v) => updateFormData("state", v)}
        />
        <FormInput
          label="Zip"
          value={formData.zip}
          onChangeText={(v) => updateFormData("zip", v)}
          keyboardType="numeric"
          maxLength={6}
        />
        <FormInput
          label="Emergency contact no."
          value={formData.emergencyContact}
          onChangeText={(v) => updateFormData("emergencyContact", v)}
          keyboardType="numeric"
          maxLength={10}
        />

        <View style={styles.mapSection}>
          <Text style={styles.mapLabelText}>Select Location</Text>
          <View style={styles.mapContainer}>
            <WebView
              key={`${formData.location.lat}_${formData.location.lng}`}
              source={{
                html: staticMapHTML(
                  formData.location.lat,
                  formData.location.lng,
                ),
              }}
              style={StyleSheet.absoluteFillObject}
              scrollEnabled={false}
              pointerEvents="none"
            />
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

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>SUBMIT</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

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
    </View>
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
    padding: 0,
    textAlignVertical: "center",
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
