import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import { Admin } from "../models/admin.model.js";
import { Customer } from "../models/customer.model.js";
import { Worker } from "../models/worker.model.js";
import { ServiceRequest } from "../models/serviceRequest.model.js";
import { AdminRequest } from "../models/adminRequest.model.js";
import { AdminComment } from "../models/adminComment.model.js";
import { AdminMessage } from "../models/adminMessage.model.js";
import { Otp } from "../models/otp.model.js";
import { Transaction } from "../models/transaction.model.js";
import { Cancellation } from "../models/cancellation.model.js";
import { Feedback } from "../models/feedback.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { sendNotification } from "./notification.controller.js";

import {
  generateOtpobj,
  getCustomerById,
  updateEmail as updateCustomerEmail,
  updatePhone as updateCustomerPhone,
  updateAddress as updateCustomerAddress,
  updateFullName as updateCustomerFullName,
} from "./customer.controller.js";
import {
  verifyOtpForService,
  getWorkerById,
  rateWorker as rateWorkerAction,
  updateWorkerLocation,
  updateCategory as updateWorkerCategory,
} from "./worker.controller.js";
import {
  createServiceRequest,
  acceptRequest,
  setQuoteAmount,
  acceptRepairQuote,
  rejectRepairQuote,
  getServiceRequestDetails,
  getCustomerHistory,
  getWorkerHistory,
  updateJobStatus,
  markPaymentDone,
  cancelledByWorkerAsCustomerNotResponding,
  cancelledByWorkerAsNotAbleToServe,
  cancelledByCustomerAsWorkerNotRespondingOrLate,
  cancelledByCustomerAsByMistake,
  reportWorker,
} from "./serviceRequest.controller.js";
import {
  paymentReceivedByCash,
} from "./payment.controller.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getAuthorizedAdminEmails = () => {
  const raw = process.env.ADMIN_AUTHORIZED_EMAILS || "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

const createAccessAndRefreshTokens = async (admin) => {
  const accessToken = admin.generateAccessToken();
  const refreshToken = admin.generateRefreshToken();
  admin.refreshToken = refreshToken;
  await admin.save();
  return { accessToken, refreshToken };
};

const getAdminEmailTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: (process.env.EMAIL_PASS || "").replace(/\s+/g, ""),
    },
  });
};

const generateOtpCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendSmsIfConfigured = async (toPhone, body) => {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const twilioModule = await import("twilio");
      const twilio = twilioModule.default;
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const formatted = toPhone.startsWith("+") ? toPhone : "+91" + toPhone;
      await client.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formatted,
      });
      return true;
    } catch (e) {
      console.warn("Twilio SMS dispatch failed:", e.message);
      return false;
    }
  }
  return false;
};

const loginAdminWithGoogle = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) throw new ApiError(400, "Google credential is required");

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) throw new ApiError(400, "Google profile email not found");

  const email = payload.email.toLowerCase();
  const authorizedEmails = getAuthorizedAdminEmails();

  console.log("ADMIN LOGIN email:", email);
  console.log("ADMIN AUTH LIST:", authorizedEmails);

  let admin = await Admin.findOne({ email });
  if (admin) {
    if (!admin.isActive) {
      throw new ApiError(403, "Admin account is inactive");
    }
  } else {
    if (!authorizedEmails.includes(email)) {
      throw new ApiError(401, "Your Google email is not authorized for admin access");
    }

    admin = await Admin.create({
      email,
      fullName: payload.name || "Admin",
      role: "master",
    });
  }

  const { accessToken, refreshToken } = await createAccessAndRefreshTokens(admin);

  const safeAdmin = {
    _id: admin._id,
    email: admin.email,
    fullName: admin.fullName,
    role: admin.role,
  };

  return res
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    })
    .status(200)
    .json({
      success: true,
      statusCode: 200,
      data: { admin: safeAdmin, accessToken, refreshToken },
      message: "Admin logged in with Google successfully",
    });
});

const loginAdminWithEmail = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const normalizedEmail = email.toLowerCase();
  let admin = await Admin.findOne({ email: normalizedEmail });
  const authorizedEmails = getAuthorizedAdminEmails();

  if (!admin) {
    if (!authorizedEmails.includes(normalizedEmail)) {
      throw new ApiError(401, "Your email is not authorized for admin access");
    }

    const isFirstAdmin = (await Admin.countDocuments({})) === 0;
    admin = await Admin.create({
      email: normalizedEmail,
      password,
      fullName: normalizedEmail.split("@")[0] || "Admin",
      role: isFirstAdmin ? "master" : "viewer",
    });
  }

  if (!admin.isActive) {
    throw new ApiError(403, "Admin account is inactive");
  }

  if (!admin.password) {
    admin.password = password;
    await admin.save();
  }

  const isPasswordCorrect = await admin.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Incorrect password");
  }

  const { accessToken, refreshToken } = await createAccessAndRefreshTokens(admin);

  const safeAdmin = {
    _id: admin._id,
    email: admin.email,
    fullName: admin.fullName,
    role: admin.role,
  };

  return res
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    })
    .status(200)
    .json({
      success: true,
      statusCode: 200,
      data: { admin: safeAdmin, accessToken, refreshToken },
      message: "Admin logged in with email and password successfully",
    });
});

