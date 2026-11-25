import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../../Context/Admin_context";
import {
  FaUserShield,
  FaArrowLeft,
  FaCamera,
  FaCheck,
  FaExclamationTriangle,
  FaLock,
  FaUser,
  FaEnvelope,
  FaIdBadge,
} from "react-icons/fa";

const Edit_admin = () => {
  const { admin, setAdmin, token } = useAdmin();
  const navigate = useNavigate();

  const apiBaseUrl = import.meta.env.VITE_API_URL || "https://karigarbackend.vercel.app";

  const [form, setForm] = useState({
    fullName: admin?.fullName || "",
    email: admin?.email || "",
  });

  const [editable, setEditable] = useState({
    fullName: false,
  });

  const [profilePhoto, setProfilePhoto] = useState(admin?.profilePhoto || "");
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Feedback toast / alert
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (message, type = "success") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  useEffect(() => {
    if (admin) {
      setForm({
        fullName: admin.fullName || "",
        email: admin.email || "",
      });
      setProfilePhoto(admin.profilePhoto || "");
    }
  }, [admin]);

  const updateFieldAPI = async (field, value) => {
    if (field !== "fullName") return;

    try {
      const res = await axios.patch(
        `${apiBaseUrl}/api/v1/admin/update-fullName`,
        { fullName: value },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      const updated = res.data?.data || { ...admin, fullName: value };
      setAdmin(updated);
      localStorage.setItem("karigar_admin", JSON.stringify(updated));
      showFeedback("Full name updated successfully!", "success");
    } catch (err) {
      console.error(err);
      showFeedback(
        `Failed to update full name: ${err.response?.data?.message || err.message}`,
        "danger"
      );
    }
  };

  const handleToggle = async (field) => {
    if (editable[field]) {
      await updateFieldAPI(field, form[field]);
    }
    setEditable((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setProfilePhoto(URL.createObjectURL(file));
    }
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) return;
    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("profilePhoto", photoFile);

      const res = await axios.patch(
        `${apiBaseUrl}/api/v1/admin/update-profile-photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      const updatedAdmin = res.data?.data || { ...admin, profilePhoto: res.data?.data?.profilePhoto };
      setAdmin(updatedAdmin);
      localStorage.setItem("karigar_admin", JSON.stringify(updatedAdmin));
      setProfilePhoto(updatedAdmin.profilePhoto || profilePhoto);
      setPhotoFile(null);
      showFeedback("Profile photo uploaded successfully!", "success");
    } catch (err) {
      console.error(err);
      showFeedback(
        `Failed to upload photo: ${err.response?.data?.message || err.message}`,
        "danger"
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      showFeedback("Please provide both current and new passwords.", "danger");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showFeedback("New password must be at least 8 characters long.", "danger");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showFeedback("New passwords do not match.", "danger");
      return;
    }

    setChangingPassword(true);
    try {
      await axios.post(
        `${apiBaseUrl}/api/v1/admin/change-password`,
        {
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      showFeedback("Password changed successfully!", "success");
    } catch (err) {
      console.error(err);
      showFeedback(
        `Failed to change password: ${err.response?.data?.message || err.message}`,
        "danger"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "master":
        return <span className="badge bg-danger">Master Admin</span>;
      case "suggester":
        return <span className="badge bg-warning text-dark">Suggester Admin</span>;
      default:
        return <span className="badge bg-secondary">Viewer Admin</span>;
    }
  };

  return (
    <div className="container py-5" style={{ fontFamily: "Inter, sans-serif" }}>
      <div
        className="card shadow-lg p-4 p-md-5 bg-white border-0"
        style={{ maxWidth: "680px", margin: "0 auto", borderRadius: "18px" }}
      >
        {/* Header / Back Link */}
        <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 rounded-pill px-3"
            onClick={() => navigate("/admin/dashboard")}
          >
            <FaArrowLeft />
            <span>Back to Dashboard</span>
          </button>
          <div className="d-flex align-items-center gap-2">
            <FaUserShield className="text-primary fs-5" />
            <span className="fw-bold text-dark">Admin Profile</span>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`alert alert-${feedback.type} d-flex align-items-center gap-2 shadow-sm rounded-3 py-2 px-3 mb-4`}
          >
            {feedback.type === "success" ? <FaCheck /> : <FaExclamationTriangle />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Profile Photo Section */}
        <div className="text-center mb-4">
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              overflow: "hidden",
              margin: "0 auto",
              border: "3px solid #0d6efd",
              boxShadow: "0 4px 14px rgba(13, 110, 253, 0.2)",
              backgroundColor: "#f0f4ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Admin Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                }}
              />
            ) : (
              <span className="fw-bold text-primary fs-1">
                {admin?.email ? admin.email.charAt(0).toUpperCase() : "A"}
              </span>
            )}
          </div>

          <div className="mt-2">
            <span className="fw-semibold text-dark fs-5">{admin?.fullName || "Administrator"}</span>
            <div className="mt-1">{getRoleBadge(admin?.role)}</div>
          </div>

          {/* Photo File Input */}
          <div className="mt-3 d-flex flex-column align-items-center gap-2">
            <label
              htmlFor="admin-photo-upload"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2 rounded-pill px-3"
              style={{ cursor: "pointer" }}
            >
              <FaCamera />
              <span>{photoFile ? photoFile.name : "Choose New Photo"}</span>
            </label>
            <input
              id="admin-photo-upload"
              type="file"
              className="d-none"
              accept="image/*"
              onChange={handlePhotoChange}
            />

            {photoFile && (
              <button
                className="btn btn-sm btn-primary rounded-pill px-4 shadow-sm"
                onClick={handleUploadPhoto}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? "Uploading..." : "Save Photo"}
              </button>
            )}
          </div>
        </div>

        {/* Editable Profile Fields */}
        <h6 className="fw-bold text-muted small text-uppercase tracking-wide mb-3 border-bottom pb-2">
          Profile Details
        </h6>

        <form className="mb-4">
          {/* Full Name */}
          <div className="mb-3">
            <label className="form-label small fw-semibold text-muted d-flex align-items-center gap-2">
              <FaUser className="text-secondary" /> Full Name
            </label>
            <div className="input-group">
              <input
                type="text"
                name="fullName"
                className="form-control"
                placeholder="e.g. Himanshu Singh"
                value={form.fullName}
                onChange={handleChange}
                disabled={!editable.fullName}
              />
              <button
                type="button"
                className={`btn ${editable.fullName ? "btn-success" : "btn-outline-primary"}`}
                onClick={() => handleToggle("fullName")}
              >
                {editable.fullName ? "Save" : "Edit"}
              </button>
            </div>
          </div>

          {/* Email (Read Only - Permanent Identity) */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label small fw-semibold text-muted d-flex align-items-center gap-2 mb-0">
                <FaEnvelope className="text-secondary" /> Email Address
              </label>
              <span className="badge bg-secondary-subtle text-secondary border py-1 px-2" style={{ fontSize: "0.72rem" }}>
                <FaLock className="me-1" /> Permanent
              </span>
            </div>
            <div className="input-group">
              <span className="input-group-text bg-light text-muted border-end-0">
                <FaLock size={12} />
              </span>
              <input
                type="email"
                name="email"
                className="form-control bg-light text-dark fw-semibold border-start-0"
                value={form.email}
                readOnly
                disabled
              />
            </div>
            <small className="text-muted" style={{ fontSize: "0.76rem" }}>
              Administrator email address is permanent and cannot be modified.
            </small>
          </div>

          {/* Role (Read Only) */}
          <div className="mb-3">
            <label className="form-label small fw-semibold text-muted d-flex align-items-center gap-2">
              <FaIdBadge className="text-secondary" /> Assigned Role
            </label>
            <div className="form-control bg-light d-flex justify-content-between align-items-center">
              <span className="text-capitalize fw-semibold text-secondary">{admin?.role || "viewer"}</span>
              {getRoleBadge(admin?.role)}
            </div>
            <small className="text-muted" style={{ fontSize: "0.78rem" }}>
              Role elevations are managed by Master Administrators via Access Requests.
            </small>
          </div>
        </form>

        {/* Change Password Section */}
        <h6 className="fw-bold text-muted small text-uppercase tracking-wide mb-3 border-bottom pb-2">
          Security & Password
        </h6>

        <form onSubmit={handleChangePassword}>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-muted d-flex align-items-center gap-2">
              <FaLock className="text-secondary" /> Current Password
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter existing password"
              value={passwordForm.oldPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, oldPassword: e.target.value }))
              }
            />
          </div>

          <div className="row g-2 mb-3">
            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold text-muted">New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Min 8 characters"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                }
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold text-muted">Confirm New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Re-type new password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-4 pt-2 border-top">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/admin/dashboard")}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm"
              disabled={changingPassword || !passwordForm.oldPassword || !passwordForm.newPassword}
            >
              <FaLock />
              <span>{changingPassword ? "Updating..." : "Update Password"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Edit_admin;
