export type UserRole = 'Super Admin' | 'Doctor' | 'Staff / Nurse' | 'Patient';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  avatar: string;
  status: 'Active' | 'Inactive' | 'Pending';
  isVerified: boolean;
}

export interface Doctor {
  id: string;
  userId: string;
  name: string;
  email: string;
  department: string;
  phone: string;
  specialty: string;
  status: 'Active' | 'Inactive';
  assignedPatients: string[]; // Patient IDs
  assignedStaff: string[]; // Staff IDs
  rooms: string[]; // room numbers
}

export interface Staff {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string; // "Nurse" | "Clerk" | "Technician"
  department: string;
  phone: string;
  status: 'Active' | 'Inactive';
  assignedPatients: string[]; // Patient IDs
}

export interface Patient {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  bloodGroup: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  diseaseDetails: string;
  admissionDate: string;
  status: 'Admitted' | 'Discharged' | 'Outpatient';
  doctorId: string; // Assigned doctor ID
  staffId: string; // Assigned staff ID
  roomNumber: string;
  bedNumber: string;
  medicalHistory: string[];
  currentMedications: string[];
  allergies: string[];
  doctorNotes: string[];
  staffNotes: string[];
}

export interface Department {
  id: string;
  name: string;
  headDoctorId: string;
  totalRooms: number;
}

export interface HospitalRoom {
  id: string;
  roomNumber: string;
  department: string;
  type: 'ICU' | 'General' | 'Emergency' | 'Private' | 'Semi-Private';
  totalBeds: number;
  beds: {
    bedNumber: string;
    isAvailable: boolean;
    patientId?: string;
  }[];
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  reason: string;
  status: 'Scheduled' | 'Rescheduled' | 'Cancelled' | 'Completed';
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  type: 'Lab Report' | 'Prescription' | 'Diagnosis' | 'X-Ray' | 'MRI' | 'Scan' | 'Scan Report' | 'Treatment Plan';
  date: string;
  title: string;
  description: string;
  fileUrl?: string; // Simulated file download or viewing URL
  addedByRole: UserRole;
}

export type EmergencyRequestType =
  | 'Wheelchair'
  | 'Nurse Assistance'
  | 'Doctor Assistance'
  | 'Medicine'
  | 'Water'
  | 'Food'
  | 'Oxygen Support'
  | 'Washroom Assistance'
  | 'Bed Adjustment'
  | 'Pain Emergency'
  | 'Custom';

export type EmergencyRequestStatus = 'Pending' | 'Accepted' | 'In Progress' | 'Completed';

export interface EmergencyRequest {
  id: string;
  patientId: string;
  patientName: string;
  roomNumber: string;
  bedNumber: string;
  type: EmergencyRequestType;
  customMessage?: string;
  timestamp: string;
  status: EmergencyRequestStatus;
  criticality: 'Low' | 'Medium' | 'High';
  acceptedByStaffId?: string;
  acceptedByStaffName?: string;
  acceptedByDoctorId?: string;
  acceptedByDoctorName?: string;
  expectedTime?: string; // string (e.g. "5 mins")
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: string;
  status: 'unread' | 'read';
  type: 'emergency' | 'system' | 'message' | 'appointment' | 'record';
  requestId?: string; // Optional reference
}

export interface Message {
  id: string;
  chatId: string; // Combined format (e.g., doc_staff_id, staff_pat_id)
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId: string;
  content: string;
  timestamp: string;
  attachmentUrl?: string;
  attachmentName?: string;
  isRead: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  details: string;
  timestamp: string;
}

export interface HospitalConfig {
  name: string;
  address: string;
  contact: string;
  emergencyEmail: string;
  allowedEmergencyCategories: EmergencyRequestType[];
  notificationRules: {
    criticalAlertsToDoctor: boolean;
    smsOnAccept: boolean;
    autoAssignStaff: boolean;
  };
}