const getAdminSummary = asyncHandler(async (req, res) => {
  const [
    customerCount,
    workerCount,
    requestCount,
    pendingAdminRequests,
    blockedWorkers,
    blockedCustomers,
    completedRequests,
    pendingRequests,
    inProgressRequests,
    activeWorkers,
    revenueAgg,
  ] = await Promise.all([
    Customer.countDocuments(),
    Worker.countDocuments(),
    ServiceRequest.countDocuments(),
    AdminRequest.countDocuments({ status: "pending" }),
    Worker.countDocuments({ suspendedUntil: { $gt: new Date() } }),
    Customer.countDocuments({ suspendedUntil: { $gt: new Date() } }),
    ServiceRequest.countDocuments({ orderStatus: "completed" }),
    ServiceRequest.countDocuments({ orderStatus: "pending" }),
    ServiceRequest.countDocuments({ orderStatus: "in-progress" }),
    Worker.countDocuments({ isAvailable: true }),
    ServiceRequest.aggregate([
      { $match: { orderStatus: "completed", quoteAmount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$quoteAmount" } } },
    ]),
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;

  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      customerCount,
      workerCount,
      requestCount,
      pendingAdminRequests,
      blockedWorkers,
      blockedCustomers,
      completedRequests,
      pendingRequests,
      inProgressRequests,
      activeWorkers,
      totalRevenue,
    },
    message: "Admin summary fetched successfully",
  });
});

const getAdminUsers = asyncHandler(async (req, res) => {
  const [customers, workers, serviceRequests, admins] = await Promise.all([
    Customer.find({}, "fullName email phone address suspendedUntil profilePhoto createdAt").sort({ createdAt: -1 }),
    Worker.find({}, "fullName email phone address workingCategory suspendedUntil profilePhoto rating isAvailable experience createdAt").sort({ createdAt: -1 }),
    ServiceRequest.find({}, "customerId workerId category description orderStatus jobStatus quoteAmount address createdAt")
      .populate("customerId", "fullName email phone profilePhoto")
      .populate("workerId", "fullName email phone profilePhoto")
      .sort({ createdAt: -1 }),
    Admin.find({}, "fullName email role isActive createdAt updatedAt profilePhoto").sort({ createdAt: -1 }),
  ]);

  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: { customers, workers, serviceRequests, admins },
    message: "Admin users and data fetched successfully",
  });
});

const blockUser = asyncHandler(async (req, res) => {
  const { entityType, entityId, email, until, action } = req.body;
  if (!entityType || (!entityId && !email)) {
    throw new ApiError(400, "entityType and entityId or email are required");
  }

  let model;
  if (entityType === "worker") model = Worker;
  else if (entityType === "customer") model = Customer;
  else throw new ApiError(400, "entityType must be worker or customer");

  const isUnblock = action === "unblock" || until === "unblock" || until === null || until === "";
  const blockUntil = isUnblock ? null : new Date(until || Date.now() + 7 * 24 * 60 * 60 * 1000);

  const filter = entityId ? { _id: entityId } : { email: email.toLowerCase() };
  const updated = await model.findOneAndUpdate(filter, { suspendedUntil: blockUntil }, { new: true });
  if (!updated) throw new ApiError(404, `${entityType} not found`);

  const actionMsg = isUnblock ? "unblocked successfully" : `blocked successfully until ${blockUntil.toISOString()}`;
  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: updated,
    message: `${entityType} ${actionMsg}`,
  });
});

const sendMessage = asyncHandler(async (req, res) => {
  const { toEmail, subject, body } = req.body;
  if (!toEmail || !subject || !body) {
    throw new ApiError(400, "toEmail, subject and body are required");
  }

  const sentBy = req.admin?.email || "system";
  let emailSent = false;
  let emailError = null;

  if (process.env.EMAIL && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASS.replace(/\s+/g, ""),
        },
      });

      await transporter.sendMail({
        from: `"Karigar Support" <${process.env.EMAIL}>`,
        to: toEmail,
        subject,
        text: body,
      });
      emailSent = true;
    } catch (err) {
      console.error("Nodemailer delivery error:", err.message);
      emailError = err.message;
    }
  } else {
    emailError = "EMAIL or EMAIL_PASS not configured in .env";
  }

  // Always record message in DB for history
  let savedMessage = null;
  try {
    savedMessage = await AdminMessage.create({
      toEmail: toEmail.toLowerCase(),
      subject,
      body,
      sentBy,
    });
  } catch (dbErr) {
    console.error("Failed to save admin message to DB:", dbErr.message);
  }

  if (!emailSent) {
    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: savedMessage,
      emailSent: false,
      message: `Message saved in history log, but email dispatch failed: ${emailError}. (Note: Gmail requires a 16-letter App Password, not your standard Gmail password).`,
    });
  }

  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: savedMessage,
    emailSent: true,
    message: "Message dispatched and logged successfully",
  });
});

const getAdminRequests = asyncHandler(async (req, res) => {
  const requests = await AdminRequest.find({ status: "pending" }).sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: requests,
    message: "Admin requests fetched successfully",
  });
});

const getAdminMessages = asyncHandler(async (req, res) => {
  const messages = await AdminMessage.find({}).sort({ createdAt: -1 }).limit(200);
  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: messages,
    message: "Admin messages fetched successfully",
  });
});

const approveAdminRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { approvedRole } = req.body;
  if (!requestId || !approvedRole) {
    throw new ApiError(400, "requestId and approvedRole are required");
  }

  const request = await AdminRequest.findById(requestId);
  if (!request) throw new ApiError(404, "Admin request not found");
  if (request.status !== "pending") throw new ApiError(400, "Request is already processed");

  // 1. Generate a secure random password (e.g. Kg@7a3f1b9c)
  const tempPassword = `Kg@${crypto.randomBytes(4).toString("hex")}`;

  // 2. Mark request as approved
  request.status = "approved";
  await request.save();

  // 3. Upsert admin account with the generated password
  let admin = await Admin.findOne({ email: request.email });
  if (!admin) {
    admin = new Admin({
      email: request.email,
      fullName: request.requestedBy || "Admin",
      role: approvedRole,
      isActive: true,
    });
  } else {
    admin.role = approvedRole;
    admin.isActive = true;
    if (request.requestedBy) admin.fullName = request.requestedBy;
  }

  // Assign the plain text password — the pre-save hook will bcrypt-hash it automatically
  admin.password = tempPassword;
  await admin.save();

  // 4. Send email with the generated password to the user
  let emailSent = false;
  let emailError = null;

  if (process.env.EMAIL && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASS.replace(/\s+/g, ""),
        },
      });

      await transporter.sendMail({
        from: `"Karigar Admin Console" <${process.env.EMAIL}>`,
        to: request.email,
        subject: "🎉 Your Karigar Admin Access Has Been Approved!",
        text: `Hello ${admin.fullName || "Admin"},

Your request for administrative access on the Karigar platform has been APPROVED by the Master Administrator!

Access Credentials:
--------------------------------------------------
Login URL: https://karigar-mu.vercel.app/signin_admin
Assigned Role: ${approvedRole.toUpperCase()}
Admin Email: ${request.email}
Login Password: ${tempPassword}
--------------------------------------------------

Security Instructions:
1. Please use the email and password above to sign in at the Karigar Admin Portal.
2. Only this generated password will grant you access.
3. Keep this password safe and confidential.

Best regards,
Karigar Management Team`,
      });
      emailSent = true;
    } catch (err) {
      console.error("Failed to send approval email:", err.message);
      emailError = err.message;
    }
  }

  // 5. Log approval in AdminMessage for audit trail
  try {
    await AdminMessage.create({
      toEmail: request.email.toLowerCase(),
      subject: `Admin Access Approved (${approvedRole})`,
      body: `Approved as ${approvedRole}. Credentials dispatched to ${request.email}. Password: ${tempPassword}`,
      sentBy: req.admin?.email || "system",
    });
  } catch (logErr) {
    console.error("Failed to log approval message:", logErr.message);
  }

  // Notify Master Admins and the updated admin
  await sendNotification({
    recipientRole: "admin",
    recipientId: admin._id,
    title: "Elevation Request Approved",
    message: `Admin access for ${request.email} was approved as ${approvedRole.toUpperCase()} by ${req.admin?.fullName || "Master Admin"}.`,
    type: "request",
    link: "database",
  });

  const responseMessage = emailSent
    ? `Admin request approved as ${approvedRole}, and login password was emailed to ${request.email}.`
    : `Admin request approved as ${approvedRole}, but email sending failed (${emailError}). Generated Password: ${tempPassword}`;

  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: {
      _id: admin._id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      isActive: admin.isActive,
    },
    tempPassword,
    emailSent,
    message: responseMessage,
  });
});

const createAdminRequest = asyncHandler(async (req, res) => {
  const { email, requestedRole, reason, requestedBy } = req.body;
  if (!email || !requestedRole) {
    throw new ApiError(400, "Email and requestedRole are required");
  }

  const normalizedEmail = email.toLowerCase();
  const existingAdmin = await Admin.findOne({ email: normalizedEmail });
  if (existingAdmin && existingAdmin.isActive) {
    throw new ApiError(400, "This email is already an active admin");
  }

  const existingRequest = await AdminRequest.findOne({ email: normalizedEmail, status: "pending" });
  if (existingRequest) {
    throw new ApiError(400, "There is already a pending admin access request for this email");
  }

  const request = await AdminRequest.create({
    email: normalizedEmail,
    requestedRole,
    reason: reason || "",
    requestedBy: requestedBy || "",
  });

  // Notify Master Admins about new elevation request
  await sendNotification({
    recipientRole: "admin",
    title: "New Elevation Request",
    message: `${normalizedEmail} requested elevation to ${requestedRole.toUpperCase()} role.`,
    type: "request",
    link: "requests",
  });

  return res.status(201).json({
    success: true,
    statusCode: 201,
    data: request,
    message: "Admin access request created successfully",
  });
});

const rejectAdminRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  if (!requestId) {
    throw new ApiError(400, "requestId is required");
  }

  const request = await AdminRequest.findById(requestId);
  if (!request) throw new ApiError(404, "Admin request not found");
  if (request.status !== "pending") throw new ApiError(400, "Request is already processed");

  request.status = "rejected";
  await request.save();

  // Notify admins
  await sendNotification({
    recipientRole: "admin",
    title: "Elevation Request Rejected",
    message: `Admin access request for ${request.email} was rejected by ${req.admin?.fullName || "Master Admin"}.`,
    type: "request",
    link: "requests",
  });

  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: request,
    message: "Admin request rejected successfully",
  });
});

