import { Router } from "express";
import {
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
  executeAdminAction,
  getCurrentAdmin,
  updateAdminFullName,
  updateAdminEmail,
  updateAdminProfilePhoto,
  changeAdminPassword,
  updateAdminProfile,
} from "../controllers/admin.controller.js";
import { seedDemoData } from "../controllers/demoData.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyAdminJWT, authorizeAdmin } from "../middlewares/adminAuth.middleware.js";

const router = Router();

// Profile management routes (any authenticated admin)
router.route("/current-user").get(verifyAdminJWT, getCurrentAdmin);
router.route("/update-fullName").patch(verifyAdminJWT, updateAdminFullName);
router.route("/update-email").patch(verifyAdminJWT, updateAdminEmail);
router.route("/update-profile-photo").patch(verifyAdminJWT, upload.single("profilePhoto"), updateAdminProfilePhoto);
router.route("/change-password").post(verifyAdminJWT, changeAdminPassword);
router.route("/update-profile").patch(verifyAdminJWT, updateAdminProfile);

router.route("/google-login").post(loginAdminWithGoogle);
router.route("/login").post(loginAdminWithEmail);
router.route("/request-access").post(createAdminRequest);
router.route("/seed-demo-data").post(verifyAdminJWT, authorizeAdmin("master"), seedDemoData);
router.route("/summary").get(verifyAdminJWT, authorizeAdmin("viewer", "suggester", "master"), getAdminSummary);
router.route("/users").get(verifyAdminJWT, authorizeAdmin("viewer", "suggester", "master"), getAdminUsers);
router.route("/admins").get(verifyAdminJWT, authorizeAdmin("viewer", "suggester", "master"), getAllAdmins);
router.route("/admins/:adminId/toggle-active").patch(verifyAdminJWT, authorizeAdmin("master"), toggleAdminActive);
router.route("/admins/:adminId/role").patch(verifyAdminJWT, authorizeAdmin("master"), updateAdminRole);
router.route("/comment").post(verifyAdminJWT, authorizeAdmin("suggester", "master"), commentOnEntity);
router.route("/edit").patch(verifyAdminJWT, authorizeAdmin("master"), editEntity);
router.route("/action").post(verifyAdminJWT, authorizeAdmin("suggester", "master"), executeAdminAction);
router.route("/api-call").post(verifyAdminJWT, authorizeAdmin("master"), runAdminApiCall);
router.route("/message").post(verifyAdminJWT, authorizeAdmin("suggester", "master"), sendMessage);
router.route("/messages").get(verifyAdminJWT, authorizeAdmin("suggester", "master"), getAdminMessages);
router.route("/block-user").patch(verifyAdminJWT, authorizeAdmin("master"), blockUser);
router.route("/requests").get(verifyAdminJWT, authorizeAdmin("master"), getAdminRequests);
router.route("/requests/:requestId/approve").patch(verifyAdminJWT, authorizeAdmin("master"), approveAdminRequest);
router.route("/requests/:requestId/reject").patch(verifyAdminJWT, authorizeAdmin("master"), rejectAdminRequest);

export default router;
