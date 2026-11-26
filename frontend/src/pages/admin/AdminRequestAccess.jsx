import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminRequestAccess = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", requestedRole: "viewer", reason: "" });
  const [loading, setLoading] = useState(false);
  const apiBaseUrl = import.meta.env.VITE_API_URL || "https://karigarbackend.vercel.app";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${apiBaseUrl}/api/v1/admin/request-access`, form, { withCredentials: true });
      alert("Request submitted. Please wait for approval.");
      navigate("/admin");
    } catch (error) {
      console.error(error);
      alert("Unable to submit request: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
      <div className="card shadow-lg rounded-4 border-0 p-3 p-sm-4" style={{ width: "100%", maxWidth: "540px" }}>
        <div className="card-body p-2 p-sm-3">
          <div className="text-center mb-4">
            <div className="d-inline-flex p-3 rounded-4 bg-primary bg-opacity-10 text-primary fs-3 mb-3">
              🛡️
            </div>
            <h3 className="fw-bold text-dark mb-1">Request Admin Access</h3>
            <p className="text-muted small mb-0">Enter your email and desired admin role. A master administrator will review your request.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-muted">Email Address</label>
              <input
                type="email"
                className="form-control"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value.trim().toLowerCase() }))}
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-muted">Requested Role</label>
              <select
                className="form-select"
                value={form.requestedRole}
                onChange={(e) => setForm((prev) => ({ ...prev, requestedRole: e.target.value }))}
              >
                <option value="viewer">Viewer (Read-only operations)</option>
                <option value="suggester">Suggester (Comments & recommendations)</option>
                <option value="master">Master (Full system control)</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="form-label small fw-semibold text-muted">Business Reason</label>
              <textarea
                className="form-control"
                rows="4"
                placeholder="Explain why you require administrative elevation on Karigar..."
                value={form.reason}
                onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
              />
            </div>
            <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
              {loading ? "Submitting Request..." : "Submit Access Request"}
            </button>
            <div className="mt-3 text-center">
              <button
                type="button"
                className="btn btn-link btn-sm text-decoration-none text-muted"
                onClick={() => navigate("/signin_admin")}
              >
                &larr; Back to Admin Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminRequestAccess;
