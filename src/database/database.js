import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("student_app.db");

export const initDB = () => {
  try {
    // TEMPORARY DEV FIX: Drops the old strict tables so the new optional ones can be built.
    // REMOVE THESE TWO LINES AFTER YOU RUN THE APP ONCE!
    // db.execSync(`DROP TABLE IF EXISTS student_app_users;`);
    // db.execSync(`DROP TABLE IF EXISTS students;`);

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
        student_class INTEGER,
        student_section TEXT CHECK(student_section IS NULL OR student_section = '' OR length(student_section) = 1),
        student_school_name TEXT,
        student_gender TEXT CHECK(student_gender IS NULL OR student_gender = '' OR LOWER(student_gender) IN ('male', 'female')),
        student_date_of_birth TEXT, 
        student_blood_group TEXT,
        student_father_name TEXT,
        student_mother_name TEXT,
        student_parent_contact_no TEXT CHECK(student_parent_contact_no IS NULL OR student_parent_contact_no = '' OR length(student_parent_contact_no) = 10),
        student_address_1 TEXT,
        student_address_2 TEXT,
        student_city TEXT,
        student_state TEXT,
        student_zip_code TEXT CHECK(student_zip_code IS NULL OR student_zip_code = '' OR length(student_zip_code) = 6),
        student_emergency_contact TEXT CHECK(student_emergency_contact IS NULL OR student_emergency_contact = '' OR length(student_emergency_contact) = 10),
        student_location_lat REAL NOT NULL,
        student_location_lon REAL NOT NULL,
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
      "Database initialized successfully with updated optional constraints.",
    );
  } catch (error) {
    console.error("Critical error initializing SQLite database: ", error);
  }
};

export default db;
