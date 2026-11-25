import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAdmin } from "../../Context/Admin_context.jsx";
import ProtectedRoute_admin from "../../components/ProtectedRoute_admin.jsx";
import { useNavigate } from "react-router-dom";
import { MdOutlineEdit } from "react-icons/md";
import {
  FaUsers,
  FaWrench,
  FaClipboardList,
  FaTerminal,
  FaEnvelope,
  FaBan,
  FaKey,
  FaSearch,
  FaCheck,
  FaTimes,
  FaEdit,
  FaCommentAlt,
  FaSyncAlt,
  FaSignOutAlt,
  FaCode,
  FaCheckDouble,
  FaRupeeSign,
  FaPaperPlane,
  FaLock,
  FaUserCheck,
  FaDatabase,
  FaChartLine,
  FaCopy,
  FaClock,
  FaFilter,
  FaExclamationTriangle,
  FaBars,
  FaUserShield,
} from "react-icons/fa";

const tabs = [
  { key: "analyse", label: "Analytics", icon: FaChartLine },
  { key: "database", label: "Database", icon: FaDatabase },
  { key: "api", label: "API Console", icon: FaTerminal },
  { key: "message", label: "Send Message", icon: FaEnvelope },
  { key: "block", label: "User Access", icon: FaBan },
  { key: "requests", label: "Admin Requests", icon: FaKey },
];

