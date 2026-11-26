import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useAdmin } from "../../Context/Admin_context.jsx";
import Spinner from "../../components/Style/Spinner.jsx";

const Signin_admin = () => {
  const navigate = useNavigate();
  const { loginAdmin, token } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState("google");
  const [form, setForm] = useState({ email: "", password: "" });
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState(null);

  const apiBaseUrl = import.meta.env.VITE_API_URL || "https://karigarbackend.vercel.app";

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.trim()) {
      setForgotMessage({ type: "danger", text: "Please enter your registered admin email address." });
      return;
    }
    setForgotLoading(true);
    setForgotMessage(null);
    try {
      const res = await axios.post(
        `${apiBaseUrl}/api/v1/admin/forgot-password`,
        { email: forgotEmail.trim() }
      );
      setForgotMessage({
        type: "success",
        text: res.data?.message || "A new password has been sent to your admin email. Please check your inbox and log in.",
      });
    } catch (err) {
      setForgotMessage({
        type: "danger",
        text: err.response?.data?.message || "Failed to reset password. Please check your email and try again.",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [token, navigate]);

  const handleGoogleLogin = async (credentialResponse) => {
    setLoading(true);
    try {
      const { credential } = credentialResponse;
      const decoded = jwtDecode(credential);
      if (!decoded.email) throw new Error("Google profile email is required");

      const res = await axios.post(
        `${apiBaseUrl}/api/v1/admin/google-login`,
        { credential },
        { withCredentials: true }
      );

      const admin = res.data?.data?.admin;
      const accessToken = res.data?.data?.accessToken;
      if (!admin || !accessToken) throw new Error("Admin login failed: Missing admin or token");

      loginAdmin(admin, accessToken);
      navigate("/admin/dashboard", { state: admin });
    } catch (err) {
      console.error("Admin login failed:", err);
      alert("Admin login failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        `${apiBaseUrl}/api/v1/admin/login`,
        form,
        { withCredentials: true }
      );

      const admin = res.data?.data?.admin;
      const accessToken = res.data?.data?.accessToken;
      if (!admin || !accessToken) throw new Error("Admin login failed: Missing admin or token");

      loginAdmin(admin, accessToken);
      navigate("/admin/dashboard", { state: admin });
    } catch (err) {
      console.error("Admin login failed:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  const [errorMsg, setErrorMsg] = useState("");

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
      <div className="card shadow-lg rounded-4 border-0" style={{ width: "100%", maxWidth: "440px" }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="d-inline-flex p-3 rounded-4 bg-primary bg-opacity-10 text-primary fs-3 mb-3">
              ⚡
            </div>
            <h3 className="fw-bold text-dark mb-1">Karigar Admin</h3>
            <p className="text-muted small mb-0">Sign in with an authorized administrator account to access management tools.</p>
          </div>

          {errorMsg && (
            <div className="alert alert-danger alert-dismissible fade show small py-2 px-3 mb-3" role="alert">
              <span>{errorMsg}</span>
              <button type="button" className="btn-close p-2" onClick={() => setErrorMsg("")}></button>
            </div>
          )}

          <div className="d-flex p-1 bg-light rounded-pill border justify-content-center mb-4">
            <button
              type="button"
              className={`btn btn-sm rounded-pill w-50 fw-semibold ${authMode === "google" ? "btn-primary shadow-sm" : "text-muted"}`}
              onClick={() => { setAuthMode("google"); setErrorMsg(""); }}
            >
              Google Login
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill w-50 fw-semibold ${authMode === "email" ? "btn-primary shadow-sm" : "text-muted"}`}
              onClick={() => { setAuthMode("email"); setErrorMsg(""); }}
            >
              Email & Password
            </button>
          </div>

          {authMode === "google" ? (
            <div className="d-flex justify-content-center py-2">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => setErrorMsg("Google authentication failed. Please try again.")}
                theme="filled_blue"
                size="large"
                width={340}
              />
            </div>
          ) : (
            <form onSubmit={handleEmailLogin}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Admin Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="admin@example.com"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label small fw-semibold text-muted mb-0">Password</label>
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 text-decoration-none"
                    style={{ fontSize: "0.85rem" }}
                    onClick={() => {
                      setForgotEmail(form.email || "");
                      setForgotMessage(null);
                      setShowForgotModal(true);
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
                {loading ? "Signing in..." : "Sign in to Dashboard"}
              </button>
            </form>
          )}

          <div className="mt-4 pt-3 border-top text-center text-muted small" style={{ fontSize: "11px" }}>
            Access is restricted to authorized platform administrators.
          </div>
          <div className="mt-2 text-center">
            <Link to="/admin/request-access" className="text-decoration-none small fw-semibold">
              Need access? Submit an elevation request &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 p-2">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Reset Admin Password</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowForgotModal(false)}
                ></button>
              </div>
              <form onSubmit={handleForgotPassword}>
                <div className="modal-body py-3">
                  <p className="text-muted small mb-3">
                    Enter the email address registered with your Karigar Administrator account. We will generate and email you a new login password.
                  </p>

                  {forgotMessage && (
                    <div
                      className={`alert alert-${forgotMessage.type} small py-2 px-3 mb-3`}
                      role="alert"
                    >
                      {forgotMessage.text}
                    </div>
                  )}

                  <div className="mb-2">
                    <label className="form-label small fw-semibold">Registered Admin Email</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. admin@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0 d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-3"
                    onClick={() => setShowForgotModal(false)}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm px-4"
                    disabled={forgotLoading || !forgotEmail}
                  >
                    {forgotLoading ? "Sending Password..." : "Send New Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {loading && <Spinner />}
    </div>
  );
};

export default Signin_admin;