const runAdminApiCall = asyncHandler(async (req, res) => {
  const { url, method = "GET", data, headers = {} } = req.body;
  if (!url) throw new ApiError(400, "API URL is required");

  const startTime = Date.now();
  try {
    const response = await axios({
      url,
      method: method.toUpperCase(),
      data: method.toUpperCase() === "GET" ? undefined : data,
      headers: {
        Authorization: `Bearer ${req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")}`,
        ...headers,
      },
      timeout: 15000,
    });
    const durationMs = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: {
        status: response.status,
        statusText: response.statusText,
        durationMs,
        headers: response.headers,
        body: response.data,
      },
      message: `API call succeeded (${response.status} in ${durationMs}ms)`,
    });
  } catch (apiErr) {
    const durationMs = Date.now() - startTime;
    return res.status(apiErr.response?.status || 500).json({
      success: false,
      statusCode: apiErr.response?.status || 500,
      data: {
        status: apiErr.response?.status || 500,
        statusText: apiErr.response?.statusText || "Error",
        durationMs,
        headers: apiErr.response?.headers || {},
        body: apiErr.response?.data || apiErr.message,
      },
      message: `API call failed: ${apiErr.message}`,
    });
  }
});

const commentOnEntity = asyncHandler(async (req, res) => {
  const { entityType, entityId, comment } = req.body;
  if (!entityType || !entityId || !comment) {
    throw new ApiError(400, "entityType, entityId, and comment are required");
  }

  const validTypes = ["customer", "worker", "serviceRequest"];
  if (!validTypes.includes(entityType)) {
    throw new ApiError(400, "Invalid entityType");
  }

  const adminComment = await AdminComment.create({
    adminId: req.admin._id,
    entityType,
    entityId,
    comment,
  });

  // Notify admins and entity owner about the new comment
  const adminName = req.admin.fullName || req.admin.email || "Admin";
  await sendNotification({
    recipientRole: "admin",
    title: `New Note on ${entityType}`,
    message: `${adminName} added note on ${entityType}: "${comment.length > 70 ? comment.substring(0, 67) + "..." : comment}"`,
    type: "comment",
    link: "database",
  });

  if (entityType === "customer") {
    await sendNotification({
      recipientRole: "customer",
      recipientId: entityId,
      title: "Note from Admin Support",
      message: `Administrator left a note regarding your account: "${comment.length > 70 ? comment.substring(0, 67) + "..." : comment}"`,
      type: "comment",
    });
  } else if (entityType === "worker") {
    await sendNotification({
      recipientRole: "worker",
      recipientId: entityId,
      title: "Note from Admin Support",
      message: `Administrator left a note regarding your account: "${comment.length > 70 ? comment.substring(0, 67) + "..." : comment}"`,
      type: "comment",
    });
  } else if (entityType === "serviceRequest") {
    const sReq = await ServiceRequest.findById(entityId);
    if (sReq?.customerId) {
      await sendNotification({
        recipientRole: "customer",
        recipientId: sReq.customerId,
        title: "Admin Note on Service Request",
        message: `Administrator left a note on request #${entityId.toString().slice(-6)}: "${comment.length > 70 ? comment.substring(0, 67) + "..." : comment}"`,
        type: "comment",
      });
    }
    if (sReq?.workerId) {
      await sendNotification({
        recipientRole: "worker",
        recipientId: sReq.workerId,
        title: "Admin Note on Service Request",
        message: `Administrator left a note on request #${entityId.toString().slice(-6)}: "${comment.length > 70 ? comment.substring(0, 67) + "..." : comment}"`,
        type: "comment",
      });
    }
  }

  return res.status(201).json({
    success: true,
    statusCode: 201,
    data: adminComment,
    message: "Comment saved successfully",
  });
});

const getEntityComments = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  if (!entityType || !entityId) {
    throw new ApiError(400, "entityType and entityId are required");
  }

  const comments = await AdminComment.find({ entityType, entityId })
    .populate("adminId", "fullName email role profilePhoto")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: comments,
    message: "Comments retrieved successfully",
  });
});

