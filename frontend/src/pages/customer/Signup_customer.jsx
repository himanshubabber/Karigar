import { useState } from "react";
import api from "../../api.js";
import { useNavigate } from "react-router-dom";
import Spinner from "../../components/Style/Spinner.jsx"

const Signup_customer = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [loading,setLoading]= useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      setPreviewPhoto(URL.createObjectURL(file));
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { fullName, email, phone, address, password } = form;

    if (!fullName || !email || !phone || !address || password.length < 8) {
      alert("Please fill all fields correctly. Password must be at least 8 characters.");
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        formData.append(key, form[key]);
      });

      if (profilePhoto) {
        formData.append("profilePhoto", profilePhoto);
      }
      setLoading(true);
      const res = await api.post("/api/v1/customer/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Signup successful!");
      console.log("Registered customer:", res.data);
      navigate("/signin_customer");
    } catch (err) {
      console.error(err);
      alert("Signup failed: " + (err.response?.data?.message || err.message));
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 py-4 py-sm-5 px-3 bg-light">
      <div className="card shadow-sm border-0 w-100 my-auto" style={{ maxWidth: "28rem", borderRadius: "14px", backgroundColor: "#ffffff" }}>
        <div className="card-body p-3 p-sm-4">
          <h4 className="text-center mb-4 fw-bold text-dark">Customer Signup</h4>
          <form onSubmit={handleSignup} encType="multipart/form-data">
            {["fullName", "email", "phone", "address", "password"].map((field) => (
              <div className="mb-3" key={field}>
                <label className="form-label fw-semibold">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type={field === "password" ? "password" : "text"}
                  className="form-control"
                  name={field}
                  value={form[field]}
                  onChange={handleChange}
                  placeholder={field === "password" ? "At least 8 characters" : `Enter ${field}`}
                  required
                />
              </div>
            ))}

            {/* Profile Photo Upload */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Profile Photo (optional)</label>
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={handlePhotoChange}
              />
              {previewPhoto && (
                <div className="text-center mt-3">
                  <img
                    src={previewPhoto}
                    alt="Preview"
                    className="rounded-circle shadow"
                    style={{ width: "100px", height: "100px", objectFit: "cover" }}
                  />
                  <p className="text-muted mt-1" style={{ fontSize: "0.85rem" }}>
                    Preview
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 fw-semibold py-2 mt-3"
              style={{ minHeight: "44px", borderRadius: "8px" }}
            >
              Sign Up
            </button>
          </form>
        </div>
      </div>
      {loading && <Spinner/>}
    </div>
  );
};

export default Signup_customer;
