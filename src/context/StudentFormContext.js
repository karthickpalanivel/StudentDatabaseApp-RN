import React, { createContext, useState } from "react";

export const StudentFormContext = createContext();

export const StudentFormProvider = ({ children }) => {
  // This holds the default, empty state of the form
  const initialFormState = {
    imageUri: null,
    name: "",
    studentClass: "",
    section: "",
    schoolName: "",
    gender: "Male",
    dob: new Date(),
    bloodGroup: "",
    fatherName: "",
    motherName: "",
    parentContact: "",
    address1: "",
    address2: "",
    isSameAddress: false,
    city: "",
    state: "",
    zip: "",
    emergencyContact: "",
    location: {
      lat: 13.013694312663684,
      lng: 80.2219636458676,
      address:
        "267C+CQ Chennai, Tamil Nadu\nNew No.7, Old, 147, Anna Salai, Little Mount...",
    },
  };

  const [formData, setFormData] = useState(initialFormState);

  // Helper to update a single field
  const updateFormData = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Helper to clear the form after submission
  const resetForm = () => {
    setFormData(initialFormState);
  };

  return (
    <StudentFormContext.Provider
      value={{ formData, updateFormData, resetForm }}
    >
      {children}
    </StudentFormContext.Provider>
  );
};
