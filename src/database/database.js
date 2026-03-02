
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("student_app.db");

export const initDB = () => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS student_app_users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name TEXT,
        phone_number TEXT CHECK(length(phone_number) = 10),
        password TEXT, 
        user_status INTEGER DEFAULT 1, 
        user_created_time TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS students (
        student_picture_uri TEXT NOT NULL, 
        student_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_name TEXT NOT NULL,
        student_class INTEGER NOT NULL,
        student_section TEXT NOT NULL CHECK(length(student_section) = 1),
        student_school_name TEXT NOT NULL,
        student_gender TEXT CHECK(LOWER(student_gender) IN ('male', 'female')),
        student_date_of_birth TEXT NOT NULL, 
        student_blood_group TEXT NOT NULL,
        student_father_name TEXT NOT NULL,
        student_mother_name TEXT NOT NULL,
        student_parent_contact_no TEXT CHECK(length(student_parent_contact_no) = 10) NOT NULL,
        student_address_1 TEXT NOT NULL,
        student_address_2 TEXT NOT NULL,
        student_city TEXT NOT NULL,
        student_state TEXT NOT NULL,
        student_zip_code TEXT CHECK(length(student_zip_code) = 6) NOT NULL,
        student_emergency_contact TEXT CHECK(length(student_emergency_contact) = 10) NOT NULL,
        student_location_lat REAL,
        student_location_lon REAL,
        student_is_active INTEGER DEFAULT 1 NOT NULL,
        student_created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        student_lastly_updated TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TRIGGER IF NOT EXISTS update_student_timestamp
      AFTER UPDATE ON students
      BEGIN
        UPDATE students 
        SET student_lastly_updated = CURRENT_TIMESTAMP 
        WHERE student_id = NEW.student_id;
      END;
    `);

    console.log(
      "Database initialized successfully. Data is now persistent.",
    );
  } catch (error) {
    console.error("Critical error initializing SQLite database: ", error);
  }
};

export default db;

// import * as SQLite from "expo-sqlite";

// const db = SQLite.openDatabaseSync("student_app.db");

// export const initDB = () => {
//   try {
//     // TEMPORARY DEV FIX: This deletes the old, broken tables so they can be rebuilt fresh.
//     // (You can remove these two DROP lines once the app runs successfully once)
//     // db.execSync(`DROP TABLE IF EXISTS student_app_users;`);
//     // db.execSync(`DROP TABLE IF EXISTS students;`);

//     db.execSync(`
//       CREATE TABLE IF NOT EXISTS student_app_users (
//         user_id INTEGER PRIMARY KEY AUTOINCREMENT,
//         user_name TEXT,
//         phone_number TEXT CHECK(length(phone_number) = 10),
//         password TEXT, 
//         user_status INTEGER DEFAULT 1, 
//         user_created_time TEXT DEFAULT CURRENT_TIMESTAMP
//       );

//       CREATE TABLE IF NOT EXISTS students (
//         student_picture_uri TEXT NOT NULL, /* Changed to match the View pages and handle Base64 strings */
//         student_id INTEGER PRIMARY KEY AUTOINCREMENT,
//         student_name TEXT NOT NULL,
//         student_class INTEGER NOT NULL,
//         student_section TEXT NOT NULL CHECK(length(student_section) = 1),
//         student_school_name TEXT NOT NULL,
//         student_gender TEXT CHECK(LOWER(student_gender) IN ('male', 'female')),
//         student_date_of_birth TEXT NOT NULL, 
//         student_blood_group TEXT NOT NULL,
//         student_father_name TEXT NOT NULL,
//         student_mother_name TEXT NOT NULL,
//         student_parent_contact_no TEXT CHECK(length(student_parent_contact_no) = 10) NOT NULL,
//         student_address_1 TEXT NOT NULL,
//         student_address_2 TEXT NOT NULL,
//         student_city TEXT NOT NULL,
//         student_state TEXT NOT NULL,
//         student_zip_code TEXT CHECK(length(student_zip_code) = 6) NOT NULL,
//         student_emergency_contact TEXT CHECK(length(student_emergency_contact) = 10) NOT NULL,
//         student_location_lat REAL,
//         student_location_lon REAL,
//         student_is_active INTEGER DEFAULT 1 NOT NULL,
//         student_created_at TEXT DEFAULT CURRENT_TIMESTAMP,
//         student_lastly_updated TEXT DEFAULT CURRENT_TIMESTAMP
//       );

//       CREATE TRIGGER IF NOT EXISTS update_student_timestamp
//       AFTER UPDATE ON students
//       BEGIN
//         UPDATE students 
//         SET student_lastly_updated = CURRENT_TIMESTAMP 
//         WHERE student_id = NEW.student_id;
//       END;
//     `);

//     console.log(
//       "Database initialized successfully with strict schema constraints.",
//     );
//   } catch (error) {
//     console.error("Critical error initializing SQLite database: ", error);
//   }
// };

// export default db;