const editEntity = asyncHandler(async (req, res) => {
  const { entityType, entityId, updates } = req.body;
  if (!entityType || !entityId || !updates || typeof updates !== "object") {
    throw new ApiError(400, "entityType, entityId, and updates object are required");
  }

  let model;
  let allowedFields;
  if (entityType === "customer") {
    model = Customer;
    allowedFields = ["fullName", "email", "phone", "address", "profilePhoto"];
  } else if (entityType === "worker") {
    model = Worker;
    allowedFields = ["fullName", "email", "phone", "address", "profilePhoto", "workingCategory"];
  } else if (entityType === "serviceRequest") {
    model = ServiceRequest;
    allowedFields = ["category", "description", "quoteAmount", "orderStatus", "jobStatus"];
  } else {
    throw new ApiError(400, "Invalid entityType");
  }

  const patch = {};
  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key)) patch[key] = updates[key];
  });

  if (Object.keys(patch).length === 0) {
    throw new ApiError(400, "No valid fields found to update");
  }

  const updated = await model.findByIdAndUpdate(entityId, patch, { new: true });
  if (!updated) throw new ApiError(404, `${entityType} not found`);

  // Send necessary notification to the edited entity owner
  if (entityType === "customer") {
    await sendNotification({
      recipientRole: "customer",
      recipientId: updated._id,
      title: "Profile Edited by Administrator",
      message: `Your account details (${Object.keys(patch).join(", ")}) were updated by platform administrator.`,
      type: "system",
    });
  } else if (entityType === "worker") {
    await sendNotification({
      recipientRole: "worker",
      recipientId: updated._id,
      title: "Worker Profile Edited by Administrator",
      message: `Your worker profile (${Object.keys(patch).join(", ")}) was updated by platform administrator.`,
      type: "system",
    });
  } else if (entityType === "serviceRequest") {
    const changeDesc = patch.orderStatus
      ? `status changed to ${patch.orderStatus}`
      : patch.quoteAmount
      ? `quote updated to ₹${patch.quoteAmount}`
      : `details updated`;
    if (updated.customerId) {
      await sendNotification({
        recipientRole: "customer",
        recipientId: updated.customerId,
        title: "Service Request Updated",
        message: `Your request #${updated._id.toString().slice(-6)} was updated: ${changeDesc}.`,
        type: "order",
      });
    }
    if (updated.workerId) {
      await sendNotification({
        recipientRole: "worker",
        recipientId: updated.workerId,
        title: "Service Request Updated",
        message: `Service request #${updated._id.toString().slice(-6)} was updated: ${changeDesc}.`,
        type: "order",
      });
    }
  }

  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: updated,
    message: "Entity updated successfully",
  });
});

const getAllAdmins = asyncHandler(async (req, res) => {
  const admins = await Admin.find({}, "fullName email role isActive createdAt updatedAt profilePhoto").sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: admins,
    message: "Admin accounts fetched successfully",
  });
});

const toggleAdminActive = asyncHandler(async (req, res) => {
  const { adminId } = req.params;
  const { isActive } = req.body;
  if (!adminId) throw new ApiError(400, "adminId is required");

  if (req.admin._id.toString() === adminId.toString()) {
    throw new ApiError(400, "You cannot deactivate your own admin account");
  }

  const targetAdmin = await Admin.findById(adminId);
  if (!targetAdmin) throw new ApiError(404, "Admin account not found");

  const newStatus = typeof isActive === "boolean" ? isActive : !targetAdmin.isActive;
  targetAdmin.isActive = newStatus;
  await targetAdmin.save();

  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: targetAdmin,
    message: `Admin account ${newStatus ? "activated" : "deactivated (access revoked)"} successfully`,
  });
});

const updateAdminRole = asyncHandler(async (req, res) => {
  const { adminId } = req.params;
  const { role } = req.body;
  if (!adminId || !role) throw new ApiError(400, "adminId and role are required");

  const validRoles = ["viewer", "suggester", "master"];
  if (!validRoles.includes(role)) throw new ApiError(400, "Role must be viewer, suggester, or master");

  if (req.admin._id.toString() === adminId.toString() && role !== "master") {
    const masterCount = await Admin.countDocuments({ role: "master", isActive: true });
    if (masterCount <= 1) {
      throw new ApiError(400, "Cannot demote yourself as the only active master admin");
    }
  }

  const targetAdmin = await Admin.findByIdAndUpdate(adminId, { role }, { new: true });
  if (!targetAdmin) throw new ApiError(404, "Admin account not found");

  return res.status(200).json({
    success: true,
    statusCode: 200,
    data: targetAdmin,
    message: `Admin role updated to ${role} successfully`,
  });
});

