# 🎓 Student Database App

A robust, offline-first mobile application built with React Native and Expo. This application empowers administrators and teachers to securely manage, view, and geolocate student records directly from their mobile devices without needing an active internet connection for core database operations.

---

## 🎯 Purpose and Aim
The primary aim of this application is to provide a **secure, portable, and highly reliable** student management system. 

By utilizing a local SQLite database, the app ensures that sensitive student data—including emergency contacts, blood groups, and residential addresses—remains strictly on the user's device. This eliminates the latency and security risks associated with cloud databases. It is designed for seamless user experience, featuring intuitive map integrations, dynamic loading animations, and complex state management to make data entry as frictionless as possible.

---

## ✨ Key Features
* **Offline-First Architecture:** All user and student data is stored locally using SQLite.
* **Persistent Authentication:** Secure login system using SQLite for credential verification and `AsyncStorage` for session management.
* **Interactive Geolocation:** View all students on a dynamic, auto-zooming map, or pin specific residential addresses using `react-native-maps`.
* **Media Handling:** Capture student photos via the device camera or gallery and store them securely as Base64 BLOBs directly within the database.
* **Premium UI/UX:** Features high-quality Lottie animations for loading states and success feedback, alongside a pixel-perfect, custom-styled interface.
* **Global State Management:** Seamlessly navigate between complex forms and map screens without losing inputted data using the React Context API.

---

## 🛠 Tech Stack
* **Framework:** React Native (Expo)
* **Navigation:** React Navigation (Native Stack)
* **Database:** `expo-sqlite`
* **Local Storage:** `@react-native-async-storage/async-storage`
* **Maps & Location:** `react-native-maps`, `expo-location`, `expo-network`
* **Media:** `expo-image-picker`
* **Animations:** `lottie-react-native`

---

## 📂 Project Structure

```text
📦 student-database-app
 ┣ 📂 assets
 ┃ ┣ 📂 fonts       # Custom Roboto typography
 ┃ ┣ 📂 Images      # UI Illustrations, Icons, and Mockups
 ┃ ┗ 📂 loader      # Lottie JSON animations (circleLoader, successTick)
 ┣ 📂 src
 ┃ ┣ 📂 context
 ┃ ┃ ┗ 📜 StudentFormContext.js    # Global state for the Add Student form
 ┃ ┣ 📂 database
 ┃ ┃ ┣ 📜 database.js              # SQLite initialization and table schemas
 ┃ ┃ ┗ 📜 validators.js            # Regex validators for forms (Phone, Zip, etc.)
 ┃ ┣ 📂 screens
 ┃ ┃ ┣ 📜 InitialPage.jsx          # Splash / Welcome Screen
 ┃ ┃ ┣ 📜 LoginPage.jsx            # Authentication and session creation
 ┃ ┃ ┣ 📜 SignUpPage.jsx           # User registration and DB insertion
 ┃ ┃ ┣ 📜 HomePage.jsx             # Main dashboard and navigation hub
 ┃ ┃ ┣ 📜 AddStudentPage.jsx       # Data entry form (Image, details, location)
 ┃ ┃ ┣ 📜 AddLocationPage.jsx      # Map interface to pin a student's address
 ┃ ┃ ┣ 📜 ViewStudentPage.jsx      # Dynamic list view of all active students
 ┃ ┃ ┣ 📜 ViewStudentDetailPage.jsx# Detailed profile view for a specific student
 ┃ ┃ ┗ 📜 MapViewPage.jsx          # Global map plotting all students
 ┃ ┗ 📂 theme
 ┃ ┃ ┗ 📜 colors.js                # Centralized color palette
 ┣ 📜 App.js                       # Entry point, Provider wrapping, and Routing
 ┗ 📜 package.json

```

---

## 📱 Screen-by-Screen Breakdown

### 1. Authentication Flow (`LoginPage` & `SignUpPage`)

* **Features:** Validates user inputs (e.g., strong passwords, 10-digit phone numbers). Checks against the SQLite `student_app_users` table to prevent duplicate registrations and verify login credentials.
* **UX:** Uses Lottie overlays during database queries to prevent multiple button taps and provide visual feedback.

### 2. Dashboard (`HomePage`)

* **Features:** Acts as the central hub. It reads the session token from `AsyncStorage` to greet the specific user by name. Includes a secure logout modal that destroys the local session token and resets the navigation stack.

### 3. Data Entry (`AddStudentPage` & `AddLocationPage`)

* **Features:** A massive, scrollable form utilizing custom dropdowns, date pickers, and radio buttons.
* **Media:** Allows users to take a photo or pick from the gallery, instantly converting the image to a Base64 string for safe database storage.
* **Context API:** When a user taps "Select Location", they are taken to the `AddLocationPage` map. The Context API ensures that all previously typed form data (name, parents, etc.) is preserved when they return with the coordinates.

### 4. Data Viewing (`ViewStudentPage` & `ViewStudentDetailPage`)

* **Features:** Uses `useFocusEffect` to query the SQLite database every time the screen is opened, ensuring the list is always up-to-date. Displays custom-styled cards.
* **Detail View:** Passes the specific `student_id` through navigation parameters to fetch and display the full profile, including a non-interactive map thumbnail of their address.

### 5. Geographical Overview (`MapViewPage`)

* **Features:** Queries all students with valid coordinates. Dynamically calculates the `latitudeDelta` and `longitudeDelta` to automatically zoom and fit all student markers perfectly on the screen.
* **Interactivity:** Custom markers feature the student's face. Tapping a marker expands it into a labeled pill and smoothly pans the camera to center on that student.

---

## 🗄 Database & State Architecture

### SQLite Interaction

The app utilizes a strictly typed local database.

* **`student_app_users`:** Stores administrative users. Passwords and phone numbers are verified before insertion.
* **`students`:** Contains 20+ columns. Crucially, images are stored as `TEXT` (Base64 URI strings) rather than local file paths. This prevents broken images if the OS clears the app's cache directory.

### Authentication Strategy

1. **Login:** User credentials checked in SQLite. If valid, the `user_id` and `user_name` are saved to `AsyncStorage`.
2. **App Launch:** `App.js` checks `AsyncStorage` before rendering. If a token exists, the user bypasses the Login screen entirely.
3. **Logout:** `AsyncStorage.multiRemove()` destroys the cached data and resets the navigation tree.

---

## 🚀 Installation and Setup

1. **Clone the repository:**
```bash
git clone https://github.com/karthickpalanivel/StudentDatabaseApp-RN.git
cd student-database-app

```


2. **Install dependencies:**
```bash
npm install

```


3. **Start the Expo server:**
```bash
npx expo start -c

```


4. **Run the App:**
* **Physical Device:** Download the "Expo Go" app on your iOS/Android device and scan the QR code in the terminal.
* **Emulator:** Press `a` for Android or `i` for iOS in the terminal.



*Note: For the Camera functionality to work, testing on a physical device is highly recommended, as emulators often lack camera hardware access.*
