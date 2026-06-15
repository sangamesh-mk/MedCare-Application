import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity, ShieldAlert, Users, Calendar, MessageSquare, BookOpen, Settings,
  AlertTriangle, Search, Plus, Bell, RefreshCw, LogIn, UserPlus, LogOut,
  Moon, Sun, Send, Eye, Trash2, HeartPulse, Shield, Compass, Check, X, Clock, FileText, Ban, BedDouble, QrCode
} from 'lucide-react';
import { User, Doctor, Staff, Patient, HospitalRoom, Appointment, MedicalRecord, EmergencyRequest, Notification, Message, AuditLog, HospitalConfig, UserRole } from './types';

export default function App() {
  // Authentication & Session
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('care_token'));
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null); // Extended Doctor / Staff / Patient data
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Lists & Data
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [rooms, setRooms] = useState<HospitalRoom[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [config, setConfig] = useState<HospitalConfig | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Navigation State
  const [activeTab, setActiveTab ] = useState<string>('Overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatRecipientId, setActiveChatRecipientId] = useState<string | null>(null);

  // Auth Forms
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authRole, setAuthRole] = useState<UserRole>('Patient');
  const [authStep, setAuthStep] = useState<'login' | 'signup' | 'otp' | 'forgot' | 'reset'>('login');
  const [otpCode, setOtpCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [devOtpBox, setDevOtpBox] = useState<string | null>(null);

  // Create Modals / Form States
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [newDocForm, setNewDocForm] = useState({ name: '', email: '', phone: '', department: 'Cardiology', specialty: '' });
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({ name: '', email: '', phone: '', role: 'Nurse', department: 'Cardiology' });
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatForm, setNewPatForm] = useState({ name: '', email: '', phone: '', age: '45', gender: 'Male', bloodGroup: 'O+', address: '', diseaseDetails: '', roomNumber: '305', bedNumber: 'Bed A', doctorId: '', staffId: '', allergies: '', medicalHistory: '', medications: '' });
  const [showAddAppt, setShowAddAppt] = useState(false);
  const [newApptForm, setNewApptForm] = useState({ patientId: '', doctorId: '', date: '', time: '', reason: '' });
  const [newReportForm, setNewReportForm] = useState({ patientId: '', title: '', type: 'Lab Report' as any, description: '' });
  const [showReportModal, setShowReportModal] = useState(false);

  // Edit Patient State
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [doctorNoteInput, setDoctorNoteInput] = useState('');
  const [staffNoteInput, setStaffNoteInput] = useState('');

  // EDIT STATE EXTENSIONS (all 4 clinical players edits)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
  const [doctorEditForm, setDoctorEditForm] = useState({ name: '', department: 'Cardiology', phone: '', specialty: '', status: 'Active' as any });

  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [staffEditForm, setStaffEditForm] = useState({ name: '', role: 'Nurse', department: 'Cardiology', phone: '', status: 'Active' as any });

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [userEditForm, setUserEditForm] = useState({ name: '', phone: '' });

  const [isEditingClinicalPatient, setIsEditingClinicalPatient] = useState(false);
  const [clinicalPatientEditForm, setClinicalPatientEditForm] = useState({
    name: '',
    phone: '',
    age: '45',
    gender: 'Male',
    bloodGroup: 'O+',
    address: '',
    diseaseDetails: '',
    allergies: '',
    currentMedications: '',
    medicalHistory: '',
    roomNumber: '305',
    bedNumber: 'Bed A',
    doctorId: '',
    staffId: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: ''
  });

  const [qrPatient, setQrPatient] = useState<Patient | null>(null);

  // Active Chats Subsets
  const [chatMessageInput, setChatMessageInput ] = useState('');

  // Check for scanning/redirect URL param on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('patientId');
    if (pId) {
      localStorage.setItem('pending_scan_patient_id', pId);
    }
  }, []);

  // Sync scan on logins or list loads
  useEffect(() => {
    if (!token || patients.length === 0 || !user) return;
    const pendingPatId = localStorage.getItem('pending_scan_patient_id');
    if (pendingPatId) {
      const foundPat = patients.find(p => p.id === pendingPatId);
      if (foundPat) {
        const isAuthorizedStaff = ['Super Admin', 'Doctor', 'Staff / Nurse'].includes(user.role);
        const isSelfPatient = user.role === 'Patient' && (userProfile?.id === pendingPatId || patients.find(p => p.userId === user.id)?.id === pendingPatId);
        
        if (isAuthorizedStaff) {
          if (user.role === 'Staff / Nurse') {
            setActiveTab('My Patient Care');
          } else {
            setActiveTab('Patients Catalog');
          }
          setEditingPatient(foundPat);
          localStorage.removeItem('pending_scan_patient_id');
          window.history.replaceState({}, document.title, window.location.pathname);
          // Wait briefly for UI render
          setTimeout(() => {
            alert(`Scanning Success: Redirected into clinical board of ${foundPat.name}!`);
          }, 300);
        } else if (isSelfPatient) {
          setActiveTab('My clinical File');
          localStorage.removeItem('pending_scan_patient_id');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, [token, patients, user, userProfile]);

  // Load context on mount / raw token update
  useEffect(() => {
    if (token) {
      localStorage.setItem('care_token', token);
      fetchMe();
      fetchAllData();
    } else {
      localStorage.removeItem('care_token');
      setUser(null);
      setUserProfile(null);
    }
  }, [token]);

  // Polling loops for notifications, emergencies, and chats
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchLiveAlerts();
    }, 4000);
    return () => clearInterval(interval);
  }, [token]);

  // Handle messages polling specifically when chat room is active
  useEffect(() => {
    if (!token || !activeChatId) return;
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);
    return () => clearInterval(interval);
  }, [token, activeChatId]);

  const apiHeaders = useMemo(() => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, [token]);

  const fetchMe = async () => {
    try {
      const res = await fetch('/api/auth/me', { headers: apiHeaders });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setUserProfile(data.profile);
      } else {
        setToken(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLiveAlerts = async () => {
    try {
      const eRes = await fetch('/api/emergency-requests', { headers: apiHeaders });
      if (eRes.ok) setEmergencies(await eRes.json());
      
      const nRes = await fetch('/api/notifications', { headers: apiHeaders });
      if (nRes.ok) setNotifications(await nRes.json());

      const aRes = await fetch('/api/analytics', { headers: apiHeaders });
      if (aRes.ok) setStats(await aRes.json());
    } catch (e) {
      console.warn("Live alerting update err:", e);
    }
  };

  const fetchAllData = async () => {
    try {
      const [d, s, p, r, ap, conf, u, alg, msg] = await Promise.all([
        fetch('/api/doctors', { headers: apiHeaders }).then(r => r.json()),
        fetch('/api/staff', { headers: apiHeaders }).then(r => r.json()),
        fetch('/api/patients', { headers: apiHeaders }).then(r => r.json()),
        fetch('/api/rooms', { headers: apiHeaders }).then(r => r.json()),
        fetch('/api/appointments', { headers: apiHeaders }).then(r => r.json()),
        fetch('/api/settings', { headers: apiHeaders }).then(r => r.json()),
        user?.role === 'Super Admin' ? fetch('/api/users', { headers: apiHeaders }).then(r => r.json()) : Promise.resolve([]),
        user?.role === 'Super Admin' ? fetch('/api/audit-logs', { headers: apiHeaders }).then(r => r.json()) : Promise.resolve([]),
        fetch('/api/messages', { headers: apiHeaders }).then(r => r.json())
      ]);

      setDoctors(d);
      setStaff(s);
      setPatients(p);
      setRooms(r);
      setAppointments(ap);
      setConfig(conf);
      if (u) setAllUsers(u);
      if (alg) setAuditLogs(alg);
      setMessages(msg);
      fetchLiveAlerts();
    } catch (e) {
      console.error("Data syncing err:", e);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/messages', { headers: apiHeaders });
      if (res.ok) setMessages(await res.json());
    } catch (e) {}
  };

  // Auth Operations
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login Failed");
      setDevOtpBox(data.dev_otp);
      setAuthStep('otp');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword, name: authName, role: authRole, phone: authPhone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup Failed");
      setDevOtpBox(data.dev_otp);
      setAuthStep('otp');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, code: otpCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid Code");
      setToken(data.token);
      setDevOtpBox(null);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit Failed");
      setDevOtpBox(data.dev_otp);
      setAuthStep('reset');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, code: otpCode, newPassword: authPassword })
      });
      if (!res.ok) throw new Error("Reset action rejected");
      setAuthStep('login');
      setDevOtpBox(null);
      alert("Password changed! Please login again with your new credentials.");
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  // Emergency triggers
  const triggerEmergency = async (type: string, customText?: string) => {
    try {
      const res = await fetch('/api/emergency-requests', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({ type, customMessage: customText, criticality: ['Pain Emergency', 'Oxygen Support', 'Doctor Assistance'].includes(type) ? 'High' : 'Medium' })
      });
      if (res.ok) {
        alert(`🔴 ${type} help signal activated. Care staff informed immediately.`);
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEmergencyAction = async (reqId: string, action: 'Accept' | 'In Progress' | 'Complete') => {
    try {
      const statusMap = { 'Accept': 'Accepted', 'In Progress': 'In Progress', 'Complete': 'Completed' };
      const res = await fetch(`/api/emergency-requests/${reqId}`, {
        method: 'PUT',
        headers: apiHeaders,
        body: JSON.stringify({ status: statusMap[action] })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Super Admin CRUD
  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(newDocForm)
      });
      if (res.ok) {
        setShowAddDoctor(false);
        setNewDocForm({ name: '', email: '', phone: '', department: 'Cardiology', specialty: '' });
        fetchAllData();
      }
    } catch (e) {}
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(newStaffForm)
      });
      if (res.ok) {
        setShowAddStaff(false);
        setNewStaffForm({ name: '', email: '', phone: '', role: 'Nurse', department: 'Cardiology' });
        fetchAllData();
      }
    } catch (e) {}
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(newPatForm)
      });
      if (res.ok) {
        setShowAddPatient(false);
        fetchAllData();
      }
    } catch (e) {}
  };

  // Profile and Record updates triggering state synchronization across accounts
  const handleSaveClinicalPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    try {
      const res = await fetch(`/api/patients/${editingPatient.id}`, {
        method: 'PUT',
        headers: apiHeaders,
        body: JSON.stringify({
          name: clinicalPatientEditForm.name,
          phone: clinicalPatientEditForm.phone,
          age: Number(clinicalPatientEditForm.age),
          gender: clinicalPatientEditForm.gender,
          bloodGroup: clinicalPatientEditForm.bloodGroup,
          address: clinicalPatientEditForm.address,
          diseaseDetails: clinicalPatientEditForm.diseaseDetails,
          allergies: clinicalPatientEditForm.allergies.split(',').map(s => s.trim()).filter(Boolean),
          currentMedications: clinicalPatientEditForm.currentMedications.split(',').map(s => s.trim()).filter(Boolean),
          medicalHistory: clinicalPatientEditForm.medicalHistory.split(',').map(s => s.trim()).filter(Boolean),
          roomNumber: clinicalPatientEditForm.roomNumber,
          bedNumber: clinicalPatientEditForm.bedNumber,
          doctorId: clinicalPatientEditForm.doctorId,
          staffId: clinicalPatientEditForm.staffId,
          emergencyContact: {
            name: clinicalPatientEditForm.emergencyContactName,
            relationship: clinicalPatientEditForm.emergencyContactRelationship,
            phone: clinicalPatientEditForm.emergencyContactPhone
          }
        })
      });
      if (res.ok) {
        const uPat = await res.json();
        setEditingPatient(uPat);
        setIsEditingClinicalPatient(false);
        fetchAllData();
        alert("Patient records modified and synchronized successfully!");
      }
    } catch (err) {}
  };

  const handleSavePatientSelfEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    try {
      const res = await fetch(`/api/patients/${userProfile.id}`, {
        method: 'PUT',
        headers: apiHeaders,
        body: JSON.stringify({
          name: clinicalPatientEditForm.name,
          phone: clinicalPatientEditForm.phone,
          age: Number(clinicalPatientEditForm.age),
          gender: clinicalPatientEditForm.gender,
          address: clinicalPatientEditForm.address,
          emergencyContact: {
            name: clinicalPatientEditForm.emergencyContactName,
            relationship: clinicalPatientEditForm.emergencyContactRelationship,
            phone: clinicalPatientEditForm.emergencyContactPhone
          }
        })
      });
      if (res.ok) {
        const uPat = await res.json();
        setUserProfile(uPat);
        setIsEditingClinicalPatient(false);
        fetchAllData();
        fetchMe();
        alert("Your profile has been updated and clinical registers synchronized!");
      }
    } catch (err) {}
  };

  const handleSaveDoctorEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    try {
      const res = await fetch(`/api/doctors/${editingDoctor.id}`, {
        method: 'PUT',
        headers: apiHeaders,
        body: JSON.stringify(doctorEditForm)
      });
      if (res.ok) {
        setShowEditDoctorModal(false);
        setEditingDoctor(null);
        fetchAllData();
        if (user?.role === 'Doctor') fetchMe();
        alert("Doctor profile has been customized successfully!");
      }
    } catch (err) {}
  };

  const handleSaveStaffEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      const res = await fetch(`/api/staff/${editingStaff.id}`, {
        method: 'PUT',
        headers: apiHeaders,
        body: JSON.stringify(staffEditForm)
      });
      if (res.ok) {
        setShowEditStaffModal(false);
        setEditingStaff(null);
        fetchAllData();
        if (user?.role === 'Staff / Nurse') fetchMe();
        alert("Allied staff member attributes updated and synchronized!");
      }
    } catch (err) {}
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: apiHeaders,
        body: JSON.stringify(userEditForm)
      });
      if (res.ok) {
        setShowEditUserModal(false);
        setEditingUser(null);
        fetchMe();
        fetchAllData();
        alert("Account settings saved successfully!");
      }
    } catch (err) {}
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) fetchAllData();
    } catch (e) {}
  };

  const handleDeleteModel = async (path: string, id: string) => {
    if (!confirm("Are you sure you want to permanently delete/discharge this entity?")) return;
    try {
      const res = await fetch(`/api/${path}/${id}`, { method: 'DELETE', headers: apiHeaders });
      if (res.ok) fetchAllData();
    } catch (e) {}
  };

  // Doctor/Nurse Notes & Report submits
  const handleAddDiagnostics = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/medical-records', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(newReportForm)
      });
      if (res.ok) {
        setShowReportModal(false);
        setNewReportForm({ patientId: '', title: '', type: 'Lab Report', description: '' });
        fetchAllData();
        alert("Medical report uploaded successfully!");
      }
    } catch (e) {}
  };

  const submitPatientNotes = async (p: Patient) => {
    try {
      const bodyPayload: any = {};
      if (user?.role === 'Doctor') bodyPayload.doctorNotes = doctorNoteInput;
      if (user?.role === 'Staff / Nurse') bodyPayload.staffNotes = staffNoteInput;
      
      const res = await fetch(`/api/patients/${p.id}`, {
        method: 'PUT',
        headers: apiHeaders,
        body: JSON.stringify(bodyPayload)
      });
      if (res.ok) {
        setDoctorNoteInput('');
        setStaffNoteInput('');
        const updated = await res.json();
        setEditingPatient(updated);
        fetchAllData();
      }
    } catch (e) {}
  };

  // Appointments
  const handleCreateAppt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(newApptForm)
      });
      if (res.ok) {
        setShowAddAppt(false);
        fetchAllData();
        alert("Appointment scheduled.");
      }
    } catch (e) {}
  };

  const handleUpdateApptStatus = async (apptId: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: 'PUT',
        headers: apiHeaders,
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchAllData();
    } catch (e) {}
  };

  // Secure Messages
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessageInput.trim() || !activeChatRecipientId) return;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({ receiverId: activeChatRecipientId, content: chatMessageInput })
      });
      if (res.ok) {
        setChatMessageInput('');
        fetchMessages();
      }
    } catch (e) {}
  };

  // Filter lists by Search
  const filteredPatients = useMemo(() => {
    return patients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.diseaseDetails.toLowerCase().includes(searchQuery.toLowerCase()) || p.roomNumber.includes(searchQuery));
  }, [patients, searchQuery]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.specialty.toLowerCase().includes(searchQuery.toLowerCase()) || d.department.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [doctors, searchQuery]);

  const unreadNotifications = notifications.filter(n => n.status === 'unread');

  // Trigger mark read
  const markNotificationsRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'PUT', headers: apiHeaders });
    fetchLiveAlerts();
  };

  // Start chat with staff/user
  const startChatConversation = (recipientId: string) => {
    setActiveChatRecipientId(recipientId);
    const sortedChatId = [user?.id, recipientId].sort().join('_');
    setActiveChatId(sortedChatId);
    setActiveTab('Chat Platform');
  };

  const activeConversationalMessages = useMemo(() => {
    if (!activeChatId) return [];
    return messages.filter(m => m.chatId === activeChatId);
  }, [messages, activeChatId]);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Dev OTP Box banner */}
      {devOtpBox && (
        <div className="bg-amber-500 text-slate-950 px-6 py-2.5 font-semibold text-center flex items-center justify-center gap-2 shadow-inner">
          <span className="bg-amber-900 text-white rounded px-2 py-0.5 text-xs">MFA DEV BYPASS</span>
          <span>Simulated Mobile/Email OTP Code: <strong className="font-mono text-lg tracking-wider underline">{devOtpBox}</strong></span>
          <span className="text-xs text-amber-900 underline ml-2 cursor-pointer" onClick={() => { setOtpCode(devOtpBox); }}>Auto-Fill Code</span>
        </div>
      )}

      {/* Auth Screen layout if no token */}
      {!token ? (
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className={`max-w-md w-full space-y-8 p-8 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-xl`}>
            
            {/* Branding */}
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-xl bg-sky-600 flex items-center justify-center text-white font-bold text-xl">M+</div>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight">MedCare Pro</h2>
              <p className="mt-1 text-sm text-slate-500 uppercase tracking-widest">Smart Hospital Command</p>
            </div>

            {authStep === 'login' && (
              <form className="mt-8 space-y-4" onSubmit={handleLogin}>
                {authError && <div className="p-3 bg-red-100 text-red-700 text-sm font-semibold rounded-lg">{authError}</div>}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input type="email" required placeholder="name@hospital.com" className="w-full px-4 py-2 mt-1 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                  <input type="password" required placeholder="••••••••" className="w-full px-4 py-2 mt-1 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-sky-600" />
                    Remember Me
                  </label>
                  <span className="text-sky-600 hover:underline cursor-pointer" onClick={() => setAuthStep('forgot')}>Forgot Password?</span>
                </div>
                <button type="submit" className="w-full py-2 px-4 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 transition">Get Security OTP</button>
                <div className="text-center text-xs text-slate-500">
                  New clinical personnel? <span className="text-sky-600 font-bold hover:underline cursor-pointer" onClick={() => setAuthStep('signup')}>Register Profile</span>
                </div>
              </form>
            )}

            {authStep === 'signup' && (
              <form className="mt-8 space-y-4" onSubmit={handleSignup}>
                {authError && <div className="p-3 bg-red-100 text-red-700 text-sm font-semibold rounded-lg">{authError}</div>}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                    <input type="text" required placeholder="Johnathan Doe" className="w-full px-3 py-1.5 mt-1 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" value={authName} onChange={e => setAuthName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Role</label>
                    <select className="w-full px-3 py-1.5 mt-1 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none" value={authRole} onChange={e => setAuthRole(e.target.value as any)}>
                      <option value="Patient">Patient</option>
                      <option value="Doctor">Clinical Doctor</option>
                      <option value="Staff / Nurse">Staff / Nurse</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input type="email" required placeholder="john@hospital.com" className="w-full px-4 py-2 mt-1 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile Number</label>
                  <input type="text" required placeholder="+1 (555) 019-2000" className="w-full px-3 py-1.5 mt-1 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={authPhone} onChange={e => setAuthPhone(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Security Password</label>
                  <input type="password" required placeholder="••••••••" className="w-full px-4 py-2 mt-1 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
                </div>
                <button type="submit" className="w-full py-2 px-4 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 transition">Request Registration Code</button>
                <div className="text-center text-xs text-slate-500">
                  Already registered? <span className="text-sky-600 font-bold hover:underline cursor-pointer" onClick={() => setAuthStep('login')}>Sign In</span>
                </div>
              </form>
            )}

            {authStep === 'otp' && (
              <form className="mt-8 space-y-4" onSubmit={handleVerifyOtp}>
                {authError && <div className="p-3 bg-red-100 text-red-700 text-sm font-semibold rounded-lg">{authError}</div>}
                <div className="text-center text-xs text-slate-500 mb-2">
                  A simulation verification SMS has been emitted. Input the matching code to gain clinical clearance.
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">MFA Verification Code</label>
                  <input type="text" required maxLength={6} placeholder="123456" className="w-full px-4 py-2 mt-1 tracking-widest text-center text-lg font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" value={otpCode} onChange={e => setOtpCode(e.target.value)} />
                </div>
                <button type="submit" className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition">Authorize Access Key</button>
                <button type="button" className="w-full py-1 text-xs text-slate-600 underline" onClick={() => setAuthStep('login')}>Back to Log In</button>
              </form>
            )}

            {authStep === 'forgot' && (
              <form className="mt-8 space-y-4" onSubmit={handleForgotPassword}>
                {authError && <div className="p-3 bg-red-100 text-red-700 text-sm font-semibold rounded-lg">{authError}</div>}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Register Email Address</label>
                  <input type="email" required placeholder="admin@hospital.com" className="w-full px-4 py-2 mt-1 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
                </div>
                <button type="submit" className="w-full py-2 px-4 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 transition">Get Password Reset Token</button>
                <button type="button" className="w-full py-1 text-xs text-slate-600 underline" onClick={() => setAuthStep('login')}>Return to Login</button>
              </form>
            )}

            {authStep === 'reset' && (
              <form className="mt-8 space-y-4" onSubmit={handleResetPassword}>
                {authError && <div className="p-3 bg-red-100 text-red-700 text-sm font-semibold rounded-lg">{authError}</div>}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reset Verification OTP</label>
                  <input type="text" required maxLength={6} placeholder="123456" className="w-full px-4 py-2 mt-1 text-center font-mono" value={otpCode} onChange={e => setOtpCode(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                  <input type="password" required placeholder="••••••••" className="w-full px-4 py-2 mt-1" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
                </div>
                <button type="submit" className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg">Confirm Reset</button>
              </form>
            )}

          </div>
        </div>
      ) : (

        // MASTER COMMAND WORKSPACE WITH SIDEBAR & HEADER
        <div className="flex-1 flex overflow-hidden">
          
          {/* SIDEBAR NAVIGATION - SLATE-900 DESIGN */}
          <aside className="w-64 bg-slate-900 flex flex-col shrink-0 text-slate-300">
            <div className="p-6 flex items-center gap-3 border-b border-slate-800">
              <div className="w-8 h-8 bg-sky-500 rounded flex items-center justify-center text-white font-bold">M+</div>
              <span className="text-white font-bold text-lg tracking-tight">MedCare Pro</span>
            </div>

            <div className="px-4 py-2 mt-3 text-2xs uppercase font-extrabold tracking-widest text-slate-500 self-start">
              Navigation Console
            </div>
            
            <nav className="flex-1 px-4 space-y-1 mt-1">
              {[
                { name: 'Overview', icon: Activity, show: true },
                { name: 'Patients Catalog', icon: Users, show: user?.role !== 'Patient' },
                { name: 'Bed & Room Logistics', icon: BedDouble, show: user?.role === 'Super Admin' },
                { name: 'Doctors Registry', icon: HeartPulse, show: user?.role === 'Super Admin' },
                { name: 'Staff Command', icon: Compass, show: user?.role === 'Super Admin' },
                { name: 'Admissions Desk', icon: Plus, show: user?.role === 'Super Admin' },
                { name: 'My Patient Care', icon: Shield, show: user?.role === 'Staff / Nurse' },
                { name: 'My clinical File', icon: FileText, show: user?.role === 'Patient' ? true : false },
                { name: 'Chat Platform', icon: MessageSquare, show: true },
                { name: 'Clinical Schedule', icon: Calendar, show: true },
                { name: 'System Settings', icon: Settings, show: user?.role === 'Super Admin' }
              ].map(item => {
                if (!item.show) return null;
                const IconComp = item.icon;
                return (
                  <button
                    key={item.name}
                    id={`sidebar-tab-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => setActiveTab(item.name)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition-colors ${
                      activeTab === item.name
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>

            {/* Profile bottom badge */}
            <div className="p-4 mt-auto border-t border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-3">
                <img src={user?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80'} className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 animate-none" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-medium text-white truncate">{user?.name}</p>
                  <p className="text-2xs text-slate-400 truncate uppercase tracking-widest">{user?.role}</p>
                </div>
                <button
                  onClick={() => {
                    if (user?.role === 'Doctor' && userProfile) {
                      setEditingDoctor(userProfile);
                      setDoctorEditForm({
                        name: userProfile.name,
                        department: userProfile.department,
                        phone: userProfile.phone,
                        specialty: userProfile.specialty,
                        status: userProfile.status || 'Active'
                      });
                      setShowEditDoctorModal(true);
                    } else if (user?.role === 'Staff / Nurse' && userProfile) {
                      setEditingStaff(userProfile);
                      setStaffEditForm({
                        name: userProfile.name,
                        role: userProfile.role,
                        department: userProfile.department,
                        phone: userProfile.phone,
                        status: userProfile.status || 'Active'
                      });
                      setShowEditStaffModal(true);
                    } else if (user?.role === 'Patient' && userProfile) {
                      setActiveTab('My clinical File');
                      setIsEditingClinicalPatient(true);
                      setClinicalPatientEditForm({
                        name: userProfile.name,
                        phone: userProfile.phone || '',
                        age: String(userProfile.age || 45),
                        gender: userProfile.gender || 'Male',
                        bloodGroup: userProfile.bloodGroup || 'O+',
                        address: userProfile.address || '',
                        diseaseDetails: userProfile.diseaseDetails || '',
                        allergies: (userProfile.allergies || []).join(', '),
                        currentMedications: (userProfile.currentMedications || []).join(', '),
                        medicalHistory: (userProfile.medicalHistory || []).join(', '),
                        roomNumber: userProfile.roomNumber || '305',
                        bedNumber: userProfile.bedNumber || 'Bed A',
                        doctorId: userProfile.doctorId || '',
                        staffId: userProfile.staffId || '',
                        emergencyContactName: userProfile.emergencyContact?.name || '',
                        emergencyContactRelationship: userProfile.emergencyContact?.relationship || '',
                        emergencyContactPhone: userProfile.emergencyContact?.phone || ''
                      });
                    } else {
                      setEditingUser(user);
                      setUserEditForm({
                        name: user?.name || '',
                        phone: user?.phone || ''
                      });
                      setShowEditUserModal(true);
                    }
                  }}
                  title="Modify Profile and Settings"
                  className="text-slate-400 hover:text-white transition"
                  id="self-edit-profile-btn"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button onClick={() => setToken(null)} title="Sign Out Securely" className="text-red-400 hover:text-red-500 transition">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>

          {/* MAIN CANVAS */}
          <main className="flex-1 flex flex-col overflow-y-auto">
            
            {/* COMPACT POLISHED HEADER */}
            <header className={`h-16 border-b px-8 flex items-center justify-between shrink-0 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-4 w-1/2">
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search patients, IDs, diseases, rooms, doctors..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="flex items-center gap-6">
                
                {/* Emergency Fast Console for user quick tests */}
                {user?.role === 'Patient' && (
                  <button onClick={() => triggerEmergency('Pain Emergency')} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg animate-pulse hover:bg-red-700">
                    🔴 TRIGGER RED ALERT
                  </button>
                )}

                {/* Theme toggle */}
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-500 hover:text-sky-500 rounded-lg">
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                {/* Notification Dropdown toggler */}
                <div className="relative">
                  <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative p-2 text-slate-500 hover:text-sky-500 rounded-lg">
                    <Bell className="w-4 h-4" />
                    {unreadNotifications.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-rose-500 text-white rounded-full text-3xs font-extrabold flex items-center justify-center animate-bounce">
                        {unreadNotifications.length}
                      </span>
                    )}
                  </button>

                  {isNotifOpen && (
                    <div className={`absolute right-0 mt-2 w-80 rounded-xl border p-4 shadow-2xl z-50 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center justify-between border-b pb-2 mb-2">
                        <span className="font-bold text-xs text-slate-500 uppercase tracking-wider">Alerts Sentinel</span>
                        <button className="text-2xs text-sky-600 hover:underline" onClick={markNotificationsRead}>Mark All Read</button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="text-center py-4 text-xs text-slate-400">No active alerts recorded.</div>
                        ) : (
                          notifications.map(notif => (
                            <div key={notif.id} className={`p-2 rounded-lg text-xs leading-normal border ${notif.status === 'unread' ? 'bg-sky-50/50 border-sky-100' : 'bg-slate-50/50 border-slate-100'}`}>
                              <span className="font-semibold block">{notif.title}</span>
                              <p className="text-slate-500 text-2xs">{notif.message}</p>
                              <span className="text-3xs text-slate-400 block mt-1">{new Date(notif.timestamp).toLocaleString()}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Connection Status Badge */}
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
                  <span className="text-2xs font-extrabold text-slate-500 uppercase tracking-widest">Secure HIPAA Node</span>
                </div>
              </div>
            </header>

            {/* DASHBOARD CONTAINER BODY */}
            <div className="flex-1 p-8 space-y-6">
              
              {/* TAB CONTAINER 0: Hospital System Overview */}
              {activeTab === 'Overview' && (
                <div className="space-y-6">
                  
                  {/* Analytic Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className={`p-5 rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <p className="text-2xs font-bold text-slate-400 uppercase tracking-widest">Active Admitted</p>
                      <h3 className="text-3xl font-bold mt-1 text-sky-600">{stats?.totalPatients || '---'} Patients</h3>
                      <span className="text-3xs text-slate-500 block mt-1">St. Jude Campus Command</span>
                    </div>

                    <div className={`p-5 rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <p className="text-2xs font-bold text-slate-400 uppercase tracking-widest">Bed Occupancy</p>
                      <h3 className="text-3xl font-bold mt-1 text-indigo-600">{stats?.beds ? Math.round((stats.beds.occupied / stats.beds.total) * 100) : '84'}%</h3>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-indigo-600 h-1.5" style={{ width: stats?.beds ? `${(stats.beds.occupied / stats.beds.total) * 100}%` : '84%' }}></div>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl border bg-red-50 border-red-100 text-red-900 shadow-sm">
                      <p className="text-2xs font-extrabold text-red-600 uppercase tracking-widest">Sirens Active</p>
                      <h3 className="text-3xl font-black mt-1 text-red-700">{emergencies.filter(e => e.status !== 'Completed').length} Alarms</h3>
                      <span className="text-3xs text-red-500 block mt-1">Pending urgent medical dispatch</span>
                    </div>

                    <div className={`p-5 rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <p className="text-2xs font-bold text-slate-400 uppercase tracking-widest">Avg Staff Latency</p>
                      <h3 className="text-3xl font-bold mt-1 text-emerald-600">3.4 mins</h3>
                      <span className="text-3xs text-slate-500 block mt-1">HIPAA Threshold Safe Limit</span>
                    </div>
                  </div>

                  {/* Two Column Layout: Emergency Board & Resource Allocation */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Active Emergency Signals table */}
                    <div className={`col-span-2 rounded-xl border shadow-sm flex flex-col ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <div className="p-4 border-b flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Active Emergency Sentinel Sirens</h4>
                        <span className="px-2 py-0.5 text-3xs font-extrabold bg-red-100 text-red-700 animate-pulse rounded">LIVE ESCALATION</span>
                      </div>
                      
                      <div className="flex-1 overflow-x-auto min-h-60 max-h-[30rem]">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-2xs border-b">
                            <tr>
                              <th className="px-4 py-2.5">Room / Beds</th>
                              <th className="px-4 py-2.5">Patient Details</th>
                              <th className="px-4 py-2.5">Trigger Condition</th>
                              <th className="px-4 py-2.5">Duty Status</th>
                              <th className="px-4 py-2.5">Operator Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {emergencies.map(em => (
                              <tr key={em.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 font-mono font-medium">Room {em.roomNumber} - {em.bedNumber}</td>
                                <td className="px-4 py-3">
                                  <div className="font-bold">{em.patientName}</div>
                                  <span className="text-slate-400 text-3xs uppercase">ID: {em.id}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded text-3xs font-extrabold ${['Pain Emergency', 'Oxygen Support', 'Doctor Assistance'].includes(em.type) ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {em.type.toUpperCase()}
                                  </span>
                                  {em.customMessage && <p className="text-3xs text-slate-400 mt-1 italic">"{em.customMessage}"</p>}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center gap-1 font-bold ${em.status === 'Completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    <Clock className="w-3.5 h-3.5" />
                                    {em.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 space-x-1 whitespace-nowrap">
                                  {em.status === 'Pending' && (
                                    <button onClick={() => handleEmergencyAction(em.id, 'Accept')} className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-2 py-1 text-3xs rounded-md">Accept</button>
                                  )}
                                  {em.status === 'Accepted' && (
                                    <button onClick={() => handleEmergencyAction(em.id, 'In Progress')} className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2 py-1 text-3xs rounded-md">In Progress</button>
                                  )}
                                  {em.status === 'In Progress' && (
                                    <button onClick={() => handleEmergencyAction(em.id, 'Complete')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 text-3xs rounded-md">Resolve Case</button>
                                  )}
                                  {em.status === 'Completed' && (
                                    <span className="text-emerald-500 text-2xs italic font-semibold">Care Complete</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Department resource gauge card */}
                    <div className="space-y-6">
                      <div className={`p-5 rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest mb-4">Departmental Active Loads</h4>
                        <div className="space-y-4">
                          {stats?.departments?.map((dept: any) => (
                            <div key={dept.id}>
                              <div className="flex justify-between items-center text-xs font-bold mb-1">
                                <span>{dept.name}</span>
                                <span>{dept.occupiedBeds} / {dept.totalBeds} Beds</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                <div className="bg-sky-500 h-1" style={{ width: dept.totalBeds ? `${(dept.occupiedBeds / dept.totalBeds) * 100}%` : '0%' }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-900 text-white p-5 rounded-xl shadow-lg relative overflow-hidden">
                        <div className="absolute right-0 top-0 opacity-10 font-black text-8xl">CR</div>
                        <h4 className="text-3xs font-extrabold uppercase tracking-widest text-sky-400">System Command Sentinel</h4>
                        <p className="text-xs text-slate-300 leading-normal mt-2 mb-4">All hospital secure rooms, ICU critical metrics, and doctor shifts operate in high availability mode.</p>
                        <button onClick={() => alert("HIPAA validation check: OK. Backup logs output: Success.")} className="w-full py-2 bg-slate-800 border border-slate-700 rounded-lg text-2xs font-extrabold uppercase tracking-wider hover:bg-slate-700">Audit Compliance State</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTAINER 1: Patients Directory / Clinical Files */}
              {activeTab === 'Patients Catalog' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black">Patients Dynamic Catalog</h2>
                      <p className="text-slate-500 text-xs">Medical Records, diagnostic notes, assignments, and allergies.</p>
                    </div>
                    {user?.role === 'Super Admin' && (
                      <button id="add-patient-btn" onClick={() => setShowAddPatient(true)} className="bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg shadow">
                        <Plus className="w-4 h-4" /> Add Admission Registry
                      </button>
                    )}
                  </div>

                  <div className={`rounded-xl border shadow overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-2xs border-b">
                        <tr>
                          <th className="px-6 py-3">Patient Registry</th>
                          <th className="px-6 py-3">Room / Bed ID</th>
                          <th className="px-6 py-3">Allocated Doctor</th>
                          <th className="px-6 py-3">Caregiver Staff</th>
                          <th className="px-6 py-3">Principal Condition</th>
                          <th className="px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPatients.map(pat => (
                          <tr key={pat.id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-4">
                              <div className="font-bold text-sm text-slate-900">{pat.name}</div>
                              <div className="text-3xs text-slate-400">Age: {pat.age} | Gender: {pat.gender} | Blood: {pat.bloodGroup}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-slate-100 font-mono font-bold rounded text-slate-800">Room {pat.roomNumber} - {pat.bedNumber}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold">{doctors.find(d => d.id === pat.doctorId)?.name || 'Unassigned'}</div>
                              <span className="text-3xs text-slate-400">Primary Doctor</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold">{staff.find(s => s.id === pat.staffId)?.name || 'Unassigned'}</div>
                              <span className="text-3xs text-slate-400">Ward Assistant</span>
                            </td>
                            <td className="px-6 py-4">
                              <div>{pat.diseaseDetails}</div>
                              {pat.allergies.length > 0 && (
                                <span className="text-3xs text-rose-500 font-bold uppercase tracking-wider block mt-0.5">⚠️ Allergies: {pat.allergies.join(', ')}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 space-x-2">
                              <button onClick={() => { setEditingPatient(pat); }} className="px-3 py-1 bg-sky-50 text-sky-600 hover:bg-sky-100 text-xs font-bold rounded" id={`edit-patient-${pat.id}`}>Clinical Board</button>
                              <button onClick={() => { setQrPatient(pat); }} className="px-3 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold rounded flex items-center gap-1 inline-flex" id={`qr-patient-${pat.id}`}>
                                <QrCode className="w-3.5 h-3.5" /> QR Pass
                              </button>
                              {user?.role === 'Super Admin' && (
                                <button onClick={() => handleDeleteModel('patients', pat.id)} className="px-2 py-1 text-rose-500 hover:bg-rose-50 rounded" title="Discharge and archive Patient"><Trash2 className="w-3.5 h-3.5" /></button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* DETAILED PATIENT CLINICAL BOARD DRAWER OR PANEL */}
              {editingPatient && (
                <div className={`p-6 rounded-xl border border-sky-100 shadow-xl space-y-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-sky-50/50 bg-white'}`}>
                  <div className="flex justify-between items-start border-b pb-4">
                    <div>
                      <span className="text-2xs font-extrabold text-sky-600 uppercase tracking-widest block">Active Clinical Patient Case</span>
                      <h3 className="text-2xl font-black text-slate-900">{editingPatient.name}</h3>
                      <p className="text-xs text-slate-500">Care Center Sector Room {editingPatient.roomNumber} | Blood Type {editingPatient.bloodGroup}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const isCurrentlyEditing = isEditingClinicalPatient;
                          setIsEditingClinicalPatient(!isCurrentlyEditing);
                          if (!isCurrentlyEditing) {
                            setClinicalPatientEditForm({
                              name: editingPatient.name,
                              phone: editingPatient.phone || '',
                              age: String(editingPatient.age),
                              gender: editingPatient.gender,
                              bloodGroup: editingPatient.bloodGroup,
                              address: editingPatient.address || '',
                              diseaseDetails: editingPatient.diseaseDetails || '',
                              allergies: editingPatient.allergies.join(', '),
                              currentMedications: editingPatient.currentMedications.join(', '),
                              medicalHistory: editingPatient.medicalHistory.join(', '),
                              roomNumber: editingPatient.roomNumber,
                              bedNumber: editingPatient.bedNumber,
                              doctorId: editingPatient.doctorId || '',
                              staffId: editingPatient.staffId || '',
                              emergencyContactName: editingPatient.emergencyContact?.name || '',
                              emergencyContactRelationship: editingPatient.emergencyContact?.relationship || '',
                              emergencyContactPhone: editingPatient.emergencyContact?.phone || ''
                            });
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border shadow-sm transition ${
                          isEditingClinicalPatient
                            ? 'bg-rose-600 border-rose-600 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {isEditingClinicalPatient ? 'Cancel Edit' : 'Edit Records'}
                      </button>
                      <button onClick={() => { setEditingPatient(null); setIsEditingClinicalPatient(false); }} className="p-3 bg-white/70 rounded-full border shadow-sm hover:bg-slate-100">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isEditingClinicalPatient ? (
                    <form onSubmit={handleSaveClinicalPatient} className="bg-white p-6 rounded-xl border border-sky-100 space-y-4 text-xs text-slate-800">
                      <div className="border-b pb-2">
                        <h4 className="font-bold text-sm text-sky-700 uppercase tracking-wide">Edit Patient Clinical and Ward Profiles</h4>
                        <p className="text-slate-400 text-2xs">Update any bio-parameters, chamber/bed allocations, Assigned Physician/Nurses, and treatment lists. All updates immediately show in respective accounts.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Full Name</label>
                          <input type="text" required className="w-full px-3 py-1.5 border rounded" value={clinicalPatientEditForm.name} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, name: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Phone Contact</label>
                          <input type="text" className="w-full px-3 py-1.5 border rounded" value={clinicalPatientEditForm.phone} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, phone: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Age</label>
                            <input type="number" required className="w-full px-2 py-1.5 border rounded" value={clinicalPatientEditForm.age} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, age: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Gender</label>
                            <select className="w-full px-2 py-1.5 border rounded" value={clinicalPatientEditForm.gender} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, gender: e.target.value })}>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Blood</label>
                            <select className="w-full px-2 py-1.5 border rounded" value={clinicalPatientEditForm.bloodGroup} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, bloodGroup: e.target.value })}>
                              {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Physical Address</label>
                          <input type="text" className="w-full px-3 py-1.5 border rounded" value={clinicalPatientEditForm.address} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, address: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Current Clinical Condition details</label>
                          <input type="text" className="w-full px-3 py-1.5 border rounded" value={clinicalPatientEditForm.diseaseDetails} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, diseaseDetails: e.target.value })} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t pt-3">
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Emergency contact Name</label>
                          <input type="text" className="w-full px-3 py-1.5 border rounded" value={clinicalPatientEditForm.emergencyContactName} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, emergencyContactName: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Emergency Relation</label>
                          <input type="text" className="w-full px-3 py-1.5 border rounded" value={clinicalPatientEditForm.emergencyContactRelationship} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, emergencyContactRelationship: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Emergency Contact Phone</label>
                          <input type="text" className="w-full px-3 py-1.5 border rounded" value={clinicalPatientEditForm.emergencyContactPhone} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, emergencyContactPhone: e.target.value })} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 border-t pt-3">
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Ward Room Allocation</label>
                          <select className="w-full px-3 py-1.5 border rounded" value={clinicalPatientEditForm.roomNumber} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, roomNumber: e.target.value })}>
                            {rooms.map(r => <option key={r.roomNumber} value={r.roomNumber}>Room {r.roomNumber} ({r.type})</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Target Bed Number</label>
                          <select className="w-full px-3 py-1.5 border rounded" value={clinicalPatientEditForm.bedNumber} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, bedNumber: e.target.value })}>
                            {['Bed A', 'Bed B', 'Bed C', 'Bed D'].map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Assign Primary Doctor</label>
                          <select className="w-full px-3 py-1.5 border rounded" value={clinicalPatientEditForm.doctorId} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, doctorId: e.target.value })}>
                            <option value="">Unassigned</option>
                            {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.department})</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Assign caregiver Staff</label>
                          <select className="w-full px-3 py-1.5 border rounded" value={clinicalPatientEditForm.staffId} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, staffId: e.target.value })}>
                            <option value="">Unassigned</option>
                            {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t pt-3">
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Allergies (comma-separated)</label>
                          <input type="text" className="w-full px-3 py-1.5 border rounded" placeholder="E.g. Peanut, Aspirin" value={clinicalPatientEditForm.allergies} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, allergies: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Ongoing Medications (comma-separated)</label>
                          <input type="text" className="w-full px-3 py-1.5 border rounded" placeholder="E.g. Metformin 500mg, Atorvastatin" value={clinicalPatientEditForm.currentMedications} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, currentMedications: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Medical Background History (comma-separated)</label>
                          <input type="text" className="w-full px-3 py-1.5 border rounded" placeholder="E.g. Hypertension 2018" value={clinicalPatientEditForm.medicalHistory} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, medicalHistory: e.target.value })} />
                        </div>
                      </div>

                      <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase tracking-wider rounded-lg shadow-sm">Save & Synchronize Clinical Changes</button>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Notes addition */}
                      <div className="space-y-4">
                        {user?.role === 'Doctor' && (
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add Diagnostic Board Notes</label>
                            <textarea className="w-full px-4 py-2 border rounded-lg text-xs" rows={4} placeholder="Type medical prescriptions, directives, or scans orders..." value={doctorNoteInput} onChange={e => setDoctorNoteInput(e.target.value)} />
                            <button onClick={() => submitPatientNotes(editingPatient)} className="w-full py-2 bg-sky-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider">Save Medical Directives</button>
                          </div>
                        )}

                        {user?.role === 'Staff / Nurse' && (
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add Daily Monitoring Notes</label>
                            <textarea className="w-full px-4 py-2 border rounded-lg text-xs" rows={4} placeholder="Input temperature check, food intake details, or nurse observations..." value={staffNoteInput} onChange={e => setStaffNoteInput(e.target.value)} />
                            <button onClick={() => submitPatientNotes(editingPatient)} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider">Add Ward Notes</button>
                          </div>
                        )}

                        <div className="p-4 bg-white border rounded-xl space-y-2 text-xs shadow-inner">
                          <span className="font-bold text-slate-400 uppercase text-3xs block tracking-wider">Allergies & Medical Background</span>
                          <div className="space-y-1">
                            <p><strong>Allergies:</strong> {editingPatient.allergies.join(", ") || "No recorded clinical allergies"}</p>
                            <p><strong>History:</strong> {editingPatient.medicalHistory.join(", ") || "No clinical history files"}</p>
                            <p><strong>Medications:</strong> {editingPatient.currentMedications.join(", ") || "No active prescriptions"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Patient Archive Notes Lists */}
                      <div className="space-y-4 col-span-2">
                        <div className="p-4 bg-white rounded-xl border space-y-3">
                          <span className="font-bold text-slate-700 text-xs block border-b pb-2">Treatment Chronology History Log</span>
                          
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            <h5 className="font-bold text-3xs uppercase text-slate-400">Doctor Prescribed Logs</h5>
                            {editingPatient.doctorNotes.length === 0 ? <p className="text-xs text-slate-400 italic">No clinical doctor logs issued yet.</p> : (
                              editingPatient.doctorNotes.map((note, i) => (
                                <div key={i} className="p-2 bg-amber-50/50 border border-amber-100 rounded-lg text-xs">{note}</div>
                              ))
                            )}

                            <h5 className="font-bold text-3xs uppercase text-slate-400 mt-4">Nurse Clinical Checksheets</h5>
                            {editingPatient.staffNotes.length === 0 ? <p className="text-xs text-slate-400 italic">No ward staff checkpoints logged yet.</p> : (
                              editingPatient.staffNotes.map((note, i) => (
                                <div key={i} className="p-2 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs">{note}</div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Diagnostic Reports Upload section */}
                        <div className="flex items-center justify-between">
                          <button onClick={() => { setNewReportForm(prev => ({ ...prev, patientId: editingPatient.id })); setShowReportModal(true); }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow uppercase tracking-wider">
                            Attach Lab/Scan Results File
                          </button>
                          <button onClick={() => startChatConversation(editingPatient.userId)} className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow uppercase tracking-wider">
                            Direct Chat with Patient/Family
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTAINER 2: Bed Room Logistics */}
              {activeTab === 'Bed & Room Logistics' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black">Hospital General Wards & Bed Logistics</h2>
                      <p className="text-slate-500 text-xs">Configure clinical ICU beds, General chambers, and vacant layouts.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {rooms.map(rm => (
                      <div key={rm.id} className={`p-5 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-3 border-b pb-2">
                          <span className="font-extrabold text-sm block">Ward Room {rm.roomNumber}</span>
                          <span className="text-2xs font-bold uppercase px-2 py-0.5 bg-slate-100 rounded text-slate-600">{rm.type}</span>
                        </div>
                        <p className="text-3xs text-slate-400 uppercase tracking-widest font-bold">{rm.department} Sector</p>
                        
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {rm.beds.map(bed => (
                            <div key={bed.bedNumber} className={`p-2.5 rounded-lg border text-center text-xs ${bed.isAvailable ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                              <p className="font-bold font-mono">{bed.bedNumber}</p>
                              <span className="text-3xs block mt-0.5">{bed.isAvailable ? 'VACANT' : 'OCCUPIED'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB CONTAINER 3: Doctors Directory */}
              {activeTab === 'Doctors Registry' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black">Medical Doctors Directory</h2>
                      <p className="text-slate-500 text-xs">Active department heads and healthcare clinical practitioners.</p>
                    </div>
                    {user?.role === 'Super Admin' && (
                      <button id="add-doctor-btn" onClick={() => setShowAddDoctor(true)} className="bg-sky-600 text-white flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg shadow">
                        <Plus className="w-4.5 h-4.5" /> Register Licensed Doctor
                      </button>
                    )}
                  </div>

                  <div className={`rounded-xl border shadow overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-400 uppercase text-2xs border-b">
                        <tr>
                          <th className="px-6 py-3">Medical Doctor Name</th>
                          <th className="px-6 py-3">Specialty / department</th>
                          <th className="px-6 py-3">Mobile Contact</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredDoctors.map(doc => (
                          <tr key={doc.id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-4 flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-xs text-sky-700 font-bold font-mono uppercase">DOC</div>
                              <div>
                                <span className="font-black block">{doc.name}</span>
                                <span className="text-slate-400 text-3xs">{doc.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold">{doc.specialty}</span>
                              <p className="text-slate-400 text-3xs">{doc.department}</p>
                            </td>
                            <td className="px-6 py-4">{doc.phone}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold uppercase text-3xs">On Duty</span>
                            </td>
                            <td className="px-6 py-4">
                              <button onClick={() => startChatConversation(doc.userId)} className="px-3 py-1 bg-sky-50 text-sky-600 font-bold rounded hover:bg-sky-100">Secure Chat</button>
                              {user?.role === 'Super Admin' && (
                                <button onClick={() => {
                                  setEditingDoctor(doc);
                                  setDoctorEditForm({
                                    name: doc.name,
                                    department: doc.department,
                                    phone: doc.phone,
                                    specialty: doc.specialty,
                                    status: doc.status || 'Active'
                                  });
                                  setShowEditDoctorModal(true);
                                }} className="ml-2 px-2.5 py-1 bg-amber-50 text-amber-600 font-bold rounded hover:bg-amber-100" id={`edit-doctor-btn-${doc.id}`}>
                                  Edit
                                </button>
                              )}
                              {user?.role === 'Super Admin' && (
                                <button onClick={() => handleDeleteModel('doctors', doc.id)} className="ml-2 text-rose-500 hover:bg-rose-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB CONTAINER 4: Staff nurse command */}
              {activeTab === 'Staff Command' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black">Allied Caregiver Staff Registry</h2>
                      <p className="text-slate-500 text-xs">On-duty nurses, clerks, and clinical technicians.</p>
                    </div>
                    {user?.role === 'Super Admin' && (
                      <button onClick={() => setShowAddStaff(true)} className="bg-sky-600 text-white flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg shadow">
                        <Plus className="w-4 h-4" /> Add Caregiver
                      </button>
                    )}
                  </div>

                  <div className={`rounded-xl border shadow overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-400 uppercase text-2xs border-b">
                        <tr>
                          <th className="px-6 py-3">Care Member Details</th>
                          <th className="px-6 py-3">Licensed Designation</th>
                          <th className="px-6 py-3">Clinical Sector Allocation</th>
                          <th className="px-6 py-3">Mobile Contact</th>
                          <th className="px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {staff.map(stf => (
                          <tr key={stf.id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-4 flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs text-indigo-700 font-bold uppercase font-mono">NRS</div>
                              <div>
                                <span className="font-bold block">{stf.name}</span>
                                <span className="text-slate-400 text-3xs">{stf.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-semibold">{stf.role}</td>
                            <td className="px-6 py-4">{stf.department}</td>
                            <td className="px-6 py-4">{stf.phone}</td>
                            <td className="px-6 py-4">
                              <button onClick={() => startChatConversation(stf.userId)} className="px-3 py-1 bg-indigo-50 text-indigo-600 font-bold rounded hover:bg-indigo-100">Secure Chat</button>
                              {user?.role === 'Super Admin' && (
                                <button onClick={() => {
                                  setEditingStaff(stf);
                                  setStaffEditForm({
                                    name: stf.name,
                                    role: stf.role,
                                    department: stf.department,
                                    phone: stf.phone,
                                    status: stf.status || 'Active'
                                  });
                                  setShowEditStaffModal(true);
                                }} className="ml-2 px-2.5 py-1 bg-amber-50 text-amber-600 font-bold rounded hover:bg-amber-100" id={`edit-staff-btn-${stf.id}`}>
                                  Edit
                                </button>
                              )}
                              {user?.role === 'Super Admin' && (
                                <button onClick={() => handleDeleteModel('staff', stf.id)} className="ml-2 text-rose-500 hover:bg-rose-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB CONTAINER 5: My Patient Care (Nursing Dashboard for specific assigned patients) */}
              {activeTab === 'My Patient Care' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black">My Patient Care Duties</h2>
                    <p className="text-slate-500 text-xs text-indigo-600 uppercase tracking-widest font-bold">Assigned Care Sector Dashboard</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {patients
                      .filter(p => p.staffId === userProfile?.id)
                      .map(pat => (
                        <div key={pat.id} className="p-6 bg-white rounded-xl border border-indigo-100 shadow-sm space-y-4">
                          <div className="flex justify-between items-start border-b pb-2">
                            <div>
                              <h4 className="font-bold text-lg text-slate-900">{pat.name}</h4>
                              <p className="text-3xs text-slate-400">Biological Parameters: Age {pat.age} | Blood {pat.bloodGroup}</p>
                            </div>
                            <span className="bg-indigo-100 text-indigo-800 text-3xs uppercase px-2 py-0.5 rounded font-black font-mono">Room {pat.roomNumber}</span>
                          </div>

                          <div className="space-y-1 text-xs text-slate-600">
                            <p><strong>Primary Disease Details:</strong> {pat.diseaseDetails}</p>
                            <p><strong>Treatment Plan:</strong> Regular blood pressure evaluation & monitoring.</p>
                            <p><strong>Medication Rules:</strong> {pat.currentMedications.join(", ") || 'No active drug routines'}</p>
                          </div>

                          <div className="flex gap-2">
                            <button onClick={() => setEditingPatient(pat)} className="flex-1 py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg uppercase tracking-wider">Clinical Notes Board</button>
                            <button onClick={() => startChatConversation(pat.userId)} className="py-2 px-3 bg-slate-100 text-slate-800 font-bold text-xs rounded-lg">Send MSG</button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB CONTAINER 6: Patient Clinical Case File (Patient Dashboard View) */}
              {activeTab === 'My clinical File' && (
                <div className="space-y-6">
                  <div className="bg-sky-600 text-white p-6 rounded-2xl shadow-md">
                    <span className="text-3xs uppercase font-extrabold tracking-widest bg-white/20 px-2 py-0.5 rounded">Emergency Command console</span>
                    <h2 className="text-3xl font-black mt-2">Trigger Live Emergency Alert</h2>
                    <p className="text-xs text-sky-100 leading-normal mb-6">Need assistance? Choose from the emergency buttons below. On-duty nurse and doctor will be notified instantly.</p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      {[
                        { type: 'Wheelchair', color: 'bg-indigo-700' },
                        { type: 'Nurse Assistance', color: 'bg-red-700' },
                        { type: 'Doctor Assistance', color: 'bg-red-800' },
                        { type: 'Medicine', color: 'bg-sky-700' },
                        { type: 'Water', color: 'bg-indigo-800' },
                        { type: 'Food', color: 'bg-emerald-700' },
                        { type: 'Oxygen Support', color: 'bg-rose-700' },
                        { type: 'Washroom Assistance', color: 'bg-indigo-700' },
                        { type: 'Bed Adjustment', color: 'bg-slate-700' },
                        { type: 'Pain Emergency', color: 'bg-red-600 animate-pulse' }
                      ].map(button => (
                        <button
                          key={button.type}
                          onClick={() => triggerEmergency(button.type)}
                          className={`${button.color} text-white font-bold p-3 text-xs rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all text-center flex flex-col items-center justify-center`}
                        >
                          <Activity className="w-5 h-5 mb-1" />
                          <span>{button.type}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Patient clinical history viewer */}
                  {userProfile && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className={`p-5 rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h4 className="font-bold text-sm mb-4 border-b pb-2">Medical History & Allergies</h4>
                        <div className="space-y-3 text-xs leading-normal">
                          <p><strong>Primary Admission Diagnosis:</strong> {userProfile.diseaseDetails}</p>
                          <p><strong>Blood Group:</strong> {userProfile.bloodGroup}</p>
                          <div>
                            <strong>Active Scans / Conditions History:</strong>
                            <ul className="list-disc pl-4 mt-1 space-y-1">
                              {userProfile.medicalHistory?.map((h: string, i: number) => <li key={i}>{h}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className={`p-5 rounded-xl border col-span-2 shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h4 className="font-bold text-sm mb-4 border-b pb-2">Care prescriptions & Doctors Notes</h4>
                        <div className="space-y-4">
                          <div>
                            <span className="text-3xs uppercase font-extrabold tracking-widest text-slate-400 block mb-1">Clinical Directives</span>
                            {userProfile.doctorNotes?.map((n: string, i: number) => (
                              <p key={i} className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-xs leading-normal">{n}</p>
                            ))}
                          </div>
                          <div>
                            <span className="text-3xs uppercase font-extrabold tracking-widest text-slate-400 block mb-1">Daily Ward Nurse status</span>
                            {userProfile.staffNotes?.map((n: string, i: number) => (
                              <p key={i} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs leading-normal">{n}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Self Editing section for Patient Profile details */}
                    <div className={`p-5 rounded-xl border col-span-3 mt-6 shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-emerald-50/10 bg-white border-emerald-100'}`}>
                      <div className="flex items-center justify-between border-b pb-3 mb-4">
                        <div>
                          <h4 className="font-bold text-sm text-emerald-800">Edit My Bio-Information & Contacts</h4>
                          <p className="text-2xs text-slate-400">Modify your physical address and primary emergency contact. All updates will immediately synchronize to your doctor & staff's clinical boards.</p>
                        </div>
                        {!isEditingClinicalPatient && (
                          <button
                            onClick={() => {
                              setIsEditingClinicalPatient(true);
                              setClinicalPatientEditForm({
                                name: userProfile.name,
                                phone: userProfile.phone || '',
                                age: String(userProfile.age || 45),
                                gender: userProfile.gender || 'Male',
                                bloodGroup: userProfile.bloodGroup || 'O+',
                                address: userProfile.address || '',
                                diseaseDetails: userProfile.diseaseDetails || '',
                                allergies: (userProfile.allergies || []).join(', '),
                                currentMedications: (userProfile.currentMedications || []).join(', '),
                                medicalHistory: (userProfile.medicalHistory || []).join(', '),
                                roomNumber: userProfile.roomNumber || '305',
                                bedNumber: userProfile.bedNumber || 'Bed A',
                                doctorId: userProfile.doctorId || '',
                                staffId: userProfile.staffId || '',
                                emergencyContactName: userProfile.emergencyContact?.name || '',
                                emergencyContactRelationship: userProfile.emergencyContact?.relationship || '',
                                emergencyContactPhone: userProfile.emergencyContact?.phone || ''
                              });
                            }}
                            className="px-3 py-1.5 bg-emerald-600 font-bold text-xs text-white rounded-lg hover:bg-emerald-700"
                          >
                            Edit Profile Info
                          </button>
                        )}
                      </div>

                      {isEditingClinicalPatient && (
                        <form onSubmit={handleSavePatientSelfEdit} className="space-y-4 text-xs text-slate-800">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">My Full Name</label>
                              <input type="text" required className="w-full px-3 py-1.5 border rounded" value={clinicalPatientEditForm.name} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, name: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">My Contact Phone</label>
                              <input type="text" className="w-full px-3 py-1.5 border rounded" value={clinicalPatientEditForm.phone} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, phone: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">My Age</label>
                                <input type="number" required className="w-full px-3 py-1.5 border rounded" value={clinicalPatientEditForm.age} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, age: e.target.value })} />
                              </div>
                              <div>
                                <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Gender</label>
                                <select className="w-full px-3 py-1.5 border rounded" value={clinicalPatientEditForm.gender} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, gender: e.target.value })}>
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Current Home Address</label>
                            <input type="text" className="w-full px-3 py-1.5 border rounded" value={clinicalPatientEditForm.address} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, address: e.target.value })} />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t pt-3">
                            <div>
                              <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Emergency Contact Name</label>
                              <input type="text" required className="w-full px-3 py-1.5 border rounded" value={clinicalPatientEditForm.emergencyContactName} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, emergencyContactName: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Relationship</label>
                              <input type="text" required className="w-full px-3 py-1.5 border rounded" value={clinicalPatientEditForm.emergencyContactRelationship} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, emergencyContactRelationship: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Emergency Contact Phone</label>
                              <input type="text" required className="w-full px-3 py-1.5 border rounded" value={clinicalPatientEditForm.emergencyContactPhone} onChange={e => setClinicalPatientEditForm({ ...clinicalPatientEditForm, emergencyContactPhone: e.target.value })} />
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setIsEditingClinicalPatient(false)} className="px-4 py-2 border rounded-lg hover:bg-slate-50 text-slate-700">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow">Synchronize profile with Ward</button>
                          </div>
                        </form>
                      )}
                    </div>
                  </>
                )}
                </div>
              )}

              {/* TAB CONTAINER 7: Chat System */}
              {activeTab === 'Chat Platform' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black">Clinical Telemedicine secure Chat</h2>
                    <p className="text-slate-500 text-xs">Secure chat portal linking doctors, nurses, and admitted patients.</p>
                  </div>

                  <div className={`grid grid-cols-3 gap-6 rounded-2xl border p-4 shadow-sm min-h-[30rem] ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    
                    {/* Contacts list */}
                    <div className="border-r pr-4 space-y-3">
                      <span className="font-extrabold text-2xs uppercase tracking-wider text-slate-400 block">Care Contacts</span>
                      <div className="space-y-1.5 overflow-y-auto max-h-[28rem]">
                        {user?.role === 'Super Admin' && (
                          <div className="text-3xs text-slate-400 py-1">Choose a doctor or caregiver from directories to start conversation.</div>
                        )}
                        {[...doctors, ...staff, ...patients]
                          .filter(u => u.userId !== user?.id)
                          .map((contact: any) => (
                            <button
                              key={contact.id}
                              onClick={() => {
                                setActiveChatRecipientId(contact.userId);
                                const combinedChat = [user?.id, contact.userId].sort().join('_');
                                setActiveChatId(combinedChat);
                              }}
                              className={`w-full p-2.5 rounded-lg flex items-center gap-2 text-left text-xs transition ${
                                activeChatRecipientId === contact.userId
                                  ? 'bg-sky-50 text-sky-800 font-extrabold'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-3xs">U</div>
                              <div className="flex-1 overflow-hidden">
                                <span className="block truncate font-black">{contact.name}</span>
                                <span className="text-slate-400 block truncate text-2xs">{contact.email}</span>
                              </div>
                            </button>
                        ))}
                      </div>
                    </div>

                    {/* Chat messaging display box */}
                    <div className="col-span-2 flex flex-col justify-between min-h-[25rem]">
                      {activeChatRecipientId ? (
                        <>
                          {/* Messages list */}
                          <div className="flex-1 p-3 overflow-y-auto space-y-3 max-h-[22rem]">
                            {activeConversationalMessages.map(msg => (
                              <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.senderId === user?.id ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                                <span className="text-3xs text-slate-400 font-bold block mb-0.5">{msg.senderName}</span>
                                <div className={`p-3 rounded-2xl text-xs font-medium leading-normal ${
                                  msg.senderId === user?.id
                                    ? 'bg-sky-600 text-white rounded-br-none'
                                    : 'bg-slate-100 text-slate-800 rounded-bl-none'
                                }`}>
                                  {msg.content}
                                </div>
                                <span className="text-3xs text-slate-400 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                              </div>
                            ))}
                          </div>

                          {/* Message input */}
                          <form onSubmit={handleSendMessage} className="border-t pt-4 flex gap-2">
                            <input
                              type="text"
                              placeholder="Type medical prompt secure statement..."
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                              value={chatMessageInput}
                              onChange={e => setChatMessageInput(e.target.value)}
                            />
                            <button type="submit" className="px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg transition">
                              <Send className="w-4.5 h-4.5" />
                            </button>
                          </form>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                          <MessageSquare className="w-12 h-12 text-slate-300 stroke-1 mb-2 animate-pulse" />
                          <p className="font-extrabold uppercase tracking-widest text-3xs">Hospital Command Safe Messenger</p>
                          <span className="text-2xs max-w-sm mt-1">Select an active Doctor, Caregiver nurse or Admitted Patient from the left column to begin discussion.</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB CONTAINER 8: Clinical Schedule (Appointments list) */}
              {activeTab === 'Clinical Schedule' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black">Clinical Appointments Schedule</h2>
                      <p className="text-slate-500 text-xs">Hospital visitation hours, doctor diagnostic diagnostics checks, and discharge sessions.</p>
                    </div>
                    {user?.role === 'Super Admin' && (
                      <button onClick={() => setShowAddAppt(true)} className="bg-sky-600 text-white flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg shadow">
                        <Plus className="w-4 h-4" /> Schedule Visit
                      </button>
                    )}
                  </div>

                  <div className={`rounded-xl border shadow overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-400 uppercase text-2xs border-b">
                        <tr>
                          <th className="px-6 py-3">Scheduled Patient</th>
                          <th className="px-6 py-3">Allocated Practitioner</th>
                          <th className="px-6 py-3">Scheduled Date</th>
                          <th className="px-6 py-3">Session Reason</th>
                          <th className="px-6 py-3">Clinical Duty Status</th>
                          <th className="px-6 py-3">Operator Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {appointments.map(appt => (
                          <tr key={appt.id} className="hover:bg-slate-50/50">
                            <td className="px-6 py-4 font-black text-slate-900">{appt.patientName}</td>
                            <td className="px-6 py-4 font-bold text-sky-600">{appt.doctorName}</td>
                            <td className="px-6 py-4">
                              <span className="font-semibold block">{appt.date}</span>
                              <span className="text-slate-400 text-3xs font-mono">{appt.time}</span>
                            </td>
                            <td className="px-6 py-4">{appt.reason}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded font-bold uppercase text-3xs ${
                                appt.status === 'Scheduled' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>{appt.status}</span>
                            </td>
                            <td className="px-6 py-4 space-x-1">
                              {appt.status === 'Scheduled' && (
                                <button onClick={() => handleUpdateApptStatus(appt.id, 'Completed')} className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-3xs rounded-md uppercase tracking-wider">Mark Completed</button>
                              )}
                              {appt.status === 'Scheduled' && (
                                <button onClick={() => handleUpdateApptStatus(appt.id, 'Cancelled')} className="text-red-500 hover:bg-red-50 p-1 text-3xs rounded font-bold">Cancel</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB CONTAINER 9: Settings Configuration panel */}
              {activeTab === 'System Settings' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black">Hospital Enterprise Settings Panel</h2>
                    <p className="text-slate-500 text-xs">Set security configurations, toggle features dynamically, and view transaction audit logs.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Settings properties */}
                    {config && (
                      <div className={`p-6 rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <span className="font-black text-slate-800 block text-xs border-b pb-2 mb-4 uppercase tracking-wider">Hospital Attributes Configuration</span>
                        <div className="space-y-4 text-xs">
                          <div>
                            <label className="text-3xs uppercase font-extrabold text-slate-400 block mb-1">Medical Center Designation</label>
                            <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" value={config.name} onChange={e => setConfig({ ...config, name: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-3xs uppercase font-extrabold text-slate-400 block mb-1">Corporate Physical address</label>
                            <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" value={config.address} onChange={e => setConfig({ ...config, address: e.target.value })} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-3xs uppercase font-extrabold text-slate-400 block mb-1">Emergency Escalation Dispatch Email</label>
                              <input type="text" className="w-full px-4 py-2 bg-slate-200 text-slate-500 rounded-lg text-xs cursor-not-allowed" value={config.emergencyEmail} disabled />
                            </div>
                            <div>
                              <label className="text-3xs uppercase font-extrabold text-slate-400 block mb-1">Secure Contact Number</label>
                              <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" value={config.contact} onChange={e => setConfig({ ...config, contact: e.target.value })} />
                            </div>
                          </div>
                          <button onClick={async () => {
                            const res = await fetch('/api/settings', { method: 'POST', headers: apiHeaders, body: JSON.stringify(config) });
                            if (res.ok) alert("Settings successfully committed into system database.");
                          }} className="w-full py-2 bg-sky-600 text-white font-bold rounded-lg uppercase tracking-wider">Save Changes</button>
                        </div>
                      </div>
                    )}

                    {/* Disable/Enable Accounts state */}
                    <div className={`p-6 rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <span className="font-black text-slate-800 block text-xs border-b pb-2 mb-4 uppercase tracking-wider">Medical Center Compliance Accounts Panel</span>
                      
                      <div className="space-y-3 overflow-y-auto max-h-80">
                        {allUsers.map(usr => (
                          <div key={usr.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border text-xs">
                            <div>
                              <strong className="block text-slate-900">{usr.name}</strong>
                              <span className="text-slate-400 text-3xs font-mono">{usr.email} | {usr.role}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded font-black text-3xs uppercase ${usr.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{usr.status}</span>
                              <button onClick={() => toggleUserStatus(usr.id, usr.status)} className={`px-2.5 py-1 text-3xs font-extrabold rounded-md uppercase tracking-wider border transition ${
                                usr.status === 'Active' ? 'border-red-200 text-red-700 hover:bg-red-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                              }`}>
                                {usr.status === 'Active' ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Operational Security Audit compliance logs */}
                  <div className={`p-6 rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="font-black text-slate-800 block text-xs border-b pb-2 mb-4 uppercase tracking-wider">HIPAA Audit Compliance secure Transactions Logs</span>
                    <div className="space-y-2 max-h-60 overflow-y-auto text-xs font-mono">
                      {auditLogs.map(log => (
                        <div key={log.id} className="p-2 border-b text-slate-500 hover:bg-slate-50/50 flex justify-between">
                          <span>[{log.action.toUpperCase()}] {log.details} - Issuer ID: {log.userName}</span>
                          <span className="text-3xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB CONTAINER 10: Super Admin Add Admissions Office */}
              {activeTab === 'Admissions Desk' && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className={`p-6 rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h2 className="text-lg font-black block border-b pb-2 mb-4 uppercase tracking-wider text-sky-600">Secure Healthcare Admission Registration Form</h2>
                    <form onSubmit={handleAddPatient} className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Patient Full Name</label>
                          <input type="text" required className="w-full px-3 py-1.5 border rounded" placeholder="Willie Nelson" value={newPatForm.name} onChange={e => setNewPatForm({ ...newPatForm, name: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Patient Email Address</label>
                          <input type="email" required className="w-full px-3 py-1.5 border rounded" placeholder="willie@example.com" value={newPatForm.email} onChange={e => setNewPatForm({ ...newPatForm, email: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Biological Age</label>
                          <input type="number" required className="w-full px-3 py-1.5 border rounded" value={newPatForm.age} onChange={e => setNewPatForm({ ...newPatForm, age: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Gender Identification</label>
                          <select className="w-full px-3 py-1.5 border rounded" value={newPatForm.gender} onChange={e => setNewPatForm({ ...newPatForm, gender: e.target.value })}>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Blood Group</label>
                          <select className="w-full px-3 py-1.5 border rounded" value={newPatForm.bloodGroup} onChange={e => setNewPatForm({ ...newPatForm, bloodGroup: e.target.value })}>
                            {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Clinical Ward Room Allocation</label>
                          <select className="w-full px-3 py-1.5 border rounded" value={newPatForm.roomNumber} onChange={e => setNewPatForm({ ...newPatForm, roomNumber: e.target.value })}>
                            {rooms.map(r => <option key={r.roomNumber} value={r.roomNumber}>Room {r.roomNumber} ({r.type})</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Target Bed Number</label>
                          <select className="w-full px-3 py-1.5 border rounded" value={newPatForm.bedNumber} onChange={e => setNewPatForm({ ...newPatForm, bedNumber: e.target.value })}>
                            {['Bed A', 'Bed B', 'Bed C', 'Bed D'].map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Assign Physician Specialist</label>
                          <select className="w-full px-3 py-1.5 border rounded" value={newPatForm.doctorId} onChange={e => setNewPatForm({ ...newPatForm, doctorId: e.target.value })}>
                            <option value="">Unassigned</option>
                            {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.department})</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Assign caregiver Support Staff</label>
                          <select className="w-full px-3 py-1.5 border rounded" value={newPatForm.staffId} onChange={e => setNewPatForm({ ...newPatForm, staffId: e.target.value })}>
                            <option value="">Unassigned</option>
                            {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Clinical Sickness Statement & DiagnosisDetails</label>
                        <input type="text" className="w-full px-3 py-1.5 border rounded" placeholder="Chronic Heart disease or mild asthma observation..." value={newPatForm.diseaseDetails} onChange={e => setNewPatForm({ ...newPatForm, diseaseDetails: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Allergies (comma-separated)</label>
                          <input type="text" className="w-full px-2 py-1 border rounded" placeholder="Penicillin, Sulfa" value={newPatForm.allergies} onChange={e => setNewPatForm({ ...newPatForm, allergies: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-3xs uppercase font-bold text-slate-400 block mb-1">Ongoing Medications (comma-separated)</label>
                          <input type="text" className="w-full px-2 py-1 border rounded" placeholder="Aspirin 81mg" value={newPatForm.medications} onChange={e => setNewPatForm({ ...newPatForm, medications: e.target.value })} />
                        </div>
                      </div>
                      <button type="submit" className="w-full py-2 bg-sky-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider shadow">Issue Clinical Admission Register</button>
                    </form>
                  </div>
                </div>
              )}

            </div>

            {/* SECURE LOWER STATUS TRAY / FOOTER */}
            <footer className={`h-10 border-t px-8 flex items-center justify-between shrink-0 text-3xs font-extrabold uppercase tracking-widest ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Active Node Stack: GCP USA-EAST
                </span>
                <span>DB SYNCHRONIZED</span>
                <span>Active HIPAA compliance Protocol</span>
              </div>
              <div>ST. JUDE SMART PATIENT CARE CENTER • CLIENT WEB APP VERSION 2.4.0</div>
            </footer>

          </main>

          {/* REGISTER CLINICAL DOCTOR DIALOG */}
          {showAddDoctor && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[999]">
              <div className="bg-white p-6 rounded-xl border w-full max-w-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Register Licensed Doctor User</h4>
                  <button onClick={() => setShowAddDoctor(false)}><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handleAddDoctor} className="space-y-3 text-xs">
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">Doctor Full Name</label>
                    <input type="text" required className="w-full px-3 py-1.5 border rounded-lg" value={newDocForm.name} onChange={e => setNewDocForm({ ...newDocForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">Email (authentication login)</label>
                    <input type="email" required className="w-full px-3 py-1.5 border rounded-lg" value={newDocForm.email} onChange={e => setNewDocForm({ ...newDocForm, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">Mobile Contact Line</label>
                    <input type="text" required className="w-full px-3 py-1.5 border rounded-lg" value={newDocForm.phone} onChange={e => setNewDocForm({ ...newDocForm, phone: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-3xs uppercase block text-slate-400 mb-0.5">Specialty</label>
                      <input type="text" required className="w-full px-2 py-1 border rounded-lg" value={newDocForm.specialty} onChange={e => setNewDocForm({ ...newDocForm, specialty: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-3xs uppercase block text-slate-400 mb-0.5">Department</label>
                      <select className="w-full px-2 py-1 border rounded-lg" value={newDocForm.department} onChange={e => setNewDocForm({ ...newDocForm, department: e.target.value })}>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Emergency Medicine">Emergency Medicine</option>
                        <option value="Pediatrics">Pediatrics</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2 bg-sky-600 text-white font-bold rounded-lg uppercase tracking-wider">Register Doctor profile</button>
                </form>
              </div>
            </div>
          )}

          {/* REGISTER NURSE CAREGIVER DIALOG */}
          {showAddStaff && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[999]">
              <div className="bg-white p-6 rounded-xl border w-full max-w-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Add Allied Caregiver Team Member</h4>
                  <button onClick={() => setShowAddStaff(false)}><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">Caregiver Full Name</label>
                    <input type="text" required className="w-full px-3 py-1.5 border rounded" value={newStaffForm.name} onChange={e => setNewStaffForm({ ...newStaffForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">Email Address</label>
                    <input type="email" required className="w-full px-3 py-1.5 border rounded" value={newStaffForm.email} onChange={e => setNewStaffForm({ ...newStaffForm, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">Phone Line</label>
                    <input type="text" required className="w-full px-3 py-1.5 border rounded" value={newStaffForm.phone} onChange={e => setNewStaffForm({ ...newStaffForm, phone: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-3xs uppercase block text-slate-400 mb-0.5">Nurse Role Role</label>
                      <select className="w-full px-2 py-1 border rounded" value={newStaffForm.role} onChange={e => setNewStaffForm({ ...newStaffForm, role: e.target.value })}>
                        <option value="Nurse">Licensed Nurse</option>
                        <option value="Physio">Physiotherapist</option>
                        <option value="Technician">Lab Technician</option>
                        <option value="Clerk">Discharge Clerk</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-3xs uppercase block text-slate-400 mb-0.5">Department</label>
                      <select className="w-full px-2 py-1 border rounded" value={newStaffForm.department} onChange={e => setNewStaffForm({ ...newStaffForm, department: e.target.value })}>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Emergency Medicine">Emergency Medicine</option>
                        <option value="Pediatrics">Pediatrics</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg uppercase tracking-wider">Register Allied Caregiver</button>
                </form>
              </div>
            </div>
          )}

          {/* SCHEDULE NEW DISPATCH VISIT DIALOG */}
          {showAddAppt && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[999]">
              <div className="bg-white p-6 rounded-xl border w-full max-w-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Schedule Visitation Checkup</h4>
                  <button onClick={() => setShowAddAppt(false)}><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handleCreateAppt} className="space-y-3 text-xs">
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">Select Patient Account</label>
                    <select required className="w-full px-3 py-1.5 border rounded-lg" value={newApptForm.patientId} onChange={e => setNewApptForm({ ...newApptForm, patientId: e.target.value })}>
                      <option value="">Choose Patient</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.name} (Room {p.roomNumber})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">Select Doctor In charge</label>
                    <select required className="w-full px-3 py-1.5 border rounded-lg" value={newApptForm.doctorId} onChange={e => setNewApptForm({ ...newApptForm, doctorId: e.target.value })}>
                      <option value="">Allocate Doctor</option>
                      {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.department})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-3xs uppercase block text-slate-400 mb-0.5">Diagnostic Date</label>
                      <input type="date" required className="w-full px-2 py-1 border rounded-lg text-3xs" value={newApptForm.date} onChange={e => setNewApptForm({ ...newApptForm, date: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-3xs uppercase block text-slate-400 mb-0.5">Time Period</label>
                      <input type="text" required placeholder="10:30 AM" className="w-full px-2 py-1 border rounded-lg text-3xs" value={newApptForm.time} onChange={e => setNewApptForm({ ...newApptForm, time: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">Visitation Clinical Reason</label>
                    <input type="text" required className="w-full px-3 py-1.5 border rounded-lg" placeholder="ECG scanning or post surgery feedback..." value={newApptForm.reason} onChange={e => setNewApptForm({ ...newApptForm, reason: e.target.value })} />
                  </div>
                  <button type="submit" className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg uppercase tracking-wider">Confirm Appointment</button>
                </form>
              </div>
            </div>
          )}

          {/* REPORT AND LAB FILES UPLOAD DIALOG */}
          {showReportModal && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[999]">
              <div className="bg-white p-6 rounded-xl border w-full max-w-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Submit Interactive Clinical Report File</h4>
                  <button onClick={() => setShowReportModal(false)}><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handleAddDiagnostics} className="space-y-3 text-xs">
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">Lab Test File Title</label>
                    <input type="text" required className="w-full px-3 py-1.5 border rounded-lg" placeholder="E.g. Blood Lipids panel" value={newReportForm.title} onChange={e => setNewReportForm({ ...newReportForm, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">Diagnostics File Type</label>
                    <select className="w-full px-3 py-1.5 border rounded-lg" value={newReportForm.type} onChange={e => setNewReportForm({ ...newReportForm, type: e.target.value as any })}>
                      <option value="Lab Report">Lab Report</option>
                      <option value="Prescription">Prescription</option>
                      <option value="Scan">Scan Report</option>
                      <option value="X-Ray">X-Ray Image</option>
                      <option value="MRI">MRI Scan</option>
                      <option value="Diagnosis">Physician Diagnosis</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">Diagnostic Report Description & Comments</label>
                    <textarea required className="w-full px-3 py-1.5 border rounded-lg text-xs" rows={4} placeholder="Input full blood cells counts, lipids analysis, sugar clearance levels, etc." value={newReportForm.description} onChange={e => setNewReportForm({ ...newReportForm, description: e.target.value })} />
                  </div>
                  <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg uppercase tracking-wider">Confirm Diagnostics File</button>
                </form>
              </div>
            </div>
          )}

          {/* EDIT DOCTOR PROFILE DIALOG */}
          {showEditDoctorModal && editingDoctor && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[999]">
              <div className="bg-white p-6 rounded-xl border w-full max-w-sm space-y-4 text-xs text-slate-800">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Modify Doctor Profile Information</h4>
                  <button onClick={() => { setShowEditDoctorModal(false); setEditingDoctor(null); }}><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handleSaveDoctorEdit} className="space-y-3">
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">Doctor Full Name</label>
                    <input type="text" required className="w-full px-3 py-1.5 border rounded-lg" value={doctorEditForm.name} onChange={e => setDoctorEditForm({ ...doctorEditForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">Doctor Specialty</label>
                    <input type="text" required className="w-full px-3 py-1.5 border rounded-lg" value={doctorEditForm.specialty} onChange={e => setDoctorEditForm({ ...doctorEditForm, specialty: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">Assigned Department</label>
                    <select className="w-full px-3 py-1.5 border rounded-lg" value={doctorEditForm.department} onChange={e => setDoctorEditForm({ ...doctorEditForm, department: e.target.value })}>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Emergency Medicine">Emergency Medicine</option>
                      <option value="Pediatrics">Pediatrics</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">Direct Phone Line</label>
                    <input type="text" required className="w-full px-3 py-1.5 border rounded-lg" value={doctorEditForm.phone} onChange={e => setDoctorEditForm({ ...doctorEditForm, phone: e.target.value })} />
                  </div>
                  <button type="submit" className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg uppercase tracking-wider">Save Doctor Changes</button>
                </form>
              </div>
            </div>
          )}

          {/* EDIT STAFF PROFILE DIALOG */}
          {showEditStaffModal && editingStaff && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[999]">
              <div className="bg-white p-6 rounded-xl border w-full max-w-sm space-y-4 text-xs text-slate-800">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Modify Caregiver Staff Information</h4>
                  <button onClick={() => { setShowEditStaffModal(false); setEditingStaff(null); }}><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handleSaveStaffEdit} className="space-y-3">
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">Staff Caregiver Name</label>
                    <input type="text" required className="w-full px-3 py-1.5 border rounded-lg" value={staffEditForm.name} onChange={e => setStaffEditForm({ ...staffEditForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">Licensed Designation</label>
                    <input type="text" required className="w-full px-3 py-1.5 border rounded-lg" value={staffEditForm.role} onChange={e => setStaffEditForm({ ...staffEditForm, role: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">Sector / Department</label>
                    <select className="w-full px-3 py-1.5 border rounded-lg" value={staffEditForm.department} onChange={e => setStaffEditForm({ ...staffEditForm, department: e.target.value })}>
                       <option value="Cardiology">Cardiology</option>
                       <option value="Neurology">Neurology</option>
                       <option value="Emergency Medicine">Emergency Medicine</option>
                       <option value="Pediatrics">Pediatrics</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">Direct Phone Line</label>
                    <input type="text" required className="w-full px-3 py-1.5 border rounded-lg" value={staffEditForm.phone} onChange={e => setStaffEditForm({ ...staffEditForm, phone: e.target.value })} />
                  </div>
                  <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg uppercase tracking-wider">Save Caregiver Changes</button>
                </form>
              </div>
            </div>
          )}

          {/* EDIT PERSONAL ADMIN ACCOUNT SETTINGS DIALOG */}
          {showEditUserModal && editingUser && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[999]">
              <div className="bg-white p-6 rounded-xl border w-full max-w-sm space-y-4 text-xs text-slate-800">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Modify Account Settings</h4>
                  <button onClick={() => { setShowEditUserModal(false); setEditingUser(null); }}><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handleSaveUserEdit} className="space-y-3">
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">My Display Name</label>
                    <input type="text" required className="w-full px-3 py-1.5 border rounded-lg" value={userEditForm.name} onChange={e => setUserEditForm({ ...userEditForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-3xs uppercase block text-slate-400 mb-0.5">My Contact Phone</label>
                    <input type="text" required className="w-full px-3 py-1.5 border rounded-lg" value={userEditForm.phone} onChange={e => setUserEditForm({ ...userEditForm, phone: e.target.value })} />
                  </div>
                  <button type="submit" className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-extrabold uppercase tracking-wider rounded-lg">Update Profile Settings</button>
                </form>
              </div>
            </div>
          )}

          {/* PRINTABLE QR PASS OVERLAY DIALOG */}
          {qrPatient && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[999]" id="patient-qr-modal-overlay">
              <div className="bg-white p-6 rounded-2xl border w-full max-w-md shadow-2xl relative text-slate-800 space-y-6">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <span className="text-4xs uppercase bg-emerald-100 text-emerald-800 font-extrabold tracking-widest px-2 py-0.5 rounded">Digital ID Passcard</span>
                    <h4 className="font-black text-lg text-slate-900 mt-1">Clinical QR Pass</h4>
                  </div>
                  <button onClick={() => setQrPatient(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-4 h-4" /></button>
                </div>

                <div className="flex flex-col items-center justify-center text-center space-y-4 p-4 bg-slate-50 rounded-xl" id="qr-printable-area">
                  <div className="border-[8px] border-white p-2 shadow-md bg-white rounded-xl">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + "/?patientId=" + qrPatient.id)}`}
                      alt={`QR Pass for ${qrPatient.name}`}
                      className="w-56 h-56"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900 text-base">{qrPatient.name}</h5>
                    <p className="text-slate-400 text-2xs uppercase tracking-wider font-extrabold">Room {qrPatient.roomNumber} • {qrPatient.bloodGroup} Blood Type</p>
                    <p className="text-3xs text-slate-400 mt-2 max-w-xs mx-auto">Scanning this secure medical-grade QR card will securely redirect authorized clinic members directly to {qrPatient.name}'s active clinical file board.</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const printContents = document.getElementById('qr-printable-area')?.innerHTML;
                      if (printContents) {
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>Print St. Jude Hospital QR Pass - ${qrPatient.name}</title>
                                <style>
                                  body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; background: white; }
                                  img { width: 300px; height: 300px; border: 1px solid #ccc; padding: 10px; border-radius: 10px; }
                                  h2 { margin-top: 20px; font-size: 24px; color: #333; }
                                  p { color: #666; font-size: 14px; max-width: 400px; }
                                </style>
                              </head>
                              <body>
                                ${printContents}
                                <script>
                                  window.onload = function() {
                                    window.print();
                                    window.close();
                                  }
                                </script>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                        }
                      }
                    }}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase tracking-widest text-xs rounded-xl shadow-md text-center block animate-none"
                  >
                    Print Secure Passcard
                  </button>
                  <button onClick={() => setQrPatient(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs">Close</button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