const apiSuggestions = [
  // --- ADMIN ACTION DISPATCHER (UNIFIED API - ZERO TOKEN BARRIER) ---
  { group: "Admin Action Dispatcher", label: "Action: Generate Customer OTP", url: "/api/v1/admin/action", method: "POST", sample: JSON.stringify({ action: "generate-otp", payload: { serviceRequestId: "<serviceRequestId>" } }, null, 2) },
  { group: "Admin Action Dispatcher", label: "Action: Verify Service OTP", url: "/api/v1/admin/action", method: "POST", sample: JSON.stringify({ action: "verify-otp", payload: { serviceRequestId: "<serviceRequestId>", otp: "123456" } }, null, 2) },
  { group: "Admin Action Dispatcher", label: "Action: Update Job Status", url: "/api/v1/admin/action", method: "POST", sample: JSON.stringify({ action: "update-job-status", payload: { serviceRequestId: "<serviceRequestId>", status: "completed" } }, null, 2) },
  { group: "Admin Action Dispatcher", label: "Action: Set Repair Quote Amount", url: "/api/v1/admin/action", method: "POST", sample: JSON.stringify({ action: "set-quote-amount", payload: { serviceRequestId: "<serviceRequestId>", quoteAmount: 750 } }, null, 2) },
  { group: "Admin Action Dispatcher", label: "Action: Accept Repair Quote", url: "/api/v1/admin/action", method: "POST", sample: JSON.stringify({ action: "accept-repair-quote", payload: { serviceRequestId: "<serviceRequestId>" } }, null, 2) },
  { group: "Admin Action Dispatcher", label: "Action: Reject Repair Quote", url: "/api/v1/admin/action", method: "POST", sample: JSON.stringify({ action: "reject-repair-quote", payload: { serviceRequestId: "<serviceRequestId>", reason: "Repair quote exceeds approved budget" } }, null, 2) },
  { group: "Admin Action Dispatcher", label: "Action: Cancel Service Request", url: "/api/v1/admin/action", method: "POST", sample: JSON.stringify({ action: "cancel-service-request", payload: { serviceRequestId: "<serviceRequestId>", reason: "Customer requested cancellation via phone", cancelledBy: "customer" } }, null, 2) },
  { group: "Admin Action Dispatcher", label: "Action: Mark Payment Received", url: "/api/v1/admin/action", method: "POST", sample: JSON.stringify({ action: "mark-payment", payload: { serviceRequestId: "<serviceRequestId>", paymentType: "cash", amount: 650 } }, null, 2) },
  { group: "Admin Action Dispatcher", label: "Action: Get Entity Details (Customer/Worker/Request)", url: "/api/v1/admin/action", method: "POST", sample: JSON.stringify({ action: "get-entity", payload: { entityType: "customer", email: "user@example.com" } }, null, 2) },
  { group: "Admin Action Dispatcher", label: "Action: Update Customer Profile", url: "/api/v1/admin/action", method: "POST", sample: JSON.stringify({ action: "update-customer", payload: { customerId: "<customerId>", updates: { fullName: "Rohan S. Sharma", phone: "9811223344" } } }, null, 2) },
  { group: "Admin Action Dispatcher", label: "Action: Reset Customer Password", url: "/api/v1/admin/action", method: "POST", sample: JSON.stringify({ action: "reset-password", payload: { userType: "customer", email: "customer@example.com", newPassword: "NewSecurePassword123" } }, null, 2) },
  { group: "Admin Action Dispatcher", label: "Action: Update Worker Profile", url: "/api/v1/admin/action", method: "POST", sample: JSON.stringify({ action: "update-worker", payload: { workerId: "<workerId>", updates: { categories: ["Electrician", "Plumber"] } } }, null, 2) },
  { group: "Admin Action Dispatcher", label: "Action: Update Worker Location (GPS)", url: "/api/v1/admin/action", method: "POST", sample: JSON.stringify({ action: "update-worker-location", payload: { workerId: "<workerId>", latitude: 28.4595, longitude: 77.0266 } }, null, 2) },
  { group: "Admin Action Dispatcher", label: "Action: Reset Worker Password", url: "/api/v1/admin/action", method: "POST", sample: JSON.stringify({ action: "reset-password", payload: { userType: "worker", email: "worker@example.com", newPassword: "NewWorkerPassword123" } }, null, 2) },
  { group: "Admin Action Dispatcher", label: "Action: Rate Worker for Service", url: "/api/v1/admin/action", method: "POST", sample: JSON.stringify({ action: "rate-worker", payload: { serviceRequestId: "<serviceRequestId>", rating: 5, review: "Great on-time repair work" } }, null, 2) },
  { group: "Admin Action Dispatcher", label: "Action: Assign Worker to Request", url: "/api/v1/admin/action", method: "POST", sample: JSON.stringify({ action: "assign-worker", payload: { serviceRequestId: "<serviceRequestId>", workerId: "<workerId>" } }, null, 2) },
  { group: "Admin Action Dispatcher", label: "Action: Get User History (Customer/Worker)", url: "/api/v1/admin/action", method: "POST", sample: JSON.stringify({ action: "get-history", payload: { userType: "customer", id: "<customerId>" } }, null, 2) },

  // --- ADMIN MANAGEMENT ---
  { group: "Admin Management", label: "Analytics Summary", url: "/api/v1/admin/summary", method: "GET", sample: "" },
  { group: "Admin Management", label: "Get All Users & Entities", url: "/api/v1/admin/users", method: "GET", sample: "" },
  { group: "Admin Management", label: "Get All Admin Accounts", url: "/api/v1/admin/admins", method: "GET", sample: "" },
  { group: "Admin Management", label: "Toggle Admin Active / Revoke Access", url: "/api/v1/admin/admins/<adminId>/toggle-active", method: "PATCH", sample: JSON.stringify({ isActive: false }, null, 2) },
  { group: "Admin Management", label: "Update Admin Role (viewer/suggester/master)", url: "/api/v1/admin/admins/<adminId>/role", method: "PATCH", sample: JSON.stringify({ role: "master" }, null, 2) },
  { group: "Admin Management", label: "Suspend User Account", url: "/api/v1/admin/block-user", method: "PATCH", sample: JSON.stringify({ entityType: "customer", email: "user@example.com", until: "2026-12-31T00:00:00Z" }, null, 2) },
  { group: "Admin Management", label: "Unblock User Account", url: "/api/v1/admin/block-user", method: "PATCH", sample: JSON.stringify({ entityType: "customer", email: "user@example.com", action: "unblock" }, null, 2) },
  { group: "Admin Management", label: "Add Internal Comment", url: "/api/v1/admin/comment", method: "POST", sample: JSON.stringify({ entityType: "customer", entityId: "<id>", comment: "Verified account document" }, null, 2) },
  { group: "Admin Management", label: "Edit Entity Field (Quote, Name, Phone)", url: "/api/v1/admin/edit", method: "PATCH", sample: JSON.stringify({ entityType: "serviceRequest", entityId: "<id>", updates: { quoteAmount: 750 } }, null, 2) },
  { group: "Admin Management", label: "Send Message / Email", url: "/api/v1/admin/message", method: "POST", sample: JSON.stringify({ toEmail: "user@example.com", subject: "Karigar Support Update", body: "Your service request quote has been approved." }, null, 2) },
  { group: "Admin Management", label: "Get Message History Log", url: "/api/v1/admin/messages", method: "GET", sample: "" },
  { group: "Admin Management", label: "Get Elevation Requests", url: "/api/v1/admin/requests", method: "GET", sample: "" },
  { group: "Admin Management", label: "Create Admin Elevation Request", url: "/api/v1/admin/request", method: "POST", sample: JSON.stringify({ email: "candidate@example.com", requestedRole: "suggester", reason: "Requires access to review customer tickets", requestedBy: "Lead Admin" }, null, 2) },
  { group: "Admin Management", label: "Approve Admin Request", url: "/api/v1/admin/requests/<requestId>/approve", method: "PATCH", sample: JSON.stringify({ approvedRole: "master" }, null, 2) },
  { group: "Admin Management", label: "Reject Admin Request", url: "/api/v1/admin/requests/<requestId>/reject", method: "PATCH", sample: JSON.stringify({ reason: "Applicant does not meet security requirements" }, null, 2) },
  { group: "Admin Management", label: "Seed Demo Platform Data", url: "/api/v1/admin/seed-demo-data", method: "POST", sample: JSON.stringify({ clearExisting: false, customerCount: 3, workerCount: 3, requestCount: 5 }, null, 2) },
  { group: "Admin Management", label: "Get Current Admin Profile", url: "/api/v1/admin/current-user", method: "GET", sample: "" },
  { group: "Admin Management", label: "Update Admin Full Name", url: "/api/v1/admin/update-fullName", method: "PATCH", sample: JSON.stringify({ fullName: "Himanshu Singh" }, null, 2) },
  { group: "Admin Management", label: "Change Admin Password", url: "/api/v1/admin/change-password", method: "POST", sample: JSON.stringify({ oldPassword: "CurrentPassword123", newPassword: "NewSecurePassword456" }, null, 2) },

  // --- CUSTOMER APIs ---
  { group: "Customer APIs", label: "Customer Login", url: "/api/v1/customer/login", method: "POST", sample: JSON.stringify({ email: "customer@example.com", password: "Password123" }, null, 2) },
  { group: "Customer APIs", label: "Customer Register", url: "/api/v1/customer/register", method: "POST", sample: JSON.stringify({ fullName: "Rohan Sharma", email: "rohan@example.com", phone: "9876543210", password: "Password123", address: "Sector 14, Gurugram" }, null, 2) },
  { group: "Customer APIs", label: "Customer Google Login", url: "/api/v1/customer/google-login", method: "POST", sample: JSON.stringify({ email: "customer@example.com", fullName: "Rohan Sharma", googleId: "google_sub_12345" }, null, 2) },
  { group: "Customer APIs", label: "Current Customer Profile", url: "/api/v1/customer/current-user", method: "GET", sample: "" },
  { group: "Customer APIs", label: "Get Customer by ID", url: "/api/v1/customer/customer-info", method: "POST", sample: JSON.stringify({ customerId: "<customerId>" }, null, 2) },
  { group: "Customer APIs", label: "Update Customer Full Name", url: "/api/v1/customer/update-fullName", method: "PATCH", sample: JSON.stringify({ fullName: "Rohan S. Sharma" }, null, 2) },
  { group: "Customer APIs", label: "Update Customer Phone", url: "/api/v1/customer/update-phone", method: "PATCH", sample: JSON.stringify({ phone: "9811223344" }, null, 2) },
  { group: "Customer APIs", label: "Update Customer Address", url: "/api/v1/customer/update-address", method: "PATCH", sample: JSON.stringify({ address: "Flat 402, DLF Phase 3, Gurugram" }, null, 2) },
  { group: "Customer APIs", label: "Update Customer Email", url: "/api/v1/customer/update-email", method: "PATCH", sample: JSON.stringify({ email: "rohan.new@example.com" }, null, 2) },
  { group: "Customer APIs", label: "Change Customer Password", url: "/api/v1/customer/change-password", method: "POST", sample: JSON.stringify({ oldPassword: "CurrentPassword123", newPassword: "NewSecurePassword456" }, null, 2) },
  { group: "Customer APIs", label: "Generate Customer OTP", url: "/api/v1/customer/generate-otp", method: "POST", sample: JSON.stringify({ serviceRequestId: "<serviceRequestId>" }, null, 2) },
  { group: "Customer APIs", label: "Refresh Customer Access Token", url: "/api/v1/customer/refresh-token", method: "POST", sample: JSON.stringify({ refreshToken: "<your_refresh_token_here>" }, null, 2) },
  { group: "Customer APIs", label: "Customer Logout", url: "/api/v1/customer/logout", method: "POST", sample: JSON.stringify({}, null, 2) },

  // --- WORKER APIs ---
  { group: "Worker APIs", label: "Worker Login", url: "/api/v1/worker/login", method: "POST", sample: JSON.stringify({ email: "worker@example.com", password: "Password123" }, null, 2) },
  { group: "Worker APIs", label: "Worker Register", url: "/api/v1/worker/register", method: "POST", sample: JSON.stringify({ fullName: "Amit Kumar", email: "amit.worker@example.com", phone: "9822334455", password: "Password123", categories: ["Electrician", "Plumber"], address: "Sector 18, Noida" }, null, 2) },
  { group: "Worker APIs", label: "Worker Google Login", url: "/api/v1/worker/google-login", method: "POST", sample: JSON.stringify({ email: "worker@example.com", fullName: "Amit Kumar", googleId: "google_worker_sub_12345" }, null, 2) },
  { group: "Worker APIs", label: "Current Worker Profile", url: "/api/v1/worker/current-user", method: "GET", sample: "" },
  { group: "Worker APIs", label: "Get Worker by ID", url: "/api/v1/worker/worker-info", method: "POST", sample: JSON.stringify({ workerId: "<workerId>" }, null, 2) },
  { group: "Worker APIs", label: "Update Working Categories", url: "/api/v1/worker/update-categories", method: "PATCH", sample: JSON.stringify({ categories: ["Electrician", "Carpenter", "Appliance Repair"] }, null, 2) },
  { group: "Worker APIs", label: "Update Worker Full Name", url: "/api/v1/worker/update-fullName", method: "PATCH", sample: JSON.stringify({ fullName: "Amit S. Kumar" }, null, 2) },
  { group: "Worker APIs", label: "Update Worker Phone", url: "/api/v1/worker/update-phone", method: "PATCH", sample: JSON.stringify({ phone: "9877001122" }, null, 2) },
  { group: "Worker APIs", label: "Update Worker Address", url: "/api/v1/worker/update-address", method: "PATCH", sample: JSON.stringify({ address: "Shop 12, Main Market, Delhi" }, null, 2) },
  { group: "Worker APIs", label: "Update Worker Email", url: "/api/v1/worker/update-email", method: "PATCH", sample: JSON.stringify({ email: "amit.newemail@example.com" }, null, 2) },
  { group: "Worker APIs", label: "Change Worker Password", url: "/api/v1/worker/change-password", method: "POST", sample: JSON.stringify({ oldPassword: "CurrentPassword123", newPassword: "NewSecurePassword456" }, null, 2) },
  { group: "Worker APIs", label: "Update Worker Location (GPS)", url: "/api/v1/worker/update-location", method: "POST", sample: JSON.stringify({ latitude: 28.4595, longitude: 77.0266 }, null, 2) },
  { group: "Worker APIs", label: "Verify Service OTP", url: "/api/v1/worker/verify-otp", method: "POST", sample: JSON.stringify({ serviceRequestId: "<serviceRequestId>", otp: "123456" }, null, 2) },
  { group: "Worker APIs", label: "Rate Worker", url: "/api/v1/worker/rate", method: "POST", sample: JSON.stringify({ workerId: "<workerId>", rating: 5, review: "Prompt and professional work." }, null, 2) },
  { group: "Worker APIs", label: "Refresh Worker Access Token", url: "/api/v1/worker/refresh-token", method: "POST", sample: JSON.stringify({ refreshToken: "<your_refresh_token_here>" }, null, 2) },
  { group: "Worker APIs", label: "Worker Logout", url: "/api/v1/worker/logout", method: "POST", sample: JSON.stringify({}, null, 2) },

  // --- SERVICE REQUEST APIs ---
  { group: "Service Request APIs", label: "Find Nearby Requests", url: "/api/v1/serviceRequest/find-requests", method: "GET", sample: "" },
  { group: "Service Request APIs", label: "Create Service Request", url: "/api/v1/serviceRequest/create", method: "POST", sample: JSON.stringify({ category: "Electrician", description: "Ceiling fan installation and wiring fix", address: "Flat 301, Sector 21, Gurugram", visitingCharge: 150 }, null, 2) },
  { group: "Service Request APIs", label: "Accept Service Request", url: "/api/v1/serviceRequest/accept", method: "POST", sample: JSON.stringify({ serviceRequestId: "<serviceRequestId>" }, null, 2) },
  { group: "Service Request APIs", label: "Set Quote Amount", url: "/api/v1/serviceRequest/<serviceRequestId>/set-quote-amount", method: "PATCH", sample: JSON.stringify({ quoteAmount: 650 }, null, 2) },
  { group: "Service Request APIs", label: "Accept Repair Quote", url: "/api/v1/serviceRequest/accept-repair-quote", method: "PATCH", sample: JSON.stringify({ serviceRequestId: "<serviceRequestId>" }, null, 2) },
  { group: "Service Request APIs", label: "Reject Repair Quote", url: "/api/v1/serviceRequest/<serviceRequestId>/reject-repair-quote", method: "PATCH", sample: JSON.stringify({ reason: "Repair quote exceeds approved budget" }, null, 2) },
  { group: "Service Request APIs", label: "Update Worker Location (En-route)", url: "/api/v1/serviceRequest/<serviceRequestId>/update-worker-location", method: "PATCH", sample: JSON.stringify({ coordinates: [77.0266, 28.4595] }, null, 2) },
  { group: "Service Request APIs", label: "Cancel: Customer Not Responding", url: "/api/v1/serviceRequest/<serviceRequestId>/cancelled-by-worker-as-customer-not-responding", method: "POST", sample: JSON.stringify({ reason: "Customer did not answer calls for 30 minutes" }, null, 2) },
  { group: "Service Request APIs", label: "Cancel: Worker Unable to Serve", url: "/api/v1/serviceRequest/<serviceRequestId>/cancelled-by-worker-as-not-able-to-serve", method: "POST", sample: JSON.stringify({ reason: "Specialized tools unavailable" }, null, 2) },
  { group: "Service Request APIs", label: "Cancel: Worker Late / No Show", url: "/api/v1/serviceRequest/<serviceRequestId>/cancelled-by-customer-as-worker-not-responding-or-late", method: "POST", sample: JSON.stringify({ reason: "Worker over 1 hour late without notice" }, null, 2) },
  { group: "Service Request APIs", label: "Cancel: Booked by Mistake", url: "/api/v1/serviceRequest/<serviceRequestId>/cancelled-by-customer-as-by-mistake", method: "POST", sample: JSON.stringify({ reason: "Selected incorrect service category" }, null, 2) },
  { group: "Service Request APIs", label: "Rate Worker for Service", url: "/api/v1/serviceRequest/<serviceRequestId>/rate-worker", method: "PATCH", sample: JSON.stringify({ rating: 5, review: "Great on-time repair work" }, null, 2) },
  { group: "Service Request APIs", label: "Report Worker Complaint", url: "/api/v1/serviceRequest/<serviceRequestId>/report-worker", method: "POST", sample: JSON.stringify({ complaint: "Worker requested cash without receipt" }, null, 2) },
  { group: "Service Request APIs", label: "Get Service Request Details", url: "/api/v1/serviceRequest/get-service-details", method: "POST", sample: JSON.stringify({ serviceRequestId: "<serviceRequestId>" }, null, 2) },
  { group: "Service Request APIs", label: "Customer Service History", url: "/api/v1/serviceRequest/history", method: "GET", sample: "" },
  { group: "Service Request APIs", label: "Worker Service History", url: "/api/v1/serviceRequest/history_worker", method: "GET", sample: "" },
  { group: "Service Request APIs", label: "Update Job Status", url: "/api/v1/serviceRequest/update-job-status", method: "POST", sample: JSON.stringify({ serviceRequestId: "<serviceRequestId>", status: "completed" }, null, 2) },
  { group: "Service Request APIs", label: "Mark Payment Done", url: "/api/v1/serviceRequest/mark-payment", method: "PUT", sample: JSON.stringify({ serviceRequestId: "<serviceRequestId>", paymentType: "cash" }, null, 2) },

  // --- PAYMENT APIs ---
  { group: "Payment APIs", label: "Create Razorpay Order", url: "/api/v1/payment/<serviceRequestId>/create-order", method: "POST", sample: JSON.stringify({ amount: 650 }, null, 2) },
  { group: "Payment APIs", label: "Verify Razorpay Payment", url: "/api/v1/payment/<serviceRequestId>/verify-payment", method: "POST", sample: JSON.stringify({ razorpay_order_id: "order_EKzX9H5QvYl1Xm", razorpay_payment_id: "pay_EKzXN34M7fB0bA", razorpay_signature: "9b12a83f4b5c6d7e8f0a1b2c3d4e5f6a7b8c9d0e" }, null, 2) },
  { group: "Payment APIs", label: "Cash Payment Received", url: "/api/v1/payment/<serviceRequestId>/payment-received-by-cash", method: "POST", sample: JSON.stringify({ notes: "Cash collected on premise: INR 650" }, null, 2) },
  { group: "Payment APIs", label: "Create Worker Platform Order", url: "/api/v1/payment/create-order-for-worker", method: "POST", sample: JSON.stringify({ amount: 250 }, null, 2) },
  { group: "Payment APIs", label: "Verify Worker Platform Payment", url: "/api/v1/payment/verify-payment-for-worker", method: "POST", sample: JSON.stringify({ razorpayOrderId: "order_WKzX9H5QvYl1Xm", razorpayPaymentId: "pay_WKzXN34M7fB0bA", razorpaySignature: "3f4b5c6d7e8f0a1b2c3d4e5f6a7b8c9d0e9b12a8", amount: 250 }, null, 2) },

  // --- SYSTEM DIAGNOSTICS ---
  { group: "Diagnostics", label: "Server Latency Ping", url: "/api/ping", method: "GET", sample: "" },
  { group: "Diagnostics", label: "Backend Root Ping", url: "/", method: "GET", sample: "" },
];

