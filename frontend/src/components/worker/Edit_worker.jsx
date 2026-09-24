import React, { useState } from "react";
import api from "../../api.js";
import { useNavigate, useLocation } from "react-router-dom";
import { useWorker } from "../../Context/Worker_context";

const Edit_worker = () => {
  const { state: workerData } = useLocation();
  const navigate = useNavigate();
  const {worker,setWorker, token } = useWorker();

  const [form, setForm] = useState({
    fullName: workerData?.fullName || "",
    email: workerData?.email || "",
    phone: workerData?.phone || "",
    address: workerData?.address || "",
  });

  const [editable, setEditable] = useState({
    fullName: false,
    phone: false,
    address: false,
  });

  const availableCategories = [
    "plumber",
    "electrician",
    "carpenter",
    "painter",
    "tv",
    "fridge",
    "ac",
    "washing-machine",
    "laptop",
  ];

  const [workingCategory, setWorkingCategory] = useState(workerData?.workingCategory || []);
  const [selectedCategory, setSelectedCategory] = useState(
    availableCategories.find(
      (cat) => !workerData?.workingCategory?.some((c) => c.toLowerCase() === cat.toLowerCase())
    ) || availableCategories[0]
  );
  const [profilePhoto, setProfilePhoto] = useState(workerData?.profilePhoto || "");
  const [photoFile, setPhotoFile] = useState(null);

  const updateFieldAPI = async (field, value) => {
    const apiMap = {
      fullName: "/api/v1/worker/update-fullName",
      email: "/api/v1/worker/update-email",
      phone: "/api/v1/worker/update-phone",
      address: "/api/v1/worker/update-address",
      profilePhoto: "/api/v1/worker/update-profile-photo",
    };

    try {
      if (field === "profilePhoto") {
        const formData = new FormData();
        formData.append("profilePhoto", value);

        const { data } = await api.patch(apiMap[field], formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      //  setProfilePhoto(data.data.profilePhoto);

        // Update the worker context with the new profile photo URL
        setWorker((prev) => ({
          ...prev,
          profilePhoto: data.data.profilePhoto,
        }));
 
        setProfilePhoto(data.data.profilePhoto);
        console.log(data.data);
        alert("Profile photo updated successfully!");
      } else {
        await api.patch(apiMap[field], { [field]: value }, 
          {   
            headers: { Authorization: `Bearer ${token}` },
           });
        alert(`${field} updated successfully!`);

        setWorker((prev) => ({
          ...prev,
          [field]: value,
        }));

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

  const handleAddCategory = async () => {
    if (!selectedCategory) {
      alert("Please select a category.");
      return;
    }

    try {
      const { data } = await api.patch(
        "/api/v1/worker/update-categories",
        { newCategory: selectedCategory },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = data.data.workingCategory;
      setWorkingCategory(updated); // updated from backend
      const nextAvailable = availableCategories.find(
        (c) => !updated.some((cat) => cat.toLowerCase() === c.toLowerCase())
      ) || availableCategories[0];
      setSelectedCategory(nextAvailable);
      alert("Category added successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add category: " + (err.response?.data?.message || err.message));
    }
  };

  const handleRemoveCategory = async (catToRemove, index) => {
    try {
      await api.patch(
        "/api/v1/worker/remove-category",
        { category: catToRemove },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.warn("Backend remove-category note:", err?.message);
    }

    const updated = workingCategory.filter((_, i) => i !== index);
    setWorkingCategory(updated);
    setWorker((prev) => ({
      ...prev,
      workingCategory: updated,
    }));
  };

  return (
    <div className="container mt-5">
      <div
        className="card shadow p-4"
        style={{ maxWidth: "600px", margin: "0 auto", borderRadius: "16px" }}
      >
        <h3 className="text-center mb-4">Edit Worker Profile</h3>

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

        {/* Fields */}
        <form className="mt-3">
          {/* Email - Not Editable */}
          <div className="mb-4">
            <label className="form-label text-capitalize">Email</label>
            <input
              type="email"
              name="email"
              className="form-control bg-light"
              value={form.email}
              disabled
              readOnly
            />
            <small className="text-muted">Email is not editable.</small>
          </div>

          {["fullName", "phone", "address"].map((field) => (
            <div className="mb-4" key={field}>
              <label className="form-label text-capitalize">
                {field === "fullName" ? "Full Name" : field}
              </label>
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

          {/* Working Category Section */}
          <div className="mb-4">
            <label className="form-label">Working Categories</label>
            <div className="d-flex flex-wrap gap-2 mb-2">
              {workingCategory.map((cat, idx) => (
                <span
                  key={idx}
                  className="badge bg-primary text-light d-flex align-items-center text-capitalize"
                  style={{ padding: "0.5rem 0.85rem", borderRadius: "12px", fontSize: "0.95rem" }}
                >
                  {cat}
                  <button
                    type="button"
                    className="btn btn-sm text-white ms-2 p-0 border-0 d-inline-flex align-items-center justify-content-center"
                    style={{
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "1.1rem",
                      lineHeight: "1",
                      fontWeight: "bold",
                    }}
                    onClick={() => handleRemoveCategory(cat, idx)}
                    title={`Remove ${cat}`}
                    aria-label={`Remove ${cat}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="input-group">
              <select
                className="form-select text-capitalize"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {availableCategories.map((cat) => {
                  const isAlreadyAdded = workingCategory.some(
                    (c) => c.toLowerCase() === cat.toLowerCase()
                  );
                  return (
                    <option key={cat} value={cat} disabled={isAlreadyAdded}>
                      {cat} {isAlreadyAdded ? "(Added)" : ""}
                    </option>
                  );
                })}
              </select>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleAddCategory}
                disabled={!selectedCategory || workingCategory.some((c) => c.toLowerCase() === selectedCategory.toLowerCase())}
              >
                Add
              </button>
            </div>
          </div>

          {/* Go to Profile */}
          <div className="text-end mt-4">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                navigate("/worker", {
                  state: { ...workerData, ...form, profilePhoto, workingCategory },
                })
              }
            >
              Go to Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Edit_worker;