const executeAdminAction = asyncHandler(async (req, res, next) => {
  const { action } = req.body;
  if (!action) {
    throw new ApiError(400, "Action identifier is required (e.g. 'generate-otp', 'verify-otp', 'update-job-status')");
  }

  const payload = req.body.payload || req.body.data || req.body;

  // Normalize req.params and req.body from payload for compatibility with all controllers
  req.params = { ...req.params, ...payload };
  req.body = { ...req.body, ...payload };

  switch (action) {
    // ----------------------------------------------------
    // 1. GENERATE CUSTOMER OTP (Reuses generateOtpobj from customer.controller.js)
    // ----------------------------------------------------
    case "generate-otp":
    case "generateOtp": {
      req.body.serviceRequestId = payload.serviceRequestId || req.body.serviceRequestId;
      return await generateOtpobj(req, res, next);
    }

    // ----------
    // ------------------------------------------
    // 2. VERIFY SERVICE OTP (Reuses verifyOtpForService from worker.controller.js)
    // ----------------------------------------------------
    case "verify-otp":
    case "verifyOtp": {
      req.body.serviceRequestId = payload.serviceRequestId || req.body.serviceRequestId;
      req.body.otp = payload.otp || req.body.otp;
      return await verifyOtpForService(req, res, next);
    }

    // ----------------------------------------------------
    // 3. GET CUSTOMER BY ID / EMAIL (Reuses getCustomerById from customer.controller.js)
    // ----------------------------------------------------
    case "get-customer":
    case "getCustomer":
    case "getCustomerById": {
      req.body.id = payload.customerId || payload.id || req.body.id;
      if (!req.body.id && payload.email) {
        const cust = await Customer.findOne({ email: payload.email.toLowerCase() });
        if (!cust) throw new ApiError(404, "Customer not found with email: " + payload.email);
        req.body.id = cust._id;
      }
      return await getCustomerById(req, res, next);
    }

    // ----------------------------------------------------
    // 4. GET WORKER BY ID / EMAIL (Reuses getWorkerById from worker.controller.js)
    // ----------------------------------------------------
    case "get-worker":
    case "getWorker":
    case "getWorkerById": {
      req.body._id = payload.workerId || payload.id || req.body._id;
      if (!req.body._id && payload.email) {
        const w = await Worker.findOne({ email: payload.email.toLowerCase() });
        if (!w) throw new ApiError(404, "Worker not found with email: " + payload.email);
        req.body._id = w._id;
      }
      return await getWorkerById(req, res, next);
    }

    // ----------------------------------------------------
    // 5. GET SERVICE REQUEST DETAILS (Reuses getServiceRequestDetails from serviceRequest.controller.js)
    // ----------------------------------------------------
    case "get-service-details":
    case "getServiceRequestDetails": {
      req.body.serviceRequestId = payload.serviceRequestId || req.body.serviceRequestId || payload.id;
      return await getServiceRequestDetails(req, res, next);
    }

    // ----------------------------------------------------
    // 6. UPDATE JOB STATUS (Reuses updateJobStatus from serviceRequest.controller.js)
    // ----------------------------------------------------
    case "update-job-status":
    case "updateJobStatus": {
      req.body.serviceRequestId = payload.serviceRequestId || req.body.serviceRequestId;
      req.body.newStatus = payload.newStatus || payload.status || req.body.newStatus;
      return await updateJobStatus(req, res, next);
    }

    // ----------------------------------------------------
    // 7. SET REPAIR QUOTE AMOUNT (Reuses setQuoteAmount from serviceRequest.controller.js)
    // ----------------------------------------------------
    case "set-quote-amount":
    case "setQuoteAmount": {
      req.params.serviceRequestId = payload.serviceRequestId || req.params.serviceRequestId || payload.id;
      req.body.quoteAmount = payload.quoteAmount || req.body.quoteAmount;
      if (!req.worker?._id) {
        const sReq = await ServiceRequest.findById(req.params.serviceRequestId);
        req.worker = { _id: payload.workerId || sReq?.workerId };
      }
      return await setQuoteAmount(req, res, next);
    }

    // ----------------------------------------------------
    // 8. ACCEPT REPAIR QUOTE (Reuses acceptRepairQuote from serviceRequest.controller.js)
    // ----------------------------------------------------
    case "accept-repair-quote":
    case "acceptRepairQuote": {
      req.params.serviceRequestId = payload.serviceRequestId || req.params.serviceRequestId || payload.id;
      return await acceptRepairQuote(req, res, next);
    }

    // ----------------------------------------------------
    // 9. REJECT REPAIR QUOTE (Reuses rejectRepairQuote from serviceRequest.controller.js)
    // ----------------------------------------------------
    case "reject-repair-quote":
    case "rejectRepairQuote": {
      req.params.serviceRequestId = payload.serviceRequestId || req.params.serviceRequestId || payload.id;
      return await rejectRepairQuote(req, res, next);
    }

    // ----------------------------------------------------
    // 10. MARK PAYMENT DONE (Reuses markPaymentDone from serviceRequest.controller.js)
    // ----------------------------------------------------
    case "mark-payment":
    case "markPaymentDone": {
      req.body.serviceRequestId = payload.serviceRequestId || req.body.serviceRequestId;
      return await markPaymentDone(req, res, next);
    }

    // ----------------------------------------------------
    // 11. CASH PAYMENT RECEIVED (Reuses paymentReceivedByCash from payment.controller.js)
    // ----------------------------------------------------
    case "cash-payment":
    case "paymentReceivedByCash": {
      req.params.serviceRequestId = payload.serviceRequestId || req.params.serviceRequestId;
      return await paymentReceivedByCash(req, res, next);
    }

    // ----------------------------------------------------
    // 12. RATE WORKER FOR SERVICE (Reuses rateWorker from worker.controller.js)
    // ----------------------------------------------------
    case "rate-worker":
    case "rateWorker": {
      req.body.serviceRequestId = payload.serviceRequestId || req.body.serviceRequestId;
      req.body.rating = payload.rating !== undefined ? Number(payload.rating) : req.body.rating;
      return await rateWorkerAction(req, res, next);
    }

    // ----------------------------------------------------
    // 13. REPORT WORKER (Reuses reportWorker from serviceRequest.controller.js)
    // ----------------------------------------------------
    case "report-worker":
    case "reportWorker": {
      req.params.serviceRequestId = payload.serviceRequestId || req.params.serviceRequestId;
      return await reportWorker(req, res, next);
    }

    // ----------------------------------------------------
    // 14. GET CUSTOMER HISTORY (Reuses getCustomerHistory from serviceRequest.controller.js)
    // ----------------------------------------------------
    case "get-customer-history":
    case "getCustomerHistory": {
      const custId = payload.customerId || payload.id;
      req.customer = { _id: custId };
      return await getCustomerHistory(req, res, next);
    }

    // ----------------------------------------------------
    // 15. GET WORKER HISTORY (Reuses getWorkerHistory from serviceRequest.controller.js)
    // ----------------------------------------------------
    case "get-worker-history":
    case "getWorkerHistory": {
      const wId = payload.workerId || payload.id;
      req.worker = { _id: wId };
      return await getWorkerHistory(req, res, next);
    }

    // ----------------------------------------------------
    // 16. UPDATE WORKER LOCATION (Reuses updateWorkerLocation from worker.controller.js)
    // ----------------------------------------------------
    case "update-worker-location":
    case "updateWorkerLocation": {
      const wId = payload.workerId || payload.id;
      req.user = { _id: wId };
      req.body.coordinates = payload.coordinates || (payload.longitude !== undefined && payload.latitude !== undefined ? [Number(payload.longitude), Number(payload.latitude)] : req.body.coordinates);
      return await updateWorkerLocation(req, res, next);
    }

    // ----------------------------------------------------
    // 17. CREATE SERVICE REQUEST (Reuses createServiceRequest from serviceRequest.controller.js)
    // ----------------------------------------------------
    case "create-service-request":
    case "createServiceRequest": {
      const custId = payload.customerId || payload.id;
      req.customer = { _id: custId };
      return await createServiceRequest(req, res, next);
    }

    // ----------------------------------------------------
    // 18. ACCEPT SERVICE REQUEST (Reuses acceptRequest from serviceRequest.controller.js)
    // ----------------------------------------------------
    case "accept-service-request":
    case "acceptRequest": {
      req.body.serviceRequestId = payload.serviceRequestId || req.body.serviceRequestId;
      req.worker = { _id: payload.workerId };
      return await acceptRequest(req, res, next);
    }

    // ----------------------------------------------------
    // 19. CANCELLATION ACTIONS (Reuses cancellation methods from serviceRequest.controller.js)
    // ----------------------------------------------------
    case "cancel-by-worker-not-responding": {
      req.params.serviceRequestId = payload.serviceRequestId || req.params.serviceRequestId;
      return await cancelledByWorkerAsCustomerNotResponding(req, res, next);
    }

    case "cancel-by-worker-unable": {
      req.params.serviceRequestId = payload.serviceRequestId || req.params.serviceRequestId;
      return await cancelledByWorkerAsNotAbleToServe(req, res, next);
    }

    case "cancel-by-customer-late": {
      req.params.serviceRequestId = payload.serviceRequestId || req.params.serviceRequestId;
      req.customer = { _id: payload.customerId };
      return await cancelledByCustomerAsWorkerNotRespondingOrLate(req, res, next);
    }

    case "cancel-by-customer-mistake": {
      req.params.serviceRequestId = payload.serviceRequestId || req.params.serviceRequestId;
      req.customer = { _id: payload.customerId };
      return await cancelledByCustomerAsByMistake(req, res, next);
    }

    // ----------------------------------------------------
    // 20. UPDATE CUSTOMER PROFILE FIELD (Reuses updateFullName, updatePhone, updateAddress, updateEmail)
    // ----------------------------------------------------
    case "update-customer":
    case "updateCustomer": {
      const custId = payload.customerId || payload.id;
      req.customer = { _id: custId };
      if (payload.fullName) {
        req.body.fullName = payload.fullName;
        return await updateCustomerFullName(req, res, next);
      }
      if (payload.phone) {
        req.body.phone = payload.phone;
        return await updateCustomerPhone(req, res, next);
      }
      if (payload.address) {
        req.body.address = payload.address;
        return await updateCustomerAddress(req, res, next);
      }
      if (payload.email) {
        req.body.email = payload.email;
        return await updateCustomerEmail(req, res, next);
      }
      throw new ApiError(400, "Provide fullName, phone, address, or email to update customer");
    }

    // ----------------------------------------------------
    // 21. UPDATE WORKER CATEGORY (Reuses updateCategory from worker.controller.js)
    // ----------------------------------------------------
    case "update-worker-category":
    case "updateWorkerCategory": {
      const wId = payload.workerId || payload.id;
      req.worker = { _id: wId };
      req.body.newCategory = payload.newCategory || payload.category;
      return await updateWorkerCategory(req, res, next);
    }

    // ----------------------------------------------------
    // 22. RESET PASSWORD (Direct database update)
    // ----------------------------------------------------
    case "reset-password":
    case "resetPassword": {
      const { userType, id, email, newPassword } = payload;
      if (!userType || (!id && !email) || !newPassword) {
        throw new ApiError(400, "userType ('customer'|'worker'), id or email, and newPassword are required");
      }
      if (userType === "customer") {
        const customer = id ? await Customer.findById(id) : await Customer.findOne({ email: email.toLowerCase() });
        if (!customer) throw new ApiError(404, "Customer not found");
        customer.password = newPassword;
        await customer.save({ validateBeforeSave: false });
        return res.status(200).json({ success: true, message: `Customer (${customer.email}) password reset successfully` });
      }
      if (userType === "worker") {
        const worker = id ? await Worker.findById(id) : await Worker.findOne({ email: email.toLowerCase() });
        if (!worker) throw new ApiError(404, "Worker not found");
        worker.password = newPassword;
        await worker.save({ validateBeforeSave: false });
        return res.status(200).json({ success: true, message: `Worker (${worker.email}) password reset successfully` });
      }
      throw new ApiError(400, "Invalid userType. Must be 'customer' or 'worker'");
    }

    default:
      throw new ApiError(
        400,
        `Unknown admin action '${action}'. Available actions: generate-otp, verify-otp, get-customer, get-worker, get-service-details, update-job-status, set-quote-amount, accept-repair-quote, reject-repair-quote, mark-payment, cash-payment, rate-worker, report-worker, get-customer-history, get-worker-history, update-worker-location, create-service-request, accept-service-request, cancel-by-worker-not-responding, cancel-by-worker-unable, cancel-by-customer-late, cancel-by-customer-mistake, update-customer, update-worker-category, reset-password`
      );
  }
});

const getCurrentAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id).select("-password -refreshToken");
  if (!admin) {
    throw new ApiError(404, "Admin account not found");
  }
  return res.status(200).json(new ApiResponse(200, admin, "Admin profile fetched successfully"));
});

const updateAdminFullName = asyncHandler(async (req, res) => {
  const { fullName } = req.body;
  if (!fullName || !fullName.trim()) {
    throw new ApiError(400, "Full name cannot be empty");
  }

  const admin = await Admin.findByIdAndUpdate(
    req.admin._id,
    { $set: { fullName: fullName.trim() } },
    { new: true }
  ).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, admin, "Full name updated successfully"));
});

const updateAdminEmail = asyncHandler(async (req, res) => {
  throw new ApiError(403, "Administrator email address is permanent and cannot be modified");
});

const updateAdminProfilePhoto = asyncHandler(async (req, res) => {
  let photoUrl = req.body?.profilePhoto;

  if (req.file?.path) {
    const uploadResult = await uploadOnCloudinary(req.file.path);
    if (uploadResult?.url) {
      photoUrl = uploadResult.url;
    }
  }

  if (!photoUrl) {
    throw new ApiError(400, "Profile photo file or URL is required");
  }

  const admin = await Admin.findByIdAndUpdate(
    req.admin._id,
    { $set: { profilePhoto: photoUrl } },
    { new: true }
  ).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, admin, "Profile photo updated successfully"));
});

const changeAdminPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Both old password and new password are required");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters long");
  }

  const admin = await Admin.findById(req.admin._id);
  if (!admin) {
    throw new ApiError(404, "Admin account not found");
  }

  const isMatch = await admin.isPasswordCorrect(oldPassword);
  if (!isMatch) {
    throw new ApiError(400, "Current password is incorrect");
  }

  admin.password = newPassword;
  await admin.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

const updateAdminProfile = asyncHandler(async (req, res) => {
  const { fullName, profilePhoto } = req.body;
  const updateData = {};

  if (fullName !== undefined && fullName.trim() !== "") {
    updateData.fullName = fullName.trim();
  }
  if (profilePhoto !== undefined && profilePhoto.trim() !== "") {
    updateData.profilePhoto = profilePhoto.trim();
  }

  const admin = await Admin.findByIdAndUpdate(
    req.admin._id,
    { $set: updateData },
    { new: true }
  ).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, admin, "Profile updated successfully"));
});

const forgotPasswordAdmin = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    throw new ApiError(400, "Admin email address is required");
  }

  const cleanEmail = email.trim().toLowerCase();
  const admin = await Admin.findOne({ email: cleanEmail });
  if (!admin) {
    throw new ApiError(404, "No administrator account found with this email");
  }

  if (!admin.isActive) {
    throw new ApiError(403, "Admin account is inactive. Please contact system administrator.");
  }

  // Generate readable temporary password (admin requires min 8 characters)
  const tempPassword = `Admin@${crypto.randomBytes(3).toString("hex")}`;
  admin.password = tempPassword;
  await admin.save({ validateBeforeSave: false });

  try {
    const transporter = getAdminEmailTransporter();
    await transporter.sendMail({
      from: `"Karigar Admin Support" <${process.env.EMAIL}>`,
      to: admin.email,
      subject: "Your Karigar Admin Login Password",
      text: `Hello ${admin.fullName || "Administrator"},

You requested a password reset for your Karigar Admin account.

Your temporary admin login password is:
${tempPassword}

Please use this password to sign in to the Admin Dashboard.
After signing in, you can update your password anytime under "Admin Profile" -> "Security & Password".

If you did not make this request, please contact the lead administrator immediately.

Best regards,
Karigar Security Team`,
    });
  } catch (err) {
    console.error("Failed to dispatch admin forgot-password email:", err);
    throw new ApiError(500, "Failed to send password email. Please verify server email configuration.");
  }

  return res.status(200).json(
    new ApiResponse(200, {}, "A new password has been sent to your registered admin email address")
  );
});

export {
  loginAdminWithGoogle,
  loginAdminWithEmail,
  getAdminSummary,
  getAdminUsers,
  getAllAdmins,
  toggleAdminActive,
  updateAdminRole,
  blockUser,
  sendMessage,
  getAdminMessages,
  getAdminRequests,
  approveAdminRequest,
  rejectAdminRequest,
  createAdminRequest,
  runAdminApiCall,
  commentOnEntity,
  getEntityComments,
  editEntity,
  executeAdminAction,
  getCurrentAdmin,
  updateAdminFullName,
  updateAdminEmail,
  updateAdminProfilePhoto,
  changeAdminPassword,
  updateAdminProfile,
  forgotPasswordAdmin,
};
