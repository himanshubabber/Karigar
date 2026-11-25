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

  const apiBaseUrl = import.meta.env.VITE_API_URL || "https://karigarbackend.vercel.app";

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
                <label className="form-label small fw-semibold text-muted">Password</label>
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
      {loading && <Spinner />}
    </div>
  );
};

export default Signin_admin;
