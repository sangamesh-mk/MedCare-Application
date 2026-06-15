import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  User, Doctor, Staff, Patient, HospitalRoom, Appointment, 
  MedicalRecord, EmergencyRequest, Notification, Message, 
  AuditLog, HospitalConfig, UserRole
} from "./src/types";

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Helper for generating custom IDs
function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

// Global DB Structure
interface DBStructure {
  users: User[];
  passwords: { [email: string]: string };
  otps: { [email: string]: { code: string; expiry: number; userPayload?: any } };
  doctors: Doctor[];
  staff: Staff[];
  patients: Patient[];
  departments: { id: string; name: string; headDoctorId: string; totalRooms: number }[];
  rooms: HospitalRoom[];
  appointments: Appointment[];
  medicalRecords: MedicalRecord[];
  emergencyRequests: EmergencyRequest[];
  notifications: Notification[];
  messages: Message[];
  auditLogs: AuditLog[];
  config: HospitalConfig;
}

// Standard Sample Data
const initialDB: DBStructure = {
  users: [
    { id: "u_admin", email: "admin@hospital.com", name: "Super Admin", role: "Super Admin", phone: "+1 (555) 019-2831", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80", status: "Active", isVerified: true },
    { id: "u_vance", email: "sarah.vance@hospital.com", name: "Dr. Sarah Vance", role: "Doctor", phone: "+1 (555) 014-9921", avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&h=150&q=80", status: "Active", isVerified: true },
    { id: "u_brody", email: "marcus.brody@hospital.com", name: "Dr. Marcus Brody", role: "Doctor", phone: "+1 (555) 012-7711", avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&h=150&q=80", status: "Active", isVerified: true },
    { id: "u_rivers", email: "caleb.rivers@hospital.com", name: "Nurse Caleb Rivers", role: "Staff / Nurse", phone: "+1 (555) 018-4421", avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=150&h=150&q=80", status: "Active", isVerified: true },
    { id: "u_doe", email: "jane.doe@hospital.com", name: "Nurse Jane Doe", role: "Staff / Nurse", phone: "+1 (555) 013-1122", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80", status: "Active", isVerified: true },
    { id: "u_miller", email: "johnathan.miller@hospital.com", name: "Johnathan Miller", role: "Patient", phone: "+1 (555) 017-8821", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80", status: "Active", isVerified: true },
    { id: "u_lopez", email: "maria.lopez@hospital.com", name: "Maria Lopez", role: "Patient", phone: "+1 (555) 016-1212", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80", status: "Active", isVerified: true }
  ],
  passwords: {
    "admin@hospital.com": "admin123",
    "sarah.vance@hospital.com": "doctor123",
    "marcus.brody@hospital.com": "doctor123",
    "caleb.rivers@hospital.com": "staff123",
    "jane.doe@hospital.com": "staff123",
    "johnathan.miller@hospital.com": "patient123",
    "maria.lopez@hospital.com": "patient123"
  },
  otps: {},
  doctors: [
    { id: "doc_vance", userId: "u_vance", name: "Dr. Sarah Vance", email: "sarah.vance@hospital.com", department: "Cardiology", phone: "+1 (555) 014-9921", specialty: "Interventional Cardiology", status: "Active", assignedPatients: ["pat_miller"], assignedStaff: ["st_rivers"], rooms: ["101", "102"] },
    { id: "doc_brody", userId: "u_brody", name: "Dr. Marcus Brody", email: "marcus.brody@hospital.com", department: "Neurology", phone: "+1 (555) 012-7711", specialty: "Neurosurgery & Stroke Specialist", status: "Active", assignedPatients: ["pat_lopez"], assignedStaff: ["st_doe"], rooms: ["204"] }
  ],
  staff: [
    { id: "st_rivers", userId: "u_rivers", name: "Nurse Caleb Rivers", email: "caleb.rivers@hospital.com", role: "Nurse", department: "Cardiology", phone: "+1 (555) 018-4421", status: "Active", assignedPatients: ["pat_miller"] },
    { id: "st_doe", userId: "u_doe", name: "Nurse Jane Doe", email: "jane.doe@hospital.com", role: "Nurse", department: "Neurology", phone: "+1 (555) 013-1122", status: "Active", assignedPatients: ["pat_lopez"] }
  ],
  patients: [
    {
      id: "pat_miller",
      userId: "u_miller",
      name: "Johnathan Miller",
      email: "johnathan.miller@hospital.com",
      phone: "+1 (555) 017-8821",
      age: 62,
      gender: "Male",
      bloodGroup: "O+",
      address: "472 Bluebell Wood Ave, Seattle, WA 98101",
      emergencyContact: { name: "Helen Miller", relationship: "Spouse", phone: "+1 (555) 017-8822" },
      diseaseDetails: "Acute Coronary Syndrome & Stage 1 Hypertension",
      admissionDate: "2026-06-10",
      status: "Admitted",
      doctorId: "doc_vance",
      staffId: "st_rivers",
      roomNumber: "101",
      bedNumber: "Bed A",
      medicalHistory: ["Coronary Angioplasty (2023)", "Type II Diabetes (Diagnosed 2018)"],
      currentMedications: ["Atorvastatin 40mg", "Metformin 500mg", "Aspirin 81mg"],
      allergies: ["Penicillin", "Sulfa Drugs"],
      doctorNotes: ["Monitor blood pressure every 2 hours.", "Avoid strenuous exercises. Schedule post-discharge cardiac MRI."],
      staffNotes: ["Patient reports slight fatigue but stable breathing.", "Breakfast administered. BP: 132/84."]
    },
    {
      id: "pat_lopez",
      userId: "u_lopez",
      name: "Maria Lopez",
      email: "maria.lopez@hospital.com",
      phone: "+1 (555) 016-1212",
      age: 34,
      gender: "Female",
      bloodGroup: "AB-",
      address: "182 Oakridge Blvd, Portland, OR 97201",
      emergencyContact: { name: "Luis Lopez", relationship: "Brother", phone: "+1 (555) 016-1213" },
      diseaseDetails: "Severe Migraine with Aura & Suspicion of Mini-Stroke TIA",
      admissionDate: "2026-06-12",
      status: "Admitted",
      doctorId: "doc_brody",
      staffId: "st_doe",
      roomNumber: "204",
      bedNumber: "Bed B",
      medicalHistory: ["Chronic Migraine", "Mild Asthma"],
      currentMedications: ["Sumatriptan 50mg as needed", "Albuterol inhaler"],
      allergies: ["Contrast Dye"],
      doctorNotes: ["Schedule Head Contrast-free CT Scan.", "Ensure absolute quiet environment, low light."],
      staffNotes: ["Patient experienced sound sensitivity; provided earplugs.", "Migraine cocktail administered at 08:30."]
    }
  ],
  departments: [
    { id: "dep_cardio", name: "Cardiology", headDoctorId: "doc_vance", totalRooms: 12 },
    { id: "dep_neuro", name: "Neurology", headDoctorId: "doc_brody", totalRooms: 8 },
    { id: "dep_ped", name: "Pediatrics", headDoctorId: "", totalRooms: 6 },
    { id: "dep_er", name: "Emergency Medicine", headDoctorId: "", totalRooms: 15 }
  ],
  rooms: [
    { id: "rm_101", roomNumber: "101", department: "Cardiology", type: "ICU", totalBeds: 2, beds: [{ bedNumber: "Bed A", isAvailable: false, patientId: "pat_miller" }, { bedNumber: "Bed B", isAvailable: true }] },
    { id: "rm_102", roomNumber: "102", department: "Cardiology", type: "Private", totalBeds: 1, beds: [{ bedNumber: "Bed A", isAvailable: true }] },
    { id: "rm_204", roomNumber: "204", department: "Neurology", type: "Private", totalBeds: 1, beds: [{ bedNumber: "Bed B", isAvailable: false, patientId: "pat_lopez" }] },
    { id: "rm_305", roomNumber: "305", department: "Emergency Medicine", type: "Emergency", totalBeds: 4, beds: [{ bedNumber: "Bed A", isAvailable: true }, { bedNumber: "Bed B", isAvailable: true }, { bedNumber: "Bed C", isAvailable: true }, { bedNumber: "Bed D", isAvailable: true }] }
  ],
  appointments: [
    { id: "ap_1", patientId: "pat_miller", doctorId: "doc_vance", patientName: "Johnathan Miller", doctorName: "Dr. Sarah Vance", date: "2026-06-16", time: "10:30 AM", reason: "Follow-up Angiogram Checkout", status: "Scheduled" },
    { id: "ap_2", patientId: "pat_lopez", doctorId: "doc_brody", patientName: "Maria Lopez", doctorName: "Dr. Marcus Brody", date: "2026-06-17", time: "02:00 PM", reason: "Neurological Reflex Exam", status: "Scheduled" }
  ],
  medicalRecords: [
    { id: "mr_1", patientId: "pat_miller", patientName: "Johnathan Miller", doctorId: "doc_vance", doctorName: "Dr. Sarah Vance", type: "Scan Report", date: "2026-06-10", title: "Electrocardiogram (ECG)", description: "ST Elevation detected in V1-V3, sinus rhythm 82 bpm.", addedByRole: "Doctor" },
    { id: "mr_2", patientId: "pat_miller", patientName: "Johnathan Miller", doctorId: "doc_vance", doctorName: "Dr. Sarah Vance", type: "Lab Report", date: "2026-06-11", title: "Lipid Profile & Troponin", description: "Troponin I: 0.12 ng/ml (Elevated). LDL: 135 mg/dl, HDL: 40 mg/dl.", addedByRole: "Doctor" },
    { id: "mr_3", patientId: "pat_lopez", patientName: "Maria Lopez", doctorId: "doc_brody", doctorName: "Dr. Marcus Brody", type: "Scan Report", date: "2026-06-12", title: "Brain MRI Result", description: "No acute infarct or bleed detected. Standard migraine white-matter changes.", addedByRole: "Doctor" }
  ],
  emergencyRequests: [
    { id: "erq_1", patientId: "pat_miller", patientName: "Johnathan Miller", roomNumber: "101", bedNumber: "Bed A", type: "Water", timestamp: "2026-06-15T09:12:00Z", status: "Completed", criticality: "Low", acceptedByStaffId: "st_rivers", acceptedByStaffName: "Nurse Caleb Rivers", expectedTime: "3 mins" },
    { id: "erq_2", patientId: "pat_lopez", patientName: "Maria Lopez", roomNumber: "204", bedNumber: "Bed B", type: "Pain Emergency", timestamp: "2026-06-15T10:45:00Z", status: "Accepted", criticality: "High", acceptedByStaffId: "st_doe", acceptedByStaffName: "Nurse Jane Doe", expectedTime: "5 mins" }
  ],
  notifications: [
    { id: "n_1", userId: "u_vance", title: "New Lab Reports Released", message: "Troponin lab report available for Johnathan Miller", timestamp: "2026-06-11T12:00:00Z", status: "unread", type: "record" },
    { id: "n_2", userId: "u_rivers", title: "Task Assigned", message: "Assigned as caregiver for patient Johnathan Miller", timestamp: "2026-06-10T08:00:00Z", status: "read", type: "system" }
  ],
  messages: [
    { id: "msg_1", chatId: "doc_vance_st_rivers", senderId: "u_vance", senderName: "Dr. Sarah Vance", senderRole: "Doctor", receiverId: "u_rivers", content: "Is Johnathan's daily morning BP stabilized below 140?", timestamp: "2026-06-14T09:00:00Z", isRead: true },
    { id: "msg_2", chatId: "doc_vance_st_rivers", senderId: "u_rivers", senderName: "Nurse Caleb Rivers", senderRole: "Staff / Nurse", receiverId: "u_vance", content: "Yes Doctor, it registered at 132/84 today.", timestamp: "2026-06-14T09:15:00Z", isRead: true }
  ],
  auditLogs: [
    { id: "log_1", userId: "u_admin", userName: "Super Admin", role: "Super Admin", action: "System Initialize", details: "Hospital Smart Care Management system core databases initialized.", timestamp: "2026-06-15T08:00:00Z" }
  ],
  config: {
    name: "St. Jude Smart Care Command Center",
    address: "742 Medical Center Blvd, Seattle, WA 98122",
    contact: "+1 (555) 755-JUDES",
    emergencyEmail: "emergency-alerts@stjude-smartcare.com",
    allowedEmergencyCategories: [
      "Wheelchair", "Nurse Assistance", "Doctor Assistance", 
      "Medicine", "Water", "Food", "Oxygen Support", 
      "Washroom Assistance", "Bed Adjustment", "Pain Emergency", "Custom"
    ],
    notificationRules: {
      criticalAlertsToDoctor: true,
      smsOnAccept: true,
      autoAssignStaff: true
    }
  }
};

// Database state
let db: DBStructure = { ...initialDB };

// Load DB from file if exists
function loadDB() {
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    } catch (e) {
      console.error("Failed to parse DB file. Resetting to initial database.", e);
      db = { ...initialDB };
      saveDB();
    }
  } else {
    db = { ...initialDB };
    saveDB();
  }
}

// Save DB state to file
function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write to DB file", e);
  }
}

// Initialize database
loadDB();

// Express Application Setup
async function startServer() {
  const app = express();
  app.use(express.json());

  // Log actions
  function addLog(userId: string, userName: string, role: UserRole, action: string, details: string) {
    const newLog: AuditLog = {
      id: makeId("log"),
      userId,
      userName,
      role,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    db.auditLogs.unshift(newLog);
    saveDB();
  }

  // Create notifications helper
  function addNotification(userId: string, title: string, message: string, type: 'emergency' | 'system' | 'message' | 'appointment' | 'record', requestId?: string) {
    const newNotif: Notification = {
      id: makeId("notif"),
      userId,
      title,
      message,
      timestamp: new Date().toISOString(),
      status: "unread",
      type,
      requestId
    };
    db.notifications.unshift(newNotif);
    saveDB();
  }

  // API - Auth Middleware (Simulated JWT)
  function getAuthenticatedUser(req: express.Request): User | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const mockToken = authHeader.replace("Bearer ", "");
    // mockToken format: user_id:role
    const parts = mockToken.split(":");
    if (parts.length < 1) return null;
    const userId = parts[0];
    const user = db.users.find(u => u.id === userId);
    return user || null;
  }

  // ==================== AUTH ENDPOINTS ====================

  // Login Phase 1: Verify username & password, then trigger simulated MFA OTP
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
       res.status(400).json({ error: "Email and password are required" });
       return;
    }

    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
       res.status(401).json({ error: "Account not found" });
       return;
    }

    if (user.status !== "Active") {
       res.status(403).json({ error: `Account is ${user.status}. Please contact the Super Admin.` });
       return;
    }

    // Checking password
    const correctPassword = db.passwords[user.email];
    if (correctPassword !== password) {
       res.status(401).json({ error: "Invalid password credentials" });
       return;
    }

    // Generate simulated 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    db.otps[user.email] = {
      code: otpCode,
      expiry: Date.now() + 5 * 60 * 1000 // 5 minutes validity
    };
    saveDB();

    console.log(`[AUTH OTP SENT] User: ${user.name} (${user.email}) -> OTP: ${otpCode}`);

    // Return response with simulated OTP to display directly in UI as an alert for easy login, while testing
    res.json({
      success: true,
      email: user.email,
      message: "Security code sent! Enter code to verify identification.",
      dev_otp: otpCode // Exposing OTP back to dev dashboard for direct login convenience
    });
  });

  // Verification Phase 2: Verify the OTP and issue Mock Secure Bearer Token
  app.post("/api/auth/verify-otp", (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
       res.status(400).json({ error: "Email and verification code are required" });
       return;
    }

    const otpRecord = db.otps[email];
    if (!otpRecord) {
       res.status(400).json({ error: "No pending authorization found for this email" });
       return;
    }

    if (Date.now() > otpRecord.expiry) {
      delete db.otps[email];
      saveDB();
       res.status(400).json({ error: "Verification code has expired. Please re-login." });
       return;
    }

    if (otpRecord.code !== code) {
       res.status(400).json({ error: "Incorrect verification code. Access Denied." });
       return;
    }

    // Clear verification OTP
    delete db.otps[email];

    // Check if it's registration payload or login
    if (otpRecord.userPayload) {
      // Complete Registration
      const payload = otpRecord.userPayload;
      const newUserId = makeId("u");
      const newUser: User = {
        id: newUserId,
        email: payload.email,
        name: payload.name,
        role: payload.role || "Patient",
        phone: payload.phone || "",
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(payload.name)}`,
        status: payload.role === "Patient" ? "Active" : "Pending", // Staff/Docs require admin verification
        isVerified: true
      };

      db.users.push(newUser);
      db.passwords[payload.email] = payload.password;

      // Handle role details creation if patient
      if (newUser.role === "Patient") {
        const newPatient: Patient = {
          id: makeId("pat"),
          userId: newUserId,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          age: Number(payload.age) || 30,
          gender: payload.gender || "Not Specified",
          bloodGroup: payload.blood,
          address: payload.address || "",
          emergencyContact: {
            name: payload.emergencyName || "",
            relationship: payload.emergencyRelation || "",
            phone: payload.emergencyPhone || ""
          },
          diseaseDetails: payload.diseaseDetails || "General checkup admitted patient",
          admissionDate: new Date().toISOString().split('T')[0],
          status: "Admitted",
          doctorId: "", // Assigned by admin
          staffId: "",  // Assigned by admin
          roomNumber: "305", // Default General Room
          bedNumber: "Bed A",
          medicalHistory: [],
          currentMedications: [],
          allergies: [],
          doctorNotes: [],
          staffNotes: []
        };
        db.patients.push(newPatient);

        // Update bed occupancy
        const targetRoom = db.rooms.find(r => r.roomNumber === "305");
        if (targetRoom) {
          const roomBedIndex = targetRoom.beds.findIndex(b => b.isAvailable);
          if (roomBedIndex !== -1) {
            targetRoom.beds[roomBedIndex].isAvailable = false;
            targetRoom.beds[roomBedIndex].patientId = newPatient.id;
            newPatient.bedNumber = targetRoom.beds[roomBedIndex].bedNumber;
          }
        }
      } else if (newUser.role === "Doctor") {
        const newDoc: Doctor = {
          id: makeId("doc"),
          userId: newUserId,
          name: newUser.name,
          email: newUser.email,
          department: payload.department || "Emergency Medicine",
          phone: newUser.phone,
          specialty: payload.specialty || "General Practitioner",
          status: "Active",
          assignedPatients: [],
          assignedStaff: [],
          rooms: []
        };
        db.doctors.push(newDoc);
      } else if (newUser.role === "Staff / Nurse") {
        const newStaff: Staff = {
          id: makeId("st"),
          userId: newUserId,
          name: newUser.name,
          email: newUser.email,
          role: "Nurse",
          department: payload.department || "Emergency Medicine",
          phone: newUser.phone,
          status: "Active",
          assignedPatients: []
        };
        db.staff.push(newStaff);
      }

      saveDB();
      addLog(newUserId, newUser.name, newUser.role, "Account Created", `Signed up as a verified ${newUser.role}`);
      
      const mockToken = `${newUser.id}:${newUser.role}`;
      res.json({
        success: true,
        token: mockToken,
        user: newUser,
        message: "Account approved and authenticated successfully!"
      });
      return;
    }

    // Verify Logged In User
    const loggedInUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!loggedInUser) {
       res.status(401).json({ error: "Corrupted profile context." });
       return;
    }

    const mockToken = `${loggedInUser.id}:${loggedInUser.role}`;
    addLog(loggedInUser.id, loggedInUser.name, loggedInUser.role, "Signed In", "Verified secure verification code.");

    res.json({
      success: true,
      token: mockToken,
      user: loggedInUser,
      message: "Authorization granted successfully"
    });
  });

  // Sign Up: Register new user payload
  app.post("/api/auth/signup", (req, res) => {
    const { email, password, name, role, phone, ...extra } = req.body;
    if (!email || !password || !name || !role) {
       res.status(400).json({ error: "Missing required profile registration parameters" });
       return;
    }

    const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
       res.status(400).json({ error: "Email already registered to another medical account" });
       return;
    }

    // Store user creation details temporarily waiting for code confirmation
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    db.otps[email] = {
      code: otpCode,
      expiry: Date.now() + 10 * 60 * 1000, // 10 minutes
      userPayload: { email, password, name, role, phone, ...extra }
    };
    saveDB();

    console.log(`[REGISTRY OTP] New signup: ${name} (${role}) -> OTP Code: ${otpCode}`);

    // Return the response containing precheck confirmation & simulated OTP code directly
    res.json({
      success: true,
      email,
      message: `Registration pre-authorization code sent! Valid for 10 minutes.`,
      dev_otp: otpCode
    });
  });

  // Forgot password triggers simulated reset code
  app.post("/api/auth/forgot-password", (req, res) => {
    const { email } = req.body;
    const user = db.users.find(u => u.email.toLowerCase() === email?.toLowerCase());
    if (!user) {
       res.status(400).json({ error: "No matching healthcare user registered for this email." });
       return;
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    db.otps[email] = {
      code: otpCode,
      expiry: Date.now() + 5 * 60 * 1000
    };
    saveDB();

    console.log(`[PASSWORD FORGOT CODE] Resetting for ${user.name}: CODE => ${otpCode}`);

    res.json({
      success: true,
      email,
      message: "Instructions to reset credentials sent.",
      dev_otp: otpCode
    });
  });

  // Verify and reset password
  app.post("/api/auth/reset-password", (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
       res.status(400).json({ error: "Complete fields are required." });
       return;
    }

    const otpRecord = db.otps[email];
    if (!otpRecord || otpRecord.code !== code || Date.now() > otpRecord.expiry) {
       res.status(400).json({ error: "Incorrect or expired reset confirmation token." });
       return;
    }

    db.passwords[email] = newPassword;
    delete db.otps[email];
    saveDB();

    const matchedUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (matchedUser) {
      addLog(matchedUser.id, matchedUser.name, matchedUser.role, "Password Changed", "Reset credentials through OTP security portal.");
    }

    res.json({
      success: true,
      message: "Credentials altered successfully. Login with your new password."
    });
  });

  // Retrieve current active credentials
  app.get("/api/auth/me", (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
       res.status(401).json({ error: "Invalid context token credentials" });
       return;
    }

    // Attach expanded sub-model context
    let expandedContext: any = {};
    if (user.role === "Patient") {
      expandedContext = db.patients.find(p => p.userId === user.id) || null;
    } else if (user.role === "Doctor") {
      expandedContext = db.doctors.find(d => d.userId === user.id) || null;
    } else if (user.role === "Staff / Nurse") {
      expandedContext = db.staff.find(s => s.userId === user.id) || null;
    }

    res.json({
      user,
      profile: expandedContext
    });
  });

  // ==================== SYSTEM ANALYTICS ====================
  app.get("/api/analytics", (req, res) => {
    const current = getAuthenticatedUser(req);
    if (!current || (current.role !== "Super Admin" && current.role !== "Doctor")) {
       res.status(403).json({ error: "Unauthorized analytics privilege level." });
       return;
    }

    // Aggregate counts
    const totalPatients = db.patients.length;
    const activePatients = db.patients.filter(p => p.status === "Admitted").length;
    const emergencyRequests = db.emergencyRequests.length;
    
    // Count emergency types
    const emergencyCounts: { [key: string]: number } = {};
    db.emergencyRequests.forEach(r => {
      emergencyCounts[r.type] = (emergencyCounts[r.type] || 0) + 1;
    });

    const emergencyStats = Object.keys(emergencyCounts).map(type => ({
      name: type,
      value: emergencyCounts[type]
    }));

    // Bed capacity metrics
    let totalBedsCount = 0;
    let occupiedBedsCount = 0;
    db.rooms.forEach(r => {
      totalBedsCount += r.totalBeds;
      r.beds.forEach(b => {
        if (!b.isAvailable) occupiedBedsCount++;
      });
    });

    // Departments stats
    const deptInfo = db.departments.map(d => {
      const roomSubset = db.rooms.filter(r => r.department === d.name);
      let bedsCount = 0;
      let occupiedCount = 0;
      roomSubset.forEach(r => {
        bedsCount += r.totalBeds;
        r.beds.forEach(b => {
          if (!b.isAvailable) occupiedCount++;
        });
      });
      return {
        id: d.id,
        name: d.name,
        rooms: roomSubset.length,
        totalBeds: bedsCount,
        occupiedBeds: occupiedCount,
        availableBeds: bedsCount - occupiedCount
      };
    });

    // Dummy performance scores
    const responseMetrics = {
      avgStaffResponseMinutes: 4.2,
      avgDoctorResponseMinutes: 8.7,
      completionRatePercent: 98
    };

    res.json({
      totalPatients,
      activePatients,
      emergencyRequests,
      emergencyStats,
      beds: {
        total: totalBedsCount,
        occupied: occupiedBedsCount,
        available: totalBedsCount - occupiedBedsCount
      },
      departments: deptInfo,
      metrics: responseMetrics
    });
  });

  // ==================== RESOURCE MANAGEMENT CRUD ====================

  // Doctors View & Manipulate
  app.get("/api/doctors", (req, res) => {
    res.json(db.doctors);
  });

  app.post("/api/doctors", (req, res) => {
    const master = getAuthenticatedUser(req);
    if (!master || master.role !== "Super Admin") {
       res.status(403).json({ error: "Access Denied" });
       return;
    }

    const { name, email, department, phone, specialty } = req.body;
    const newUserId = makeId("u");
    const newDocId = makeId("doc");

    // Add general User record
    const newUserRecord: User = {
      id: newUserId,
      email,
      name,
      role: "Doctor",
      phone,
      avatar: `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&h=150&q=80`,
      status: "Active",
      isVerified: true
    };

    const newDocRecord: Doctor = {
      id: newDocId,
      userId: newUserId,
      name,
      email,
      department,
      phone,
      specialty,
      status: "Active",
      assignedPatients: [],
      assignedStaff: [],
      rooms: []
    };

    db.users.push(newUserRecord);
    db.passwords[email] = "doctor123"; // default pwd
    db.doctors.push(newDocRecord);
    saveDB();

    addLog(master.id, master.name, master.role, "Added Doctor", `Created Doctor user account ${name} for ${department}`);
    res.json(newDocRecord);
  });

  app.put("/api/doctors/:id", (req, res) => {
    const master = getAuthenticatedUser(req);
    const targetDoc = db.doctors.find(d => d.id === req.params.id);
    if (!targetDoc) {
       res.status(404).json({ error: "Doctor profile not found" });
       return;
    }

    const isSelf = master && master.role === "Doctor" && targetDoc.userId === master.id;
    const isAdmin = master && master.role === "Super Admin";

    if (!isSelf && !isAdmin) {
       res.status(403).json({ error: "Access Denied" });
       return;
    }

    const { name, department, phone, specialty, status } = req.body;
    targetDoc.name = name ?? targetDoc.name;
    targetDoc.department = department ?? targetDoc.department;
    targetDoc.phone = phone ?? targetDoc.phone;
    targetDoc.specialty = specialty ?? targetDoc.specialty;
    targetDoc.status = status ?? targetDoc.status;

    // Update global User
    const userRef = db.users.find(u => u.id === targetDoc.userId);
    if (userRef) {
      userRef.name = targetDoc.name;
      userRef.phone = targetDoc.phone;
      userRef.status = targetDoc.status;
    }

    saveDB();
    addLog(master.id, master.name, master.role, "Updated Doctor", `Altered records for Doctor ${targetDoc.name}`);
    res.json(targetDoc);
  });

  app.delete("/api/doctors/:id", (req, res) => {
    const master = getAuthenticatedUser(req);
    if (!master || master.role !== "Super Admin") {
       res.status(403).json({ error: "Access Denied" });
       return;
    }

    const docIndex = db.doctors.findIndex(d => d.id === req.params.id);
    if (docIndex === -1) {
       res.status(404).json({ error: "Doctor not found" });
       return;
    }

    const referencedDoc = db.doctors[docIndex];
    // Remove user account
    db.users = db.users.filter(u => u.id !== referencedDoc.userId);
    // Remove doctor account
    db.doctors.splice(docIndex, 1);
    saveDB();

    addLog(master.id, master.name, master.role, "Archived Doctor Profile", `Permanently removed access/auth for Dr. ${referencedDoc.name}`);
    res.json({ success: true });
  });

  // Staff View & Manipulate
  app.get("/api/staff", (req, res) => {
    res.json(db.staff);
  });

  app.post("/api/staff", (req, res) => {
    const master = getAuthenticatedUser(req);
    if (!master || master.role !== "Super Admin") {
       res.status(403).json({ error: "Access Denied" });
       return;
    }

    const { name, email, role, department, phone } = req.body;
    const newUserId = makeId("u");
    const newStaffId = makeId("st");

    const newUserRecord: User = {
      id: newUserId,
      email,
      name,
      role: "Staff / Nurse",
      phone,
      avatar: `https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80`,
      status: "Active",
      isVerified: true
    };

    const newStaffRecord: Staff = {
      id: newStaffId,
      userId: newUserId,
      name,
      email,
      role: role || "Nurse",
      department,
      phone,
      status: "Active",
      assignedPatients: []
    };

    db.users.push(newUserRecord);
    db.passwords[email] = "staff123";
    db.staff.push(newStaffRecord);
    saveDB();

    addLog(master.id, master.name, master.role, "Added Staff", `Registered Nurse/Caregiver profile ${name}`);
    res.json(newStaffRecord);
  });

  app.put("/api/staff/:id", (req, res) => {
    const master = getAuthenticatedUser(req);
    const targetStaff = db.staff.find(s => s.id === req.params.id);
    if (!targetStaff) {
       res.status(404).json({ error: "Nurse profile not found" });
       return;
    }

    const isSelf = master && master.role === "Staff / Nurse" && targetStaff.userId === master.id;
    const isAdmin = master && master.role === "Super Admin";

    if (!isSelf && !isAdmin) {
       res.status(403).json({ error: "Access Denied" });
       return;
    }

    const { name, role, department, phone, status } = req.body;
    targetStaff.name = name ?? targetStaff.name;
    targetStaff.role = role ?? targetStaff.role;
    targetStaff.department = department ?? targetStaff.department;
    targetStaff.phone = phone ?? targetStaff.phone;
    targetStaff.status = status ?? targetStaff.status;

    const userRef = db.users.find(u => u.id === targetStaff.userId);
    if (userRef) {
      userRef.name = targetStaff.name;
      userRef.phone = targetStaff.phone;
      userRef.status = targetStaff.status;
    }

    saveDB();
    addLog(master.id, master.name, master.role, "Updated Staff Member", `Modified medical catalog profiles for ${targetStaff.name}`);
    res.json(targetStaff);
  });

  app.delete("/api/staff/:id", (req, res) => {
    const master = getAuthenticatedUser(req);
    if (!master || master.role !== "Super Admin") {
       res.status(403).json({ error: "Access Denied" });
       return;
    }

    const staffIndex = db.staff.findIndex(s => s.id === req.params.id);
    if (staffIndex === -1) {
       res.status(404).json({ error: "Staff not found" });
       return;
    }

    const referencedStaff = db.staff[staffIndex];
    db.users = db.users.filter(u => u.id !== referencedStaff.userId);
    db.staff.splice(staffIndex, 1);
    saveDB();

    addLog(master.id, master.name, master.role, "Retired Staff Profile", `Deactivated nursing profiles for ${referencedStaff.name}`);
    res.json({ success: true });
  });

  // Patients Management Router
  app.get("/api/patients", (req, res) => {
    res.json(db.patients);
  });

  app.post("/api/patients", (req, res) => {
    const master = getAuthenticatedUser(req);
    if (!master || (master.role !== "Super Admin" && master.role !== "Doctor" && master.role !== "Staff / Nurse")) {
       res.status(403).json({ error: "Access Denied" });
       return;
    }

    const { 
      name, email, phone, age, gender, bloodGroup, address, diseaseDetails, 
      roomNumber, bedNumber, doctorId, staffId, allergies, medicalHistory, currentMedications
    } = req.body;

    const newUserId = makeId("u");
    const newPatId = makeId("pat");

    const newUserRecord: User = {
      id: newUserId,
      email: email || `${name.toLowerCase().replace(/\s/g, "")}@example.com`,
      name,
      role: "Patient",
      phone: phone || "",
      avatar: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80`,
      status: "Active",
      isVerified: true
    };

    const newPatRecord: Patient = {
      id: newPatId,
      userId: newUserId,
      name,
      email: newUserRecord.email,
      phone: newUserRecord.phone,
      age: Number(age) || 45,
      gender: gender || "Male",
      bloodGroup: bloodGroup || "O+",
      address: address || "",
      emergencyContact: {
        name: req.body.emergencyName || "",
        relationship: req.body.emergencyRelation || "",
        phone: req.body.emergencyPhone || ""
      },
      diseaseDetails: diseaseDetails || "General ward monitor",
      admissionDate: new Date().toISOString().split('T')[0],
      status: "Admitted",
      doctorId: doctorId || "",
      staffId: staffId || "",
      roomNumber: roomNumber || "305",
      bedNumber: bedNumber || "Bed A",
      allergies: allergies ? (Array.isArray(allergies) ? allergies : allergies.split(",").map((s:string)=>s.trim())) : [],
      medicalHistory: medicalHistory ? (Array.isArray(medicalHistory) ? medicalHistory : medicalHistory.split(",").map((s:string)=>s.trim())) : [],
      currentMedications: currentMedications ? (Array.isArray(currentMedications) ? currentMedications : currentMedications.split(",").map((s:string)=>s.trim())) : [],
      doctorNotes: [],
      staffNotes: []
    };

    db.users.push(newUserRecord);
    db.passwords[newUserRecord.email] = "patient123";
    db.patients.push(newPatRecord);

    // Book Room Bed
    const rRef = db.rooms.find(r => r.roomNumber === newPatRecord.roomNumber);
    if (rRef) {
      const bIdx = rRef.beds.findIndex(b => b.bedNumber === newPatRecord.bedNumber);
      if (bIdx !== -1) {
        rRef.beds[bIdx].isAvailable = false;
        rRef.beds[bIdx].patientId = newPatId;
      } else {
        const anyAvailableIdx = rRef.beds.findIndex(b => b.isAvailable);
        if (anyAvailableIdx !== -1) {
          rRef.beds[anyAvailableIdx].isAvailable = false;
          rRef.beds[anyAvailableIdx].patientId = newPatId;
          newPatRecord.bedNumber = rRef.beds[anyAvailableIdx].bedNumber;
        }
      }
    }

    // Allocate doctor-patient assignment relation
    if (doctorId) {
      const doc = db.doctors.find(d => d.id === doctorId);
      if (doc && !doc.assignedPatients.includes(newPatId)) {
        doc.assignedPatients.push(newPatId);
      }
    }

    // Allocate staff-patient assignment relation
    if (staffId) {
      const st = db.staff.find(s => s.id === staffId);
      if (st && !st.assignedPatients.includes(newPatId)) {
        st.assignedPatients.push(newPatId);
      }
    }

    saveDB();
    addLog(master.id, master.name, master.role, "Preserved Medical Patient", `Prepared clinical admission files for ${name} under room ${newPatRecord.roomNumber}`);
    res.json(newPatRecord);
  });

  app.put("/api/patients/:id", (req, res) => {
    const master = getAuthenticatedUser(req);
    const patient = db.patients.find(p => p.id === req.params.id);
    if (!patient) {
       res.status(404).json({ error: "Patient record not found" });
       return;
    }

    const isSelf = master && master.role === "Patient" && patient.userId === master.id;
    const isClinical = master && ["Super Admin", "Doctor", "Staff / Nurse"].includes(master.role);

    if (!isSelf && !isClinical) {
       res.status(403).json({ error: "Access Denied" });
       return;
    }

    const { 
      name, phone, age, gender, bloodGroup, address, diseaseDetails, status,
      roomNumber, bedNumber, doctorId, staffId, doctorNotes, staffNotes, 
      currentMedications, allergies, medicalHistory 
    } = req.body;

    if (req.body.emergencyContact) {
      patient.emergencyContact = {
        name: req.body.emergencyContact.name ?? patient.emergencyContact?.name ?? "",
        relationship: req.body.emergencyContact.relationship ?? patient.emergencyContact?.relationship ?? "",
        phone: req.body.emergencyContact.phone ?? patient.emergencyContact?.phone ?? ""
      };
    }

    const oldRoom = patient.roomNumber;
    const oldBed = patient.bedNumber;
    const oldDoctorId = patient.doctorId;
    const oldStaffId = patient.staffId;

    patient.name = name ?? patient.name;
    patient.phone = phone ?? patient.phone;
    patient.age = age ? Number(age) : patient.age;
    patient.gender = gender ?? patient.gender;
    patient.bloodGroup = bloodGroup ?? patient.bloodGroup;
    patient.address = address ?? patient.address;
    patient.diseaseDetails = diseaseDetails ?? patient.diseaseDetails;
    patient.status = status ?? patient.status;
    patient.roomNumber = roomNumber ?? patient.roomNumber;
    patient.bedNumber = bedNumber ?? patient.bedNumber;
    patient.doctorId = doctorId ?? patient.doctorId;
    patient.staffId = staffId ?? patient.staffId;

    if (allergies) patient.allergies = Array.isArray(allergies) ? allergies : allergies.split(",").map((s:string)=>s.trim());
    if (medicalHistory) patient.medicalHistory = Array.isArray(medicalHistory) ? medicalHistory : medicalHistory.split(",").map((s:string)=>s.trim());
    if (currentMedications) patient.currentMedications = Array.isArray(currentMedications) ? currentMedications : currentMedications.split(",").map((s:string)=>s.trim());

    if (doctorNotes) {
      patient.doctorNotes.push(doctorNotes);
    }
    if (staffNotes) {
      patient.staffNotes.push(staffNotes);
    }

    // Handle Bed Allocates
    if (oldRoom !== patient.roomNumber || oldBed !== patient.bedNumber) {
      // Clear old bed
      const oldRRef = db.rooms.find(r => r.roomNumber === oldRoom);
      if (oldRRef) {
        const oldB = oldRRef.beds.find(b => b.bedNumber === oldBed);
        if (oldB) {
          oldB.isAvailable = true;
          delete oldB.patientId;
        }
      }
      // Allocate new bed
      const newRRef = db.rooms.find(r => r.roomNumber === patient.roomNumber);
      if (newRRef) {
        const newB = newRRef.beds.find(b => b.bedNumber === patient.bedNumber);
        if (newB) {
          newB.isAvailable = false;
          newB.patientId = patient.id;
        }
      }
    }

    // Handle Doctor Assocs
    if (oldDoctorId !== patient.doctorId) {
      if (oldDoctorId) {
        const oldDoc = db.doctors.find(d => d.id === oldDoctorId);
        if (oldDoc) oldDoc.assignedPatients = oldDoc.assignedPatients.filter(pid => pid !== patient.id);
      }
      if (patient.doctorId) {
        const newDoc = db.doctors.find(d => d.id === patient.doctorId);
        if (newDoc && !newDoc.assignedPatients.includes(patient.id)) newDoc.assignedPatients.push(patient.id);
      }
    }

    // Handle Staff Assocs
    if (oldStaffId !== patient.staffId) {
      if (oldStaffId) {
        const oldSt = db.staff.find(s => s.id === oldStaffId);
        if (oldSt) oldSt.assignedPatients = oldSt.assignedPatients.filter(pid => pid !== patient.id);
      }
      if (patient.staffId) {
        const newSt = db.staff.find(s => s.id === patient.staffId);
        if (newSt && !newSt.assignedPatients.includes(patient.id)) newSt.assignedPatients.push(patient.id);
      }
    }

    // Synchronize global users profile
    const refUser = db.users.find(u => u.id === patient.userId);
    if (refUser) {
      refUser.name = patient.name;
      refUser.phone = patient.phone;
    }

    saveDB();
    addLog(master.id, master.name, master.role, "Updated Patient Record", `Clinical archives modified for ${patient.name}`);
    res.json(patient);
  });

  app.delete("/api/patients/:id", (req, res) => {
    const master = getAuthenticatedUser(req);
    if (!master || master.role !== "Super Admin") {
       res.status(403).json({ error: "Access Denied" });
       return;
    }

    const idx = db.patients.findIndex(p => p.id === req.params.id);
    if (idx === -1) {
       res.status(404).json({ error: "Patient profile not found" });
       return;
    }

    const pat = db.patients[idx];

    // Free bed space
    const oldRRef = db.rooms.find(r => r.roomNumber === pat.roomNumber);
    if (oldRRef) {
      const oldB = oldRRef.beds.find(b => b.bedNumber === pat.bedNumber);
      if (oldB) {
        oldB.isAvailable = true;
        delete oldB.patientId;
      }
    }

    db.users = db.users.filter(u => u.id !== pat.userId);
    db.patients.splice(idx, 1);
    saveDB();

    addLog(master.id, master.name, master.role, "Discharged Patient Profile", `Deregistered files for patient ${pat.name}`);
    res.json({ success: true });
  });

  // ==================== HOSPITAL BED / ROOMS / DEPARTMENTS ====================
  app.get("/api/rooms", (req, res) => {
    res.json(db.rooms);
  });

  app.post("/api/rooms", (req, res) => {
    const master = getAuthenticatedUser(req);
    if (!master || master.role !== "Super Admin") {
       res.status(403).json({ error: "Access Denied" });
       return;
    }

    const { roomNumber, department, type, totalBeds } = req.body;
    const beds = Array.from({ length: Number(totalBeds) || 1 }, (_, i) => ({
      bedNumber: `Bed ${String.fromCharCode(65 + i)}`,
      isAvailable: true
    }));

    const newRoom: HospitalRoom = {
      id: makeId("rm"),
      roomNumber,
      department,
      type,
      totalBeds: Number(totalBeds),
      beds
    };

    db.rooms.push(newRoom);
    saveDB();

    addLog(master.id, master.name, master.role, "Added Room", `Created clinical room ${roomNumber} for ${department}`);
    res.json(newRoom);
  });

  // Departments List
  app.get("/api/departments", (req, res) => {
    res.json(db.departments);
  });

  app.post("/api/departments", (req, res) => {
    const master = getAuthenticatedUser(req);
    if (!master || master.role !== "Super Admin") {
       res.status(403).json({ error: "Access Denied" });
       return;
    }

    const { name, headDoctorId, totalRooms } = req.body;
    const newDept = {
      id: makeId("dep"),
      name,
      headDoctorId: headDoctorId || "",
      totalRooms: Number(totalRooms) || 5
    };

    db.departments.push(newDept);
    saveDB();

    addLog(master.id, master.name, master.role, "Added Department", `Opened medical branch: ${name}`);
    res.json(newDept);
  });

  // ==================== APPOINTMENTS SCHEDULER ====================
  app.get("/api/appointments", (req, res) => {
    res.json(db.appointments);
  });

  app.post("/api/appointments", (req, res) => {
    const master = getAuthenticatedUser(req);
    if (!master) {
       res.status(401).json({ error: "Authentication Required" });
       return;
    }

    const { patientId, doctorId, date, time, reason } = req.body;
    
    // Resolve helper names
    const patientObj = db.patients.find(p => p.id === patientId);
    const doctorObj = db.doctors.find(d => d.id === doctorId);

    const newAppointment: Appointment = {
      id: makeId("ap"),
      patientId,
      doctorId,
      patientName: patientObj ? patientObj.name : "Unknown Patient",
      doctorName: doctorObj ? doctorObj.name : "Unknown Practitioner",
      date,
      time,
      reason,
      status: "Scheduled"
    };

    db.appointments.push(newAppointment);
    saveDB();

    // Trigger alerts
    if (patientObj) {
      addNotification(patientObj.userId, "Appointment Booked", `Consultation scheduled with ${newAppointment.doctorName} on ${date} at ${time}.`, "appointment");
    }
    if (doctorObj) {
      addNotification(doctorObj.userId, "Appointment Scheduled", `New diagnostic consultation scheduled with patient ${newAppointment.patientName} on ${date}.`, "appointment");
    }

    addLog(master.id, master.name, master.role, "Booked Appointment", `Scheduled patient ${newAppointment.patientName} with ${newAppointment.doctorName}`);
    res.json(newAppointment);
  });

  app.put("/api/appointments/:id", (req, res) => {
    const master = getAuthenticatedUser(req);
    if (!master) {
       res.status(401).json({ error: "Authentication Required" });
       return;
    }

    const appt = db.appointments.find(a => a.id === req.params.id);
    if (!appt) {
       res.status(404).json({ error: "Appointment not found." });
       return;
    }

    const { status, date, time } = req.body;
    appt.status = status ?? appt.status;
    appt.date = date ?? appt.date;
    appt.time = time ?? appt.time;

    const patientObj = db.patients.find(p => p.id === appt.patientId);
    if (patientObj) {
      addNotification(patientObj.userId, `Appointment ${appt.status}`, `Appointment with ${appt.doctorName} has been ${appt.status}. Date: ${appt.date}, Time: ${appt.time}`, "appointment");
    }

    saveDB();
    addLog(master.id, master.name, master.role, `Rescheduled Appointment`, `Modified visitation files for ${appt.patientName}`);
    res.json(appt);
  });

  // ==================== EMERGENCY REQUESTS CONSOLE ====================
  app.get("/api/emergency-requests", (req, res) => {
    res.json(db.emergencyRequests);
  });

  app.post("/api/emergency-requests", (req, res) => {
    const master = getAuthenticatedUser(req);
    if (!master) {
       res.status(401).json({ error: "Authentication required" });
       return;
    }

    // Patient id either comes from body or from authenticatd context if patient
    let patientId = req.body.patientId;
    if (master.role === "Patient") {
      const pProfile = db.patients.find(p => p.userId === master.id);
      if (pProfile) patientId = pProfile.id;
    }

    const patient = db.patients.find(p => p.id === patientId);
    if (!patient) {
       res.status(404).json({ error: "Patient session details not found." });
       return;
    }

    const { type, customMessage, criticality } = req.body;

    const newReq: EmergencyRequest = {
      id: makeId("erq"),
      patientId: patient.id,
      patientName: patient.name,
      roomNumber: patient.roomNumber,
      bedNumber: patient.bedNumber,
      type,
      customMessage,
      timestamp: new Date().toISOString(),
      status: "Pending",
      criticality: criticality || (["Pain Emergency", "Oxygen Support", "Doctor Assistance"].includes(type) ? "High" : "Medium")
    };

    db.emergencyRequests.unshift(newReq);
    saveDB();

    console.log(`[EMERGENCY SIGNAL INITIALIZED] Patient: ${patient.name} | Room: ${patient.roomNumber} | Type: ${type}`);

    // Notify assigned staff / nurse instantly
    if (patient.staffId) {
      const nurse = db.staff.find(s => s.id === patient.staffId);
      if (nurse) {
        addNotification(nurse.userId, "🔴 EMERGENCY ACTIVE SENTINEL", `Patient ${patient.name} in Room ${patient.roomNumber} triggered an emergency request: "${type}"`, "emergency", newReq.id);
      }
    }

    // If critical or high, notify the doctor instantly!
    if (newReq.criticality === "High" && patient.doctorId) {
      const doctor = db.doctors.find(d => d.id === patient.doctorId);
      if (doctor) {
        addNotification(doctor.userId, "🚨 RED CRITICAL ALERT WARNING", `Urgent medical intervention needed: Patient ${patient.name} in Room ${patient.roomNumber} requested "${type}"`, "emergency", newReq.id);
      }
    }

    // Also notify all online administrators for hospital wide safety
    db.users.filter(u => u.role === "Super Admin").forEach(admin => {
      addNotification(admin.id, `🚨 Emergency Triggered - Room ${patient.roomNumber}`, `${patient.name} requested immediate assistance: "${type}"`, "emergency", newReq.id);
    });

    addLog(master.id, master.name, master.role, "Red Emergency Assist Triggered", `Activated sentinel for ${type} in room ${patient.roomNumber}`);
    res.json(newReq);
  });

  // Action emergency status (Accept, Mark In Progress, Complete)
  app.post("/api/emergency-requests/:id/action", (req, res) => {
    const helper = getAuthenticatedUser(req);
    if (!helper || (helper.role !== "Staff / Nurse" && helper.role !== "Doctor" && helper.role !== "Super Admin")) {
       res.status(403).json({ error: "Unauthorized care sentinel action." });
       return;
    }

    const { status, expectedTime } = req.body;
    const reqObj = db.emergencyRequests.find(r => r.id === req.params.id);
    if (!reqObj) {
       res.status(404).json({ error: "Emergency session ID not found." });
       return;
    }

    reqObj.status = status;
    
    // Bind nurse helper identity
    if (status === "Accepted") {
      reqObj.expectedTime = expectedTime || "5 mins";
      if (helper.role === "Staff / Nurse") {
        const staffObj = db.staff.find(s => s.userId === helper.id);
        if (staffObj) {
          reqObj.acceptedByStaffId = staffObj.id;
          reqObj.acceptedByStaffName = staffObj.name;
        }
      } else if (helper.role === "Doctor") {
        const docObj = db.doctors.find(d => d.userId === helper.id);
        if (docObj) {
          reqObj.acceptedByDoctorId = docObj.id;
          reqObj.acceptedByDoctorName = docObj.name;
        }
      }
    }

    saveDB();

    // Alert patient
    const patientObj = db.patients.find(p => p.id === reqObj.patientId);
    if (patientObj) {
      let customTitle = `Emergency Assist Update`;
      let customMsg = `Your urgent request for ${reqObj.type} has been ${status.toLowerCase()}.`;
      if (status === "Accepted" && (reqObj.acceptedByStaffName || reqObj.acceptedByDoctorName)) {
        const nameText = reqObj.acceptedByStaffName || reqObj.acceptedByDoctorName;
        customMsg = `Assistance Accepted by ${nameText}. Arrival expected in ${reqObj.expectedTime}.`;
      } else if (status === "Completed") {
        customMsg = `Your request has been marked as fully resolved. Safety restored.`;
      }
      
      addNotification(patientObj.userId, customTitle, customMsg, "emergency", reqObj.id);
    }

    addLog(helper.id, helper.name, helper.role, `Addressed Emergency Assist`, `Marked request ${reqObj.type} for ${reqObj.patientName} as ${status}`);
    res.json(reqObj);
  });

  // ==================== MEDICAL RECORDS FILE REPOSITORY ====================
  app.get("/api/medical-records", (req, res) => {
    res.json(db.medicalRecords);
  });

  app.post("/api/medical-records", (req, res) => {
    const creator = getAuthenticatedUser(req);
    if (!creator || (creator.role !== "Doctor" && creator.role !== "Super Admin")) {
       res.status(403).json({ error: "Authorized personnel only." });
       return;
    }

    const { patientId, type, title, description, fileUrl } = req.body;
    const pat = db.patients.find(p => p.id === patientId);
    if (!pat) {
       res.status(404).json({ error: "Patient record not matching database logs." });
       return;
    }

    const newRecord: MedicalRecord = {
      id: makeId("mr"),
      patientId,
      patientName: pat.name,
      doctorId: creator.id,
      doctorName: creator.name,
      type: type || "Prescription",
      date: new Date().toISOString().split('T')[0],
      title,
      description,
      fileUrl: fileUrl || undefined,
      addedByRole: creator.role
    };

    db.medicalRecords.push(newRecord);

    // If type is prescription, also push to current active medications array for the patient
    if (type === "Prescription") {
      pat.currentMedications.push(title);
    }

    saveDB();

    // Inform patient of updated records
    addNotification(pat.userId, `New Medical File Registered`, `${creator.name} filed a new ${type}: "${title}"`, "record");

    addLog(creator.id, creator.name, creator.role, "Stored Medical Record", `Recorded clinical report details for Patient ${pat.name}`);
    res.json(newRecord);
  });

  // ==================== REAL-TIME SECURITY CHAT MODULE ====================
  app.get("/api/messages", (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
       res.status(401).json({ error: "Authentication required" });
       return;
    }
    // Filter messages where sender or receiver corresponds to active user id
    const userMessages = db.messages.filter(msg => msg.senderId === user.id || msg.receiverId === user.id);
    res.json(userMessages);
  });

  app.post("/api/messages", (req, res) => {
    const sender = getAuthenticatedUser(req);
    if (!sender) {
       res.status(401).json({ error: "Authentication required" });
       return;
    }

    const { chatId, receiverId, content, attachmentUrl, attachmentName } = req.body;
    if (!receiverId || (!content && !attachmentUrl)) {
       res.status(400).json({ error: "Receiver and message content are required." });
       return;
    }

    const receiverUser = db.users.find(u => u.id === receiverId);
    if (!receiverUser) {
       res.status(404).json({ error: "Receiver account not registered on server." });
       return;
    }

    const newMsg: Message = {
      id: makeId("msg"),
      chatId: chatId || [sender.id, receiverId].sort().join("_"),
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role,
      receiverId,
      content: content || "",
      timestamp: new Date().toISOString(),
      attachmentUrl: attachmentUrl || undefined,
      attachmentName: attachmentName || undefined,
      isRead: false
    };

    db.messages.push(newMsg);
    saveDB();

    // Trigger urgent real-time notification alert to receiver
    addNotification(receiverId, `📩 Message from ${sender.name}`, content || `Shared attachment: ${attachmentName}`, "message");

    res.json(newMsg);
  });

  // Read message receipts
  app.post("/api/messages/read-all", (req, res) => {
    const current = getAuthenticatedUser(req);
    if (!current) {
       res.status(401).json({ error: "Authentication Required" });
       return;
    }

    let updated = false;
    db.messages.forEach(msg => {
      if (msg.receiverId === current.id && !msg.isRead) {
        msg.isRead = true;
        updated = true;
      }
    });

    if (updated) saveDB();
    res.json({ success: true });
  });

  // ==================== ALERTS CENTER ENDPOINTS ====================
  app.get("/api/notifications", (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
       res.status(401).json({ error: "Authentication required" });
       return;
    }
    const notifs = db.notifications.filter(n => n.userId === user.id);
    res.json(notifs);
  });

  app.put("/api/notifications/read-all", (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
       res.status(401).json({ error: "Authentication required" });
       return;
    }
    db.notifications.forEach(n => {
      if (n.userId === user.id) n.status = "read";
    });
    saveDB();
    res.json({ success: true });
  });

  app.put("/api/notifications/:id/read", (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
       res.status(401).json({ error: "Authentication required" });
       return;
    }
    const notif = db.notifications.find(n => n.id === req.params.id && n.userId === user.id);
    if (notif) {
      notif.status = "read";
      saveDB();
    }
    res.json({ success: true });
  });

  // ==================== AUDIT CONFIGURATION LOGS ====================
  app.get("/api/audit-logs", (req, res) => {
    const current = getAuthenticatedUser(req);
    if (!current || current.role !== "Super Admin") {
       res.status(403).json({ error: "Restricted administrative protocol." });
       return;
    }
    res.json(db.auditLogs);
  });

  // View Hospital Core settings config
  app.get("/api/settings", (req, res) => {
    res.json(db.config);
  });

  app.post("/api/settings", (req, res) => {
    const admin = getAuthenticatedUser(req);
    if (!admin || admin.role !== "Super Admin") {
       res.status(403).json({ error: "Access Denied" });
       return;
    }

    const { name, address, contact, emergencyEmail, allowedEmergencyCategories, notificationRules } = req.body;
    db.config.name = name ?? db.config.name;
    db.config.address = address ?? db.config.address;
    db.config.contact = contact ?? db.config.contact;
    db.config.emergencyEmail = emergencyEmail ?? db.config.emergencyEmail;
    db.config.allowedEmergencyCategories = allowedEmergencyCategories ?? db.config.allowedEmergencyCategories;
    db.config.notificationRules = notificationRules ?? db.config.notificationRules;

    saveDB();
    addLog(admin.id, admin.name, admin.role, "Modified Command Center Settings", "Altered configurations and notification escalation parameters.");
    res.json(db.config);
  });

  app.put("/api/users/:id", (req, res) => {
    const master = getAuthenticatedUser(req);
    if (!master || (master.role !== "Super Admin" && master.id !== req.params.id)) {
      res.status(403).json({ error: "Access Denied" });
      return;
    }

    const targetUser = db.users.find(u => u.id === req.params.id);
    if (!targetUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const { name, phone } = req.body;
    targetUser.name = name ?? targetUser.name;
    targetUser.phone = phone ?? targetUser.phone;

    // sync child databases
    if (targetUser.role === "Patient") {
      const p = db.patients.find(pv => pv.userId === targetUser.id);
      if (p) {
        p.name = targetUser.name;
        p.phone = targetUser.phone;
      }
    } else if (targetUser.role === "Doctor") {
      const d = db.doctors.find(dv => dv.userId === targetUser.id);
      if (d) {
        d.name = targetUser.name;
        d.phone = targetUser.phone;
      }
    } else if (targetUser.role === "Staff / Nurse") {
      const s = db.staff.find(sv => sv.userId === targetUser.id);
      if (s) {
        s.name = targetUser.name;
        s.phone = targetUser.phone;
      }
    }

    saveDB();
    addLog(master.id, master.name, master.role, "Updated User Profile Settings", `Altered profile credentials for ${targetUser.name}`);
    res.json(targetUser);
  });

  // Helper for disabling accounts
  app.post("/api/users/:id/status", (req, res) => {
    const admin = getAuthenticatedUser(req);
    if (!admin || admin.role !== "Super Admin") {
       res.status(403).json({ error: "Access Denied" });
       return;
    }

    const targetUser = db.users.find(u => u.id === req.params.id);
    if (!targetUser) {
       res.status(404).json({ error: "User profile not found." });
       return;
    }

    const { status } = req.body;
    targetUser.status = status;

    // Update subordinate references
    if (targetUser.role === "Doctor") {
      const doc = db.doctors.find(d => d.userId === targetUser.id);
      if (doc) doc.status = status === "Active" ? "Active" : "Inactive";
    } else if (targetUser.role === "Staff / Nurse") {
      const st = db.staff.find(s => s.userId === targetUser.id);
      if (st) st.status = status === "Active" ? "Active" : "Inactive";
    }

    saveDB();
    addLog(admin.id, admin.name, admin.role, "Altered Account Compliance State", `Changed status for ${targetUser.name} to ${status}`);
    res.json(targetUser);
  });

  // View all accounts
  app.get("/api/users", (req, res) => {
    const admin = getAuthenticatedUser(req);
    if (!admin || admin.role !== "Super Admin") {
       res.status(403).json({ error: "Access Denied" });
       return;
    }
    res.json(db.users);
  });

  // ==================== WEB CLIENT GATEWAY VITE ROUTER ====================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[HOSPITAL Command Center] Server successfully active at http://localhost:${PORT}`);
  });
}

startServer();