const AdminDashboard = () => {
  const { admin, token, logoutAdmin } = useAdmin();
  const navigate = useNavigate();

  // Navigation & UI State
  const [activeTab, setActiveTab] = useState("analyse");
  const [dbSubTab, setDbSubTab] = useState("customers");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Data State
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState({ customers: [], workers: [], serviceRequests: [], admins: [] });
  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState([]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Forms State
  const [apiForm, setApiForm] = useState({ url: "", method: "GET", data: "" });
  const [apiResponse, setApiResponse] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState("");

  const getJsonValidationStatus = (str) => {
    if (!str || !str.trim()) return { valid: true, empty: true, message: "Empty body" };
    try {
      JSON.parse(str);
      return { valid: true, empty: false, message: "Valid JSON" };
    } catch (e) {
      return { valid: false, empty: false, message: e.message };
    }
  };

  const [messageForm, setMessageForm] = useState({ toEmail: "", subject: "", body: "" });
  const [messageLoading, setMessageLoading] = useState(false);

  const [blockForm, setBlockForm] = useState({ entityType: "customer", email: "", until: "", action: "block" });

  // Quick Action Modal State
  const [modalType, setModalType] = useState(null);
  const [activeEntity, setActiveEntity] = useState(null);
  const [modalComment, setModalComment] = useState("");
  const [modalEditField, setModalEditField] = useState("");
  const [modalEditValue, setModalEditValue] = useState("");

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const apiBaseUrl = import.meta.env.VITE_API_URL || "https://karigarbackend.vercel.app";

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    if (!token) return;
    refreshAllData();
  }, [token]);

  const refreshAllData = async () => {
    setLoading(true);
    await Promise.all([fetchSummary(), fetchUsers(), fetchMessages(), fetchRequests()]);
    setLastRefreshed(new Date().toLocaleTimeString());
    setLoading(false);
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${apiBaseUrl}/api/v1/admin/summary`, { headers: authHeaders, withCredentials: true });
      setSummary(res.data?.data);
    } catch (err) {
      handleAuthError(err, "Unable to fetch summary");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${apiBaseUrl}/api/v1/admin/users`, { headers: authHeaders, withCredentials: true });
      setUsers(res.data?.data || { customers: [], workers: [], serviceRequests: [], admins: [] });
    } catch (err) {
      handleAuthError(err, "Unable to fetch platform users");
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${apiBaseUrl}/api/v1/admin/messages`, { headers: authHeaders, withCredentials: true });
      setMessages(res.data?.data || []);
    } catch (err) {
      console.error("Messages fetch error:", err.message);
    }
  };

  const fetchRequests = async () => {
    if (admin?.role !== "master") return;
    try {
      const res = await axios.get(`${apiBaseUrl}/api/v1/admin/requests`, { headers: authHeaders, withCredentials: true });
      setRequests(res.data?.data || []);
    } catch (err) {
      console.error("Requests fetch error:", err.message);
    }
  };

  const handleAuthError = (err, fallbackMsg) => {
    const status = err.response?.status;
    const message = err.response?.data?.message || err.message;
    if (status === 401 || /Admin account not found/i.test(message)) {
      try { logoutAdmin(); } catch (e) {}
      localStorage.removeItem("karigar_admin_token");
      localStorage.removeItem("karigar_admin");
      navigate("/signin_admin", { replace: true });
      return;
    }
    showToast(`${fallbackMsg}: ${message}`, "danger");
  };

  // API Console Runner
  const handleApiSubmit = async (e) => {
    e.preventDefault();
    if (!apiForm.url) {
      showToast("Please enter an API URL", "danger");
      return;
    }
    setApiLoading(true);
    setApiResponse(null);

    const startTime = Date.now();
    try {
      const parsedData = apiForm.data ? JSON.parse(apiForm.data) : undefined;
      const targetUrl = apiForm.url.startsWith("http")
        ? apiForm.url
        : `${apiBaseUrl}${apiForm.url.startsWith("/") ? apiForm.url : `/${apiForm.url}`}`;

      const requestHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const res = await axios.request({
        method: apiForm.method.toLowerCase(),
        url: targetUrl,
        data: apiForm.method === "GET" ? undefined : parsedData,
        headers: requestHeaders,
        withCredentials: true,
      });

      const durationMs = Date.now() - startTime;
      setApiResponse({
        success: true,
        status: res.status,
        statusText: res.statusText || "OK",
        durationMs,
        data: res.data,
      });
      showToast(`Request completed (${res.status} in ${durationMs}ms)`, "success");
    } catch (err) {
      const durationMs = Date.now() - startTime;
      setApiResponse({
        success: false,
        status: err.response?.status || 500,
        statusText: err.response?.statusText || "Failed",
        durationMs,
        data: err.response?.data || { message: err.message },
      });
      showToast(`API call failed: ${err.response?.data?.message || err.message}`, "danger");
    } finally {
      setApiLoading(false);
    }
  };

  // Demo Data Seeder
  const handleSeedDemoData = async () => {
    if (!window.confirm("Seed demo users, workers, and service requests into database?")) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `${apiBaseUrl}/api/v1/admin/seed-demo-data`,
        {},
        { headers: authHeaders, withCredentials: true }
      );
      showToast(res.data?.message || "Demo data seeded successfully!", "success");
      refreshAllData();
    } catch (err) {
      showToast("Seed failed: " + (err.response?.data?.message || err.message), "danger");
    } finally {
      setLoading(false);
    }
  };

  // Message Sender
  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    if (!messageForm.toEmail || !messageForm.subject || !messageForm.body) {
      showToast("Please fill in email, subject, and message body", "danger");
      return;
    }
    setMessageLoading(true);
    try {
      await axios.post(`${apiBaseUrl}/api/v1/admin/message`, messageForm, {
        headers: authHeaders,
        withCredentials: true,
      });
      showToast("Message sent successfully!", "success");
      setMessageForm({ toEmail: "", subject: "", body: "" });
      fetchMessages();
    } catch (err) {
      showToast("Send message failed: " + (err.response?.data?.message || err.message), "danger");
    } finally {
      setMessageLoading(false);
    }
  };

  // Block / Unblock User
  const handleBlockUserAction = async (entityType, email, until, action = "block") => {
    try {
      const res = await axios.patch(
        `${apiBaseUrl}/api/v1/admin/block-user`,
        { entityType, email, until, action },
        { headers: authHeaders, withCredentials: true }
      );
      showToast(res.data?.message || `User ${action === "unblock" ? "unblocked" : "blocked"} successfully!`, "success");
      fetchUsers();
      fetchSummary();
      closeModal();
    } catch (err) {
      showToast(`Action failed: ${err.response?.data?.message || err.message}`, "danger");
    }
  };

  // Admin Account Operations: Toggle Active / Revoke Access
  const handleToggleAdminActive = async (adminId, currentActive, email) => {
    if (admin?._id === adminId) {
      showToast("You cannot deactivate your own admin account", "danger");
      return;
    }
    const actionName = currentActive ? "revoke access for" : "restore access for";
    if (!window.confirm(`Are you sure you want to ${actionName} ${email}?`)) return;

    try {
      const res = await axios.patch(
        `${apiBaseUrl}/api/v1/admin/admins/${adminId}/toggle-active`,
        { isActive: !currentActive },
        { headers: authHeaders, withCredentials: true }
      );
      showToast(res.data?.message || "Admin access updated!", "success");
      fetchUsers();
    } catch (err) {
      showToast("Failed to update admin: " + (err.response?.data?.message || err.message), "danger");
    }
  };

  // Admin Account Operations: Update Role
  const handleUpdateAdminRole = async (adminId, currentRole, email) => {
    const newRole = window.prompt(`Update role for ${email} (viewer / suggester / master):`, currentRole);
    if (!newRole || newRole === currentRole) return;
    if (!["viewer", "suggester", "master"].includes(newRole.toLowerCase())) {
      showToast("Role must be viewer, suggester, or master", "danger");
      return;
    }

    try {
      const res = await axios.patch(
        `${apiBaseUrl}/api/v1/admin/admins/${adminId}/role`,
        { role: newRole.toLowerCase() },
        { headers: authHeaders, withCredentials: true }
      );
      showToast(res.data?.message || `Role updated to ${newRole}!`, "success");
      fetchUsers();
    } catch (err) {
      showToast("Failed to change role: " + (err.response?.data?.message || err.message), "danger");
    }
  };

  // Quick Message Admin
  const handleQuickMessageAdmin = (email) => {
    setMessageForm({
      toEmail: email,
      subject: "Important Notice: Karigar Admin Platform",
      body: `Hello,\n\nThis is an administrative communication regarding your Karigar admin privileges.\n\nRegards,\nKarigar Superadmin`,
    });
    setActiveTab("message");
    showToast(`Switched to Message Composer for ${email}`, "info");
  };

  // Approve / Reject Admin Elevation Request
  const handleApproveRequest = async (requestId, role = "viewer") => {
    try {
      const res = await axios.patch(
        `${apiBaseUrl}/api/v1/admin/requests/${requestId}/approve`,
        { approvedRole: role },
        { headers: authHeaders, withCredentials: true }
      );
      showToast(res.data?.message || `Approved as ${role}!`, "success");
      fetchRequests();
      fetchUsers();
    } catch (err) {
      showToast("Approve failed: " + (err.response?.data?.message || err.message), "danger");
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to reject this admin request?")) return;
    try {
      const res = await axios.patch(
        `${apiBaseUrl}/api/v1/admin/requests/${requestId}/reject`,
        {},
        { headers: authHeaders, withCredentials: true }
      );
      showToast(res.data?.message || "Request rejected", "info");
      fetchRequests();
    } catch (err) {
      showToast("Reject failed: " + (err.response?.data?.message || err.message), "danger");
    }
  };

  // Entity Modal Handlers
  const openCommentModal = (entityType, entity) => {
    setActiveEntity({ entityType, ...entity });
    setModalComment("");
    setModalType("comment");
  };

  const openEditModal = (entityType, entity) => {
    setActiveEntity({ entityType, ...entity });
    if (entityType === "serviceRequest") {
      setModalEditField("quoteAmount");
      setModalEditValue(entity.quoteAmount || "");
    } else {
      setModalEditField("fullName");
      setModalEditValue(entity.fullName || "");
    }
    setModalType("edit");
  };

  const closeModal = () => {
    setModalType(null);
    setActiveEntity(null);
  };

  const handleModalCommentSubmit = async (e) => {
    e.preventDefault();
    if (!modalComment.trim()) return;
    try {
      await axios.post(
        `${apiBaseUrl}/api/v1/admin/comment`,
        {
          entityType: activeEntity.entityType,
          entityId: activeEntity._id,
          comment: modalComment,
        },
        { headers: authHeaders, withCredentials: true }
      );
      showToast("Comment added successfully!", "success");
      closeModal();
    } catch (err) {
      showToast("Comment failed: " + (err.response?.data?.message || err.message), "danger");
    }
  };

  const handleModalEditSubmit = async (e) => {
    e.preventDefault();
    if (!modalEditField || modalEditValue === "") return;
    try {
      await axios.patch(
        `${apiBaseUrl}/api/v1/admin/edit`,
        {
          entityType: activeEntity.entityType,
          entityId: activeEntity._id,
          updates: { [modalEditField]: modalEditValue },
        },
        { headers: authHeaders, withCredentials: true }
      );
      showToast("Updated successfully!", "success");
      closeModal();
      fetchUsers();
    } catch (err) {
      showToast("Edit failed: " + (err.response?.data?.message || err.message), "danger");
    }
  };

  // Filtered Lists
  const filteredCustomers = useMemo(() => {
    return (users.customers || []).filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone?.includes(searchTerm);
      const isBlocked = item.suspendedUntil && new Date(item.suspendedUntil) > new Date();
      if (statusFilter === "blocked") return matchSearch && isBlocked;
      if (statusFilter === "active") return matchSearch && !isBlocked;
      return matchSearch;
    });
  }, [users.customers, searchTerm, statusFilter]);

  const filteredWorkers = useMemo(() => {
    return (users.workers || []).filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone?.includes(searchTerm) ||
        item.workingCategory?.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase()));
      const isBlocked = item.suspendedUntil && new Date(item.suspendedUntil) > new Date();
      if (statusFilter === "blocked") return matchSearch && isBlocked;
      if (statusFilter === "active") return matchSearch && !isBlocked;
      return matchSearch;
    });
  }, [users.workers, searchTerm, statusFilter]);

  const filteredRequests = useMemo(() => {
    return (users.serviceRequests || []).filter((item) => {
      const matchSearch =
        !searchTerm ||
        item._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.workerId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
      if (statusFilter === "all") return matchSearch;
      return matchSearch && item.orderStatus?.toLowerCase() === statusFilter.toLowerCase();
    });
  }, [users.serviceRequests, searchTerm, statusFilter]);

  const filteredAdmins = useMemo(() => {
    return (users.admins || []).filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.role?.toLowerCase().includes(searchTerm.toLowerCase());
      if (statusFilter === "all") return matchSearch;
      if (statusFilter === "active") return matchSearch && item.isActive;
      if (statusFilter === "blocked" || statusFilter === "deactivated") return matchSearch && !item.isActive;
      return matchSearch;
    });
  }, [users.admins, searchTerm, statusFilter]);

  const allBlockedUsers = useMemo(() => {
    const list = [];
    (users.customers || []).forEach((c) => {
      if (c.suspendedUntil && new Date(c.suspendedUntil) > new Date()) {
        list.push({ ...c, entityType: "customer" });
      }
    });
    (users.workers || []).forEach((w) => {
      if (w.suspendedUntil && new Date(w.suspendedUntil) > new Date()) {
        list.push({ ...w, entityType: "worker" });
      }
    });
    return list;
  }, [users]);

  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case "master":
        return <span className="badge bg-warning text-dark fw-bold px-2 py-1"><FaKey className="me-1" /> MASTER</span>;
      case "suggester":
        return <span className="badge bg-info text-dark fw-semibold px-2 py-1"><FaCommentAlt className="me-1" /> SUGGESTER</span>;
      case "viewer":
      default:
        return <span className="badge bg-secondary text-white px-2 py-1">VIEWER</span>;
    }
  };

  return (
    <ProtectedRoute_admin isAuthenticated={Boolean(token)}>
      <div className="d-flex flex-column flex-md-row min-vh-100 bg-light" style={{ fontFamily: "Inter, sans-serif" }}>
        
        {/* Mobile Header */}
        <div className="d-md-none bg-dark text-white p-3 d-flex justify-content-between align-items-center shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <span className="p-2 rounded-3 bg-primary text-white fw-bold"><FaWrench /></span>
            <span className="fw-bold fs-5">Karigar Admin</span>
          </div>
          <button className="btn btn-sm btn-outline-light" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <FaBars />
          </button>
        </div>

        {/* Sidebar */}
        <aside
          className={`bg-dark text-white p-3 d-flex flex-column shadow-lg ${
            mobileMenuOpen ? "d-block" : "d-none d-md-flex"
          }`}
          style={{ width: mobileMenuOpen ? "100%" : "270px", minWidth: "270px" }}
        >
          {/* Logo Brand */}
          <div className="d-none d-md-flex align-items-center gap-2 pb-3 mb-3 border-bottom border-secondary">
            <div className="rounded-3 bg-primary p-2 text-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: 38, height: 38 }}>
              <FaWrench />
            </div>
            <div>
              <h6 className="mb-0 fw-bold text-white tracking-wide">KARIGAR ADMIN</h6>
              <small className="text-secondary" style={{ fontSize: "11px" }}>Management Console</small>
            </div>
          </div>

          {/* Admin Profile Box */}
          <div className="p-3 mb-3 rounded-3 bg-secondary bg-opacity-25 border border-secondary border-opacity-50">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2 overflow-hidden">
                <div
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold overflow-hidden flex-shrink-0"
                  style={{ width: 36, height: 36, fontSize: "14px" }}
                >
                  {admin?.profilePhoto ? (
                    <img src={admin.profilePhoto} alt="Admin" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : admin?.email ? (
                    admin.email.charAt(0).toUpperCase()
                  ) : (
                    "A"
                  )}
                </div>
                <div className="overflow-hidden">
                  <div className="text-truncate fw-semibold text-white small" title={admin?.fullName || admin?.email}>
                    {admin?.fullName || admin?.email}
                  </div>
                  <div className="mt-1">{getRoleBadge(admin?.role)}</div>
                </div>
              </div>
              <MdOutlineEdit
                size={22}
                className="text-light text-opacity-75"
                style={{ cursor: "pointer", transition: "color 0.2s" }}
                title="Edit Profile"
                onClick={() => navigate("/edit_admin")}
              />
            </div>
            <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-25 text-secondary" style={{ fontSize: "11px" }}>
              <span>Status: <span className="text-success fw-bold">Online</span></span>
              {admin?.role === "master" && requests.length > 0 && (
                <span className="badge bg-danger rounded-pill">{requests.length} pending</span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="nav flex-column gap-1 mb-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              const isRequestsTab = tab.key === "requests";
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    setMobileMenuOpen(false);
                  }}
                  className={`btn text-start d-flex justify-content-between align-items-center px-3 py-2 rounded-3 border-0 transition-all ${
                    isActive
                      ? "bg-primary text-white fw-semibold shadow-sm"
                      : "text-light text-opacity-75 hover-bg-secondary"
                  }`}
                  style={{
                    backgroundColor: isActive ? "#0d6efd" : "transparent",
                    transition: "all 0.15s ease-in-out",
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <Icon className={isActive ? "text-white" : "text-secondary"} />
                    <span>{tab.label}</span>
                  </div>
                  {isRequestsTab && requests.length > 0 && (
                    <span className="badge bg-danger rounded-pill px-2 py-1">{requests.length}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="pt-3 border-top border-secondary border-opacity-50 mt-3">
            <button
              onClick={() => logoutAdmin()}
              className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 btn-sm py-2"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
            <div className="text-center text-secondary mt-2" style={{ fontSize: "10px" }}>
              Karigar Core v2.0 • Admin
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow-1 p-3 p-md-4 overflow-auto">
          {/* Header Action Bar */}
          <header className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4 pb-2 border-bottom">
            <div>
              <h4 className="fw-bold mb-1 text-dark">
                {tabs.find((t) => t.key === activeTab)?.label}
              </h4>
              <p className="text-muted small mb-0">
                {activeTab === "analyse" && "Real-time metrics, platform users, and order lifecycle."}
                {activeTab === "database" && "Inspect and manage customers, skilled workers, service requests, and administrator accounts."}
                {activeTab === "api" && "Direct interactive API console covering all platform endpoints."}
                {activeTab === "message" && "Broadcast announcements or send targeted emails to any user or admin."}
                {activeTab === "block" && "Manage suspensions, access restrictions, and account reactivations."}
                {activeTab === "requests" && "Review and approve/reject pending admin role elevation requests."}
              </p>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              {lastRefreshed && (
                <span className="text-muted small d-none d-lg-inline me-2">
                  <FaClock className="me-1" /> Refreshed: {lastRefreshed}
                </span>
              )}
              <button
                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2 shadow-sm"
                onClick={refreshAllData}
                disabled={loading}
              >
                <FaSyncAlt className={loading ? "spin" : ""} />
                <span>{loading ? "Refreshing..." : "Refresh"}</span>
              </button>
              {admin?.role === "master" && (
                <button
                  className="btn btn-sm btn-outline-success d-flex align-items-center gap-1 shadow-sm"
                  onClick={handleSeedDemoData}
                  title="Generate dummy data for testing"
                >
                  <FaDatabase /> Seed Demo Data
                </button>
              )}
            </div>
          </header>

          {/* Toast Notification Alert */}
          {toast && (
            <div
              className={`alert alert-${toast.type} alert-dismissible fade show d-flex align-items-center justify-content-between shadow-sm rounded-3 py-2 px-3 mb-4`}
              role="alert"
            >
              <div className="d-flex align-items-center gap-2">
                {toast.type === "success" && <FaCheck className="text-success" />}
                {toast.type === "danger" && <FaExclamationTriangle className="text-danger" />}
                {toast.type === "info" && <FaCommentAlt className="text-info" />}
                <span>{toast.message}</span>
              </div>
              <button type="button" className="btn-close p-2" onClick={() => setToast(null)}></button>
            </div>
          )}

          {/* TAB 1: ANALYTICS */}
          {activeTab === "analyse" && (
            <div className="row g-3">
              <div className="col-12 col-sm-6 col-xl-3">
                <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>Total Customers</small>
                      <h2 className="fw-bold mb-0 text-dark mt-1">{summary?.customerCount ?? users.customers?.length ?? "0"}</h2>
                      <small className="text-success fw-semibold"><FaUserCheck className="me-1" />Registered</small>
                    </div>
                    <div className="p-3 rounded-4 bg-primary bg-opacity-10 text-primary fs-4"><FaUsers /></div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-xl-3">
                <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>Skilled Workers</small>
                      <h2 className="fw-bold mb-0 text-dark mt-1">{summary?.workerCount ?? users.workers?.length ?? "0"}</h2>
                      <small className="text-success fw-semibold">{summary?.activeWorkers ?? 0} Available Now</small>
                    </div>
                    <div className="p-3 rounded-4 bg-success bg-opacity-10 text-success fs-4"><FaWrench /></div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-xl-3">
                <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>Service Requests</small>
                      <h2 className="fw-bold mb-0 text-dark mt-1">{summary?.requestCount ?? users.serviceRequests?.length ?? "0"}</h2>
                      <small className="text-info fw-semibold"><FaCheckDouble className="me-1" />{summary?.completedRequests ?? 0} Completed</small>
                    </div>
                    <div className="p-3 rounded-4 bg-info bg-opacity-10 text-info fs-4"><FaClipboardList /></div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-xl-3">
                <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>Completed Volume</small>
                      <h2 className="fw-bold mb-0 text-dark mt-1">₹{summary?.totalRevenue ?? 0}</h2>
                      <small className="text-warning fw-semibold">Paid quotes total</small>
                    </div>
                    <div className="p-3 rounded-4 bg-warning bg-opacity-10 text-warning fs-4"><FaRupeeSign /></div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-xl-3">
                <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>Active Admins</small>
                      <h2 className="fw-bold mb-0 text-dark mt-1">{users.admins?.length ?? 0}</h2>
                      <small className="text-primary fw-semibold pointer" onClick={() => { setActiveTab("database"); setDbSubTab("admins"); }}>
                        Manage Admins &rarr;
                      </small>
                    </div>
                    <div className="p-3 rounded-4 bg-primary bg-opacity-10 text-primary fs-4"><FaUserShield /></div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-xl-3">
                <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: "11px" }}>Suspended Users</small>
                      <h2 className="fw-bold mb-0 text-danger mt-1">
                        {(summary?.blockedCustomers || 0) + (summary?.blockedWorkers || 0)}
                      </h2>
                      <small className="text-muted">
                        {summary?.blockedCustomers ?? 0} Customers, {summary?.blockedWorkers ?? 0} Workers
                      </small>
                    </div>
                    <div className="p-3 rounded-4 bg-danger bg-opacity-10 text-danger fs-4"><FaBan /></div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-xl-6">
                <div className="card border-0 shadow-sm rounded-4 h-100 p-4 bg-white">
                  <h6 className="fw-bold text-dark mb-3">Service Order Lifecycle</h6>
                  <div className="row text-center g-3">
                    <div className="col-4">
                      <div className="p-3 rounded-3 bg-light">
                        <small className="text-muted d-block mb-1">Pending</small>
                        <h4 className="fw-bold mb-0 text-warning">{summary?.pendingRequests ?? 0}</h4>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-3 rounded-3 bg-light">
                        <small className="text-muted d-block mb-1">In Progress</small>
                        <h4 className="fw-bold mb-0 text-info">{summary?.inProgressRequests ?? 0}</h4>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-3 rounded-3 bg-light">
                        <small className="text-muted d-block mb-1">Completed</small>
                        <h4 className="fw-bold mb-0 text-success">{summary?.completedRequests ?? 0}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATABASE */}
          {activeTab === "database" && (
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
                <div className="btn-group p-1 bg-light rounded-pill border">
                  <button
                    className={`btn btn-sm rounded-pill px-3 ${dbSubTab === "customers" ? "btn-primary shadow-sm" : "text-muted"}`}
                    onClick={() => { setDbSubTab("customers"); setStatusFilter("all"); }}
                  >
                    Customers ({users.customers?.length || 0})
                  </button>
                  <button
                    className={`btn btn-sm rounded-pill px-3 ${dbSubTab === "workers" ? "btn-primary shadow-sm" : "text-muted"}`}
                    onClick={() => { setDbSubTab("workers"); setStatusFilter("all"); }}
                  >
                    Workers ({users.workers?.length || 0})
                  </button>
                  <button
                    className={`btn btn-sm rounded-pill px-3 ${dbSubTab === "requests" ? "btn-primary shadow-sm" : "text-muted"}`}
                    onClick={() => { setDbSubTab("requests"); setStatusFilter("all"); }}
                  >
                    Requests ({users.serviceRequests?.length || 0})
                  </button>
                  <button
                    className={`btn btn-sm rounded-pill px-3 ${dbSubTab === "admins" ? "btn-primary shadow-sm" : "text-muted"}`}
                    onClick={() => { setDbSubTab("admins"); setStatusFilter("all"); }}
                  >
                    Admins ({users.admins?.length || 0})
                  </button>
                  <button
                    className={`btn btn-sm rounded-pill px-3 ${dbSubTab === "messages" ? "btn-primary shadow-sm" : "text-muted"}`}
                    onClick={() => { setDbSubTab("messages"); setStatusFilter("all"); }}
                  >
                    Message Log ({messages?.length || 0})
                  </button>
                </div>

                <div className="d-flex flex-wrap gap-2 w-100 w-md-auto">
                  <div className="input-group input-group-sm" style={{ minWidth: "220px" }}>
                    <span className="input-group-text bg-light border-end-0"><FaSearch className="text-muted" /></span>
                    <input
                      type="text"
                      className="form-control border-start-0 bg-light"
                      placeholder="Search name, email, ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button className="btn btn-outline-secondary" onClick={() => setSearchTerm("")}>
                        <FaTimes />
                      </button>
                    )}
                  </div>

                  {dbSubTab !== "messages" && (
                    <select
                      className="form-select form-select-sm"
                      style={{ width: "auto" }}
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      {dbSubTab === "requests" ? (
                        <>
                          <option value="pending">Pending</option>
                          <option value="in-progress">In-Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </>
                      ) : (
                        <>
                          <option value="active">Active Only</option>
                          <option value="blocked">Blocked / Deactivated</option>
                        </>
                      )}
                    </select>
                  )}
                </div>
              </div>

              {/* Sub-tab: Customers */}
              {dbSubTab === "customers" && (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light text-muted small text-uppercase">
                      <tr>
                        <th>Customer</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((c) => {
                          const isBlocked = c.suspendedUntil && new Date(c.suspendedUntil) > new Date();
                          return (
                            <tr key={c._id}>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  {c.profilePhoto ? (
                                    <img src={c.profilePhoto} alt="" className="rounded-circle" style={{ width: 34, height: 34, objectFit: "cover" }} />
                                  ) : (
                                    <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold" style={{ width: 34, height: 34 }}>
                                      {c.fullName ? c.fullName.charAt(0).toUpperCase() : "C"}
                                    </div>
                                  )}
                                  <div>
                                    <div className="fw-semibold text-dark">{c.fullName || "Unnamed"}</div>
                                    <small className="text-muted" style={{ fontSize: "11px" }}>ID: {c._id}</small>
                                  </div>
                                </div>
                              </td>
                              <td>{c.email}</td>
                              <td>{c.phone || "—"}</td>
                              <td style={{ maxWidth: 200 }} className="text-truncate" title={typeof c.address === "object" ? JSON.stringify(c.address) : c.address}>
                                {typeof c.address === "object" ? JSON.stringify(c.address) : c.address || "—"}
                              </td>
                              <td>
                                {isBlocked ? (
                                  <span className="badge bg-danger rounded-pill px-2 py-1">
                                    Blocked until {new Date(c.suspendedUntil).toLocaleDateString()}
                                  </span>
                                ) : (
                                  <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-1">Active</span>
                                )}
                              </td>
                              <td className="text-end">
                                <div className="btn-group btn-group-sm">
                                  <button className="btn btn-outline-secondary" onClick={() => openCommentModal("customer", c)} title="Add note"><FaCommentAlt /></button>
                                  <button className="btn btn-outline-primary" onClick={() => openEditModal("customer", c)} title="Edit"><FaEdit /></button>
                                  <button
                                    className={`btn ${isBlocked ? "btn-outline-success" : "btn-outline-danger"}`}
                                    onClick={() => {
                                      if (isBlocked) {
                                        handleBlockUserAction("customer", c.email, null, "unblock");
                                      } else {
                                        const until = window.prompt("Block until (ISO Date or days, e.g. 2026-12-31):", "");
                                        if (until !== null) handleBlockUserAction("customer", c.email, until || null, "block");
                                      }
                                    }}
                                    title={isBlocked ? "Unblock customer" : "Block customer"}
                                  >
                                    <FaBan />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr><td colSpan="6" className="text-center py-4 text-muted">No customers found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sub-tab: Workers */}
              {dbSubTab === "workers" && (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light text-muted small text-uppercase">
                      <tr>
                        <th>Worker</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Categories</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWorkers.length > 0 ? (
                        filteredWorkers.map((w) => {
                          const isBlocked = w.suspendedUntil && new Date(w.suspendedUntil) > new Date();
                          return (
                            <tr key={w._id}>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  {w.profilePhoto ? (
                                    <img src={w.profilePhoto} alt="" className="rounded-circle" style={{ width: 34, height: 34, objectFit: "cover" }} />
                                  ) : (
                                    <div className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center fw-bold" style={{ width: 34, height: 34 }}>
                                      {w.fullName ? w.fullName.charAt(0).toUpperCase() : "W"}
                                    </div>
                                  )}
                                  <div>
                                    <div className="fw-semibold text-dark">{w.fullName || "Unnamed"}</div>
                                    <small className="text-muted" style={{ fontSize: "11px" }}>ID: {w._id}</small>
                                  </div>
                                </div>
                              </td>
                              <td>{w.email}</td>
                              <td>{w.phone || "—"}</td>
                              <td>
                                {w.workingCategory && w.workingCategory.length > 0 ? (
                                  <div className="d-flex flex-wrap gap-1">
                                    {w.workingCategory.map((cat, idx) => (
                                      <span key={idx} className="badge bg-light text-dark border">{cat}</span>
                                    ))}
                                  </div>
                                ) : "—"}
                              </td>
                              <td>
                                {isBlocked ? (
                                  <span className="badge bg-danger rounded-pill px-2 py-1">Blocked</span>
                                ) : (
                                  <span className={`badge ${w.isAvailable ? "bg-success" : "bg-secondary"} bg-opacity-10 text-dark rounded-pill px-2 py-1`}>
                                    {w.isAvailable ? "● Online" : "Offline"}
                                  </span>
                                )}
                              </td>
                              <td className="text-end">
                                <div className="btn-group btn-group-sm">
                                  <button className="btn btn-outline-secondary" onClick={() => openCommentModal("worker", w)} title="Add note"><FaCommentAlt /></button>
                                  <button className="btn btn-outline-primary" onClick={() => openEditModal("worker", w)} title="Edit"><FaEdit /></button>
                                  <button
                                    className={`btn ${isBlocked ? "btn-outline-success" : "btn-outline-danger"}`}
                                    onClick={() => {
                                      if (isBlocked) {
                                        handleBlockUserAction("worker", w.email, null, "unblock");
                                      } else {
                                        const until = window.prompt("Block until (ISO Date or days, e.g. 2026-12-31):", "");
                                        if (until !== null) handleBlockUserAction("worker", w.email, until || null, "block");
                                      }
                                    }}
                                    title={isBlocked ? "Unblock worker" : "Block worker"}
                                  >
                                    <FaBan />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr><td colSpan="6" className="text-center py-4 text-muted">No workers found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sub-tab: Service Requests */}
              {dbSubTab === "requests" && (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light text-muted small text-uppercase">
                      <tr>
                        <th>Order ID / Category</th>
                        <th>Customer</th>
                        <th>Assigned Worker</th>
                        <th>Quote</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.length > 0 ? (
                        filteredRequests.map((req) => (
                          <tr key={req._id}>
                            <td>
                              <div className="fw-bold text-dark text-capitalize">{req.category || "Service Request"}</div>
                              <small className="text-muted font-monospace" style={{ fontSize: "11px" }}>#{req._id.substring(req._id.length - 8)}</small>
                            </td>
                            <td>
                              {req.customerId ? (
                                <div>
                                  <div className="fw-semibold text-dark">{req.customerId.fullName}</div>
                                  <small className="text-muted">{req.customerId.email || req.customerId.phone}</small>
                                </div>
                              ) : "—"}
                            </td>
                            <td>
                              {req.workerId ? (
                                <div>
                                  <div className="fw-semibold text-dark">{req.workerId.fullName}</div>
                                  <small className="text-muted">{req.workerId.phone || req.workerId.email}</small>
                                </div>
                              ) : <span className="text-muted italic">Unassigned</span>}
                            </td>
                            <td><span className="fw-bold text-dark">{req.quoteAmount ? `₹${req.quoteAmount}` : "—"}</span></td>
                            <td>
                              <span
                                className={`badge rounded-pill px-2 py-1 ${
                                  req.orderStatus === "completed"
                                    ? "bg-success"
                                    : req.orderStatus === "in-progress"
                                    ? "bg-info text-dark"
                                    : req.orderStatus === "cancelled"
                                    ? "bg-danger"
                                    : "bg-warning text-dark"
                                }`}
                              >
                                {req.orderStatus || "pending"}
                              </span>
                            </td>
                            <td className="small text-muted">{new Date(req.createdAt).toLocaleDateString()}</td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-secondary" onClick={() => openCommentModal("serviceRequest", req)} title="Add note"><FaCommentAlt /></button>
                                <button className="btn btn-outline-primary" onClick={() => openEditModal("serviceRequest", req)} title="Edit Quote/Status"><FaEdit /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="7" className="text-center py-4 text-muted">No service requests found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sub-tab: Admins */}
              {dbSubTab === "admins" && (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light text-muted small text-uppercase">
                      <tr>
                        <th>Administrator</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Access Status</th>
                        <th>Registered Date</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdmins.length > 0 ? (
                        filteredAdmins.map((adm) => {
                          const isSelf = admin?._id === adm._id;
                          return (
                            <tr key={adm._id} className={!adm.isActive ? "table-danger bg-opacity-25" : ""}>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <div className="rounded-circle bg-warning bg-opacity-25 text-dark d-flex align-items-center justify-content-center fw-bold" style={{ width: 34, height: 34 }}>
                                    {adm.fullName ? adm.fullName.charAt(0).toUpperCase() : "A"}
                                  </div>
                                  <div>
                                    <div className="fw-semibold text-dark">
                                      {adm.fullName || "Admin"} {isSelf && <span className="badge bg-secondary ms-1">You</span>}
                                    </div>
                                    <small className="text-muted font-monospace" style={{ fontSize: "11px" }}>ID: {adm._id}</small>
                                  </div>
                                </div>
                              </td>
                              <td className="fw-semibold text-dark">{adm.email}</td>
                              <td>{getRoleBadge(adm.role)}</td>
                              <td>
                                {adm.isActive ? (
                                  <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-1">
                                    <FaCheck className="me-1" /> Active Access
                                  </span>
                                ) : (
                                  <span className="badge bg-danger rounded-pill px-2 py-1">
                                    <FaBan className="me-1" /> Access Revoked
                                  </span>
                                )}
                              </td>
                              <td className="small text-muted">{new Date(adm.createdAt).toLocaleDateString()}</td>
                              <td className="text-end">
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() => handleQuickMessageAdmin(adm.email)}
                                    title="Send Email to Admin"
                                  >
                                    <FaEnvelope />
                                  </button>
                                  <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => handleUpdateAdminRole(adm._id, adm.role, adm.email)}
                                    disabled={admin?.role !== "master"}
                                    title="Change Admin Role"
                                  >
                                    <FaUserShield /> Role
                                  </button>
                                  <button
                                    className={`btn ${adm.isActive ? "btn-outline-danger" : "btn-outline-success"}`}
                                    onClick={() => handleToggleAdminActive(adm._id, adm.isActive, adm.email)}
                                    disabled={admin?.role !== "master" || isSelf}
                                    title={adm.isActive ? "Revoke Admin Access" : "Restore Admin Access"}
                                  >
                                    {adm.isActive ? "Revoke" : "Restore"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr><td colSpan="6" className="text-center py-4 text-muted">No admin accounts found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sub-tab: Message Log */}
              {dbSubTab === "messages" && (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light text-muted small text-uppercase">
                      <tr>
                        <th>Recipient</th>
                        <th>Subject</th>
                        <th>Message Preview</th>
                        <th>Sent By</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messages.length > 0 ? (
                        messages.map((m) => (
                          <tr key={m._id}>
                            <td className="fw-semibold text-dark">{m.toEmail}</td>
                            <td>{m.subject}</td>
                            <td style={{ maxWidth: 300 }} className="text-truncate" title={m.body}>{m.body}</td>
                            <td><span className="badge bg-light text-dark border">{m.sentBy}</span></td>
                            <td className="small text-muted">{new Date(m.createdAt).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="5" className="text-center py-4 text-muted">No admin messages logged yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: API CONSOLE */}
          {activeTab === "api" && (
            <div className="row g-4">
              <div className="col-12 col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                      <FaTerminal className="text-primary" /> API Request Console
                    </h5>
                    {admin?.role !== "master" && <span className="badge bg-danger">Master Only</span>}
                  </div>

                  <form onSubmit={handleApiSubmit}>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-semibold text-muted mb-0">
                          API Quick Presets ({apiSuggestions.length} Ready Routes)
                        </label>
                        {selectedPresetIndex !== "" && (
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-decoration-none text-muted"
                            style={{ fontSize: "0.76rem" }}
                            onClick={() => {
                              setSelectedPresetIndex("");
                              setApiForm({ url: "", method: "GET", data: "" });
                            }}
                          >
                            Reset Form
                          </button>
                        )}
                      </div>
                      <select
                        className="form-select form-select-sm"
                        value={selectedPresetIndex}
                        onChange={(e) => {
                          const idx = e.target.value;
                          setSelectedPresetIndex(idx);
                          if (idx === "") return;
                          const sel = apiSuggestions[Number(idx)];
                          setApiForm((prev) => ({
                            ...prev,
                            url: sel.url,
                            method: sel.method,
                            data: sel.sample || (sel.method !== "GET" ? "{\n  \n}" : ""),
                          }));
                        }}
                      >
                        <option value="">-- Choose an endpoint preset --</option>
                        {["Admin Action Dispatcher", "Admin Management", "Customer APIs", "Worker APIs", "Service Request APIs", "Payment APIs", "Diagnostics"].map((grp) => (
                          <optgroup key={grp} label={`--- ${grp} ---`}>
                            {apiSuggestions
                              .map((s, index) => ({ ...s, originalIndex: index }))
                              .filter((s) => s.group === grp)
                              .map((s) => (
                                <option value={s.originalIndex} key={s.label}>
                                  [{s.method}] {s.label} ({s.url})
                                </option>
                              ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-muted">Endpoint URL</label>
                      <div className="input-group">
                        <select
                          className="form-select bg-light fw-bold"
                          style={{ maxWidth: "115px" }}
                          value={apiForm.method}
                          onChange={(e) => {
                            const newMethod = e.target.value;
                            setApiForm((prev) => ({
                              ...prev,
                              method: newMethod,
                              data: newMethod !== "GET" && !prev.data ? "{\n  \n}" : prev.data,
                            }));
                          }}
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PATCH">PATCH</option>
                          <option value="PUT">PUT</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                        <input
                          type="text"
                          className="form-control font-monospace"
                          placeholder="/api/v1/admin/summary"
                          value={apiForm.url}
                          onChange={(e) => setApiForm((prev) => ({ ...prev, url: e.target.value }))}
                        />
                      </div>
                    </div>

                    {apiForm.method !== "GET" && (
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div className="d-flex align-items-center gap-2">
                            <label className="form-label small fw-semibold text-muted mb-0">JSON Request Body</label>
                            {(() => {
                              const status = getJsonValidationStatus(apiForm.data);
                              if (status.empty) {
                                return (
                                  <span className="badge bg-secondary-subtle text-secondary py-1 px-2 border" style={{ fontSize: "0.72rem" }}>
                                    Optional / Empty
                                  </span>
                                );
                              }
                              if (status.valid) {
                                return (
                                  <span className="badge bg-success-subtle text-success py-1 px-2 border border-success" style={{ fontSize: "0.72rem" }}>
                                    <FaCheck className="me-1" /> Valid JSON
                                  </span>
                                );
                              }
                              return (
                                <span className="badge bg-danger-subtle text-danger py-1 px-2 border border-danger" style={{ fontSize: "0.72rem" }} title={status.message}>
                                  <FaExclamationTriangle className="me-1" /> Invalid Syntax
                                </span>
                              );
                            })()}
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary py-0 px-2"
                              style={{ fontSize: "0.78rem" }}
                              onClick={() => {
                                try {
                                  if (!apiForm.data || !apiForm.data.trim()) {
                                    setApiForm((prev) => ({ ...prev, data: "{\n  \n}" }));
                                    return;
                                  }
                                  const parsed = JSON.parse(apiForm.data);
                                  setApiForm((prev) => ({ ...prev, data: JSON.stringify(parsed, null, 2) }));
                                  showToast("JSON formatted cleanly", "info");
                                } catch (err) {
                                  showToast("Cannot format: " + err.message, "danger");
                                }
                              }}
                              title="Format and prettify JSON indentation"
                            >
                              Format JSON
                            </button>
                            {selectedPresetIndex !== "" && apiSuggestions[Number(selectedPresetIndex)]?.sample && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary py-0 px-2"
                                style={{ fontSize: "0.78rem" }}
                                onClick={() => {
                                  setApiForm((prev) => ({
                                    ...prev,
                                    data: apiSuggestions[Number(selectedPresetIndex)].sample,
                                  }));
                                  showToast("Reset to preset sample body", "info");
                                }}
                                title="Reset to preset sample payload"
                              >
                                Reset Sample
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary py-0 px-2"
                              style={{ fontSize: "0.78rem" }}
                              onClick={() => setApiForm((prev) => ({ ...prev, data: "{}" }))}
                              title="Clear body to empty object"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                        <textarea
                          rows={8}
                          className="form-control font-monospace small bg-light"
                          placeholder='{\n  "key": "value"\n}'
                          value={apiForm.data}
                          onChange={(e) => setApiForm((prev) => ({ ...prev, data: e.target.value }))}
                        />
                      </div>
                    )}


                    <button
                      type="submit"
                      className="btn btn-primary d-flex align-items-center gap-2"
                      disabled={apiLoading || admin?.role !== "master"}
                    >
                      <FaPaperPlane />
                      <span>{apiLoading ? "Executing..." : "Execute API Request"}</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* API Response Viewer */}
              <div className="col-12 col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                      <FaCode className="text-secondary" /> Response Viewer
                    </h5>
                    {apiResponse && (
                      <div className="d-flex gap-2 align-items-center">
                        <span className={`badge ${apiResponse.status >= 200 && apiResponse.status < 300 ? "bg-success" : "bg-danger"}`}>
                          {apiResponse.status} {apiResponse.statusText}
                        </span>
                        <span className="badge bg-secondary">{apiResponse.durationMs}ms</span>
                        <button
                          className="btn btn-sm btn-outline-secondary p-1"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(apiResponse.data, null, 2));
                            showToast("Copied response to clipboard!", "info");
                          }}
                          title="Copy JSON"
                        >
                          <FaCopy />
                        </button>
                      </div>
                    )}
                  </div>

                  {apiResponse ? (
                    <pre
                      className="p-3 rounded-3 bg-dark text-light font-monospace small overflow-auto mb-0"
                      style={{ maxHeight: "480px" }}
                    >
                      {JSON.stringify(apiResponse.data, null, 2)}
                    </pre>
                  ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center h-75 text-muted py-5">
                      <FaTerminal className="display-4 mb-2 text-secondary opacity-50" />
                      <p className="mb-0">Execute an API request on the left to view the response payload here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MESSAGE ANYONE */}
          {activeTab === "message" && (
            <div className="row g-4">
              <div className="col-12 col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                  <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <FaEnvelope className="text-primary" /> Send Email Message
                  </h5>
                  {admin?.role === "viewer" && (
                    <div className="alert alert-warning small mb-3">Suggester or Master access is required to send emails.</div>
                  )}
                  <form onSubmit={handleMessageSubmit}>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-muted">Recipient Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="user@example.com"
                        value={messageForm.toEmail}
                        onChange={(e) => setMessageForm((prev) => ({ ...prev, toEmail: e.target.value }))}
                        disabled={admin?.role === "viewer"}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-muted">Subject</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Important update from Karigar"
                        value={messageForm.subject}
                        onChange={(e) => setMessageForm((prev) => ({ ...prev, subject: e.target.value }))}
                        disabled={admin?.role === "viewer"}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-muted">Message Body</label>
                      <textarea
                        rows={6}
                        className="form-control"
                        placeholder="Type your message here..."
                        value={messageForm.body}
                        onChange={(e) => setMessageForm((prev) => ({ ...prev, body: e.target.value }))}
                        disabled={admin?.role === "viewer"}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary d-flex align-items-center gap-2"
                      disabled={messageLoading || admin?.role === "viewer"}
                    >
                      <FaPaperPlane />
                      <span>{messageLoading ? "Sending..." : "Send Email"}</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Message History */}
              <div className="col-12 col-lg-6">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                  <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <FaClock className="text-secondary" /> Recent Sent Messages
                  </h5>
                  <div className="overflow-auto" style={{ maxHeight: "450px" }}>
                    {messages.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {messages.slice(0, 10).map((m) => (
                          <div key={m._id} className="list-group-item px-0 py-3">
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <span className="fw-bold text-dark">{m.toEmail}</span>
                              <small className="text-muted">{new Date(m.createdAt).toLocaleDateString()}</small>
                            </div>
                            <div className="small fw-semibold text-primary mb-1">{m.subject}</div>
                            <p className="text-muted small mb-0 text-truncate">{m.body}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted mb-0 py-4 text-center">No messages sent yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: USER ACCESS & SUSPENSIONS */}
          {activeTab === "block" && (
            <div className="row g-4">
              <div className="col-12 col-lg-5">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                  <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <FaBan className="text-danger" /> Suspend / Unblock User
                  </h5>
                  {admin?.role !== "master" && (
                    <div className="alert alert-warning small mb-3">Master admin access is required to suspend or unblock users.</div>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleBlockUserAction(blockForm.entityType, blockForm.email, blockForm.until || null, blockForm.action);
                    }}
                  >
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-muted">User Type</label>
                      <select
                        className="form-select"
                        value={blockForm.entityType}
                        onChange={(e) => setBlockForm((prev) => ({ ...prev, entityType: e.target.value }))}
                      >
                        <option value="customer">Customer</option>
                        <option value="worker">Worker</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-muted">User Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="user@example.com"
                        value={blockForm.email}
                        onChange={(e) => setBlockForm((prev) => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-muted">Action</label>
                      <div className="d-flex gap-3">
                        <label className="form-check-label">
                          <input
                            type="radio"
                            name="blockAction"
                            className="form-check-input me-1"
                            checked={blockForm.action === "block"}
                            onChange={() => setBlockForm((prev) => ({ ...prev, action: "block" }))}
                          />
                          Suspend / Block
                        </label>
                        <label className="form-check-label text-success fw-semibold">
                          <input
                            type="radio"
                            name="blockAction"
                            className="form-check-input me-1"
                            checked={blockForm.action === "unblock"}
                            onChange={() => setBlockForm((prev) => ({ ...prev, action: "unblock" }))}
                          />
                          Unblock User
                        </label>
                      </div>
                    </div>

                    {blockForm.action === "block" && (
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-muted">Suspend Until (Optional)</label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={blockForm.until}
                          onChange={(e) => setBlockForm((prev) => ({ ...prev, until: e.target.value }))}
                        />
                        <small className="text-muted">Defaults to 7 days if left blank.</small>
                      </div>
                    )}

                    <button
                      type="submit"
                      className={`btn w-100 ${blockForm.action === "unblock" ? "btn-success" : "btn-danger"}`}
                      disabled={admin?.role !== "master"}
                    >
                      {blockForm.action === "unblock" ? "Unblock Account" : "Apply Suspension"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Blocked Accounts Table */}
              <div className="col-12 col-lg-7">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                  <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <FaBan className="text-danger" /> Currently Suspended Accounts ({allBlockedUsers.length})
                  </h5>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light text-muted small text-uppercase">
                        <tr>
                          <th>User</th>
                          <th>Role</th>
                          <th>Suspended Until</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allBlockedUsers.length > 0 ? (
                          allBlockedUsers.map((u) => (
                            <tr key={u._id}>
                              <td>
                                <div className="fw-semibold text-dark">{u.fullName || "Unnamed"}</div>
                                <small className="text-muted">{u.email}</small>
                              </td>
                              <td>
                                <span className={`badge ${u.entityType === "customer" ? "bg-primary" : "bg-success"} rounded-pill text-uppercase`}>
                                  {u.entityType}
                                </span>
                              </td>
                              <td className="text-danger fw-semibold">{new Date(u.suspendedUntil).toLocaleString()}</td>
                              <td className="text-end">
                                <button
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() => handleBlockUserAction(u.entityType, u.email, null, "unblock")}
                                  disabled={admin?.role !== "master"}
                                >
                                  Unblock
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="4" className="text-center py-4 text-muted">No accounts currently suspended.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ADMIN REQUESTS */}
          {activeTab === "requests" && (
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <FaKey className="text-warning" /> Pending Admin Elevation Requests
                </h5>
                <span className="badge bg-primary rounded-pill px-3 py-2">{requests.length} Pending</span>
              </div>

              {admin?.role !== "master" && (
                <div className="alert alert-warning small mb-3">Only Master Admins have permission to approve or reject elevation requests.</div>
              )}

              {requests.length > 0 ? (
                <div className="list-group list-group-flush">
                  {requests.map((r) => (
                    <div key={r._id} className="list-group-item px-0 py-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <h6 className="fw-bold text-dark mb-0">{r.email}</h6>
                          <span className="badge bg-info text-dark text-uppercase">Requested: {r.requestedRole}</span>
                        </div>
                        <p className="text-muted small mb-1"><strong>Reason:</strong> {r.reason || "No reason specified."}</p>
                        <small className="text-muted">Requested by: {r.requestedBy || "Self"} • {new Date(r.createdAt).toLocaleString()}</small>
                      </div>

                      <div className="d-flex flex-wrap gap-2">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleApproveRequest(r._id, "viewer")} disabled={admin?.role !== "master"}>
                          Approve Viewer
                        </button>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleApproveRequest(r._id, "suggester")} disabled={admin?.role !== "master"}>
                          Approve Suggester
                        </button>
                        <button className="btn btn-sm btn-warning text-dark fw-bold" onClick={() => handleApproveRequest(r._id, "master")} disabled={admin?.role !== "master"}>
                          Approve Master
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleRejectRequest(r._id)} disabled={admin?.role !== "master"}>
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <FaCheck className="display-4 text-success opacity-50 mb-2" />
                  <p className="mb-0">All admin elevation requests have been processed.</p>
                </div>
              )}
            </div>
          )}

          {/* Quick Action Modal: Comment */}
          {modalType === "comment" && activeEntity && (
            <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4">
                  <div className="modal-header border-bottom">
                    <h6 className="modal-title fw-bold">Add Internal Note on {activeEntity.entityType}</h6>
                    <button type="button" className="btn-close" onClick={closeModal}></button>
                  </div>
                  <form onSubmit={handleModalCommentSubmit}>
                    <div className="modal-body">
                      <p className="small text-muted mb-2">Target: <strong>{activeEntity.fullName || activeEntity._id}</strong></p>
                      <textarea
                        rows={4}
                        className="form-control"
                        placeholder="Write your note or internal feedback here..."
                        value={modalComment}
                        onChange={(e) => setModalComment(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="modal-footer border-top">
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={closeModal}>Cancel</button>
                      <button type="submit" className="btn btn-sm btn-primary">Save Comment</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Quick Action Modal: Edit */}
          {modalType === "edit" && activeEntity && (
            <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4">
                  <div className="modal-header border-bottom">
                    <h6 className="modal-title fw-bold">Edit {activeEntity.entityType} Details</h6>
                    <button type="button" className="btn-close" onClick={closeModal}></button>
                  </div>
                  <form onSubmit={handleModalEditSubmit}>
                    <div className="modal-body">
                      <p className="small text-muted mb-3">Target: <strong>{activeEntity.fullName || activeEntity._id}</strong></p>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-muted">Field to Update</label>
                        <select
                          className="form-select"
                          value={modalEditField}
                          onChange={(e) => setModalEditField(e.target.value)}
                        >
                          {activeEntity.entityType === "serviceRequest" ? (
                            <>
                              <option value="quoteAmount">quoteAmount</option>
                              <option value="orderStatus">orderStatus</option>
                              <option value="category">category</option>
                              <option value="description">description</option>
                            </>
                          ) : (
                            <>
                              <option value="fullName">fullName</option>
                              <option value="email">email</option>
                              <option value="phone">phone</option>
                              <option value="address">address</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-semibold text-muted">New Value</label>
                        <input
                          type="text"
                          className="form-control"
                          value={modalEditValue}
                          onChange={(e) => setModalEditValue(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="modal-footer border-top">
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={closeModal}>Cancel</button>
                      <button type="submit" className="btn btn-sm btn-primary">Save Changes</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute_admin>
  );
};

export default AdminDashboard;
