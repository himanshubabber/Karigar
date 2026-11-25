import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import { Admin } from "../models/admin.model.js";
import { Customer } from "../models/customer.model.js";
import { Worker } from "../models/worker.model.js";
import { ServiceRequest } from "../models/serviceRequest.model.js";
import { AdminRequest } from "../models/adminRequest.model.js";
import { AdminComment } from "../models/adminComment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";

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

import { AdminMessage } from "../models/adminMessage.model.js";

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

  return res.status(201).json({
    success: true,
    statusCode: 201,
    data: adminComment,
    message: "Comment saved successfully",
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
  editEntity,
};
