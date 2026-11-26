import React, { useState } from "react";
import axios from "axios";
import api from "../../api.js";
import { useNavigate } from "react-router-dom";
import { useCustomer } from "../../Context/Customer_context";

const Edit_customer = () => {
  const { customer, setCustomer,token } = useCustomer();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: customer?.fullName || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
  });

  const [editable, setEditable] = useState({
    fullName: false,
    email: false,
    phone: false,
    address: false,
  });

  const [profilePhoto, setProfilePhoto] = useState(customer?.profilePhoto || "");
  const [photoFile, setPhotoFile] = useState(null);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      setPasswordFeedback({ type: "danger", message: "Please enter both current and new passwords." });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordFeedback({ type: "danger", message: "New password must be at least 6 characters long." });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback({ type: "danger", message: "New passwords do not match." });
      return;
    }

    const confirmed = window.confirm("Are you sure you want to update your password?");
    if (!confirmed) return;

    setPasswordLoading(true);
    setPasswordFeedback(null);

    try {
      await api.post(
        "/api/v1/customer/change-password",
        {
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordFeedback({ type: "success", message: "Password changed successfully!" });
    } catch (err) {
      console.error(err);
      setPasswordFeedback({
        type: "danger",
        message: err.response?.data?.message || "Failed to change password. Please verify your current password.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const updateFieldAPI = async (field, value) => {
    const apiMap = {
      fullName: "/api/v1/customer/update-fullName",
      email: "/api/v1/customer/update-email",
      phone: "/api/v1/customer/update-phone",
      address: "/api/v1/customer/update-address",
      profilePhoto: "/api/v1/customer/update-profile-photo",
    };

    try {
      if (field === "profilePhoto") {
        const formData = new FormData();
        formData.append("profilePhoto", value);

        const { data } = await api.patch(apiMap[field], formData, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        setCustomer(data.data);
       // localStorage.setItem("karigar_customer", JSON.stringify(data.data));
        setProfilePhoto(data.data.profilePhoto);
        alert("Profile photo updated successfully!");
      } else {
        await api.patch(apiMap[field], { [field]: value }, {  headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
         });

        const updatedCustomer = { ...customer, [field]: value };
        setCustomer(updatedCustomer);
        localStorage.setItem("karigar_customer", JSON.stringify(updatedCustomer));
        alert(`${field} updated successfully!`);
      }
    } catch (err) {
      console.error(err);
      alert(`Failed to update ${field}: ${err.response?.data?.message || err.message}`);
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
    if (photoFile) {
      await updateFieldAPI("profilePhoto", photoFile);
    }
  };

  return (
    <div className="container my-3 my-sm-5 px-3">
      <div
        className="card shadow p-3 p-sm-4 bg-white shadow-lg"
        style={{ maxWidth: "600px", margin: "0 auto", borderRadius: "16px" }}
      >
        <h3 className="text-center mb-4">Edit Customer Profile</h3>

        {/* Profile Photo Section */}
        <div className="text-center mb-4">
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              overflow: "hidden",
              margin: "auto",
              border: "2px solid #ccc",
            }}
          >
            <img
              src={profilePhoto || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
              alt="Profile"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          <input
            type="file"
            className="form-control mt-3"
            accept="image/*"
            onChange={handlePhotoChange}
          />
          <button
            className="btn btn-primary mt-2"
            onClick={handleUploadPhoto}
            disabled={!photoFile}
          >
            Upload Photo
          </button>
        </div>

        {/* Editable Fields */}
        <form className="mt-3">
          {["fullName", "email", "phone", "address"].map((field) => (
            <div className="mb-4" key={field}>
              <label className="form-label text-capitalize">{field}</label>
              <div className="input-group">
                <input
                  type="text"
                  name={field}
                  className="form-control"
                  value={form[field]}
                  onChange={handleChange}
                  disabled={!editable[field]}
                />
                <button
                  type="button"
                  className={`btn ${editable[field] ? "btn-success" : "btn-outline-secondary"}`}
                  onClick={() => handleToggle(field)}
                >
                  {editable[field] ? "Save" : "Edit"}
                </button>
              </div>
            </div>
          ))}

          {/* Security & Change Password Section */}
          <div className="border-top pt-4 mt-4">
            <h5 className="fw-bold mb-3 text-dark">Security & Password</h5>

            {passwordFeedback && (
              <div
                className={`alert alert-${passwordFeedback.type} py-2 px-3 small mb-3`}
                role="alert"
              >
                {passwordFeedback.message}
              </div>
            )}

            <div className="mb-3">
              <label className="form-label small fw-semibold text-muted">Current / Temporary Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter password (e.g. from reset email)"
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
                  placeholder="Min 6 characters"
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

            <div className="d-flex justify-content-end mb-3">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm px-3"
                onClick={handleChangePassword}
                disabled={passwordLoading || !passwordForm.oldPassword || !passwordForm.newPassword}
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>

          <div className="text-end mt-4 pt-3 border-top">
            <button
              type="button"
              className="btn btn-primary w-100 w-sm-auto"
              onClick={() => navigate("/customer")}
            >
              Go to Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Edit_customer;
