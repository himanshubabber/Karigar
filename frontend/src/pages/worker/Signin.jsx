import { useState } from "react";
import axios from "axios";
import api from "../../api.js";
import { useNavigate } from "react-router-dom";
import { useWorker } from "../../Context/Worker_context";
import Spinner from "../../components/Style/Spinner.jsx";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";



const Signin_worker = () => {
  const navigate = useNavigate();
  const { loginWorker } = useWorker();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState(null);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.trim()) {
      setForgotMessage({ type: "danger", text: "Please enter your registered email address." });
      return;
    }
    setForgotLoading(true);
    setForgotMessage(null);
    try {
      const res = await api.post("/api/v1/worker/forgot-password", { email: forgotEmail.trim() });
      setForgotMessage({
        type: "success",
        text: res.data?.message || "A new password has been sent to your email. Please check your inbox and log in.",
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

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      alert("Both fields are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/api/v1/worker/login", form, {
        withCredentials: true,
      });

      const worker = res.data?.data?.worker;
      const accessToken = res.data?.data?.accessToken;

      if (!worker || !accessToken) {
        throw new Error("Login failed: Missing worker or token");
      }

      loginWorker(worker, accessToken);
      alert("Login successful!");
      navigate("/worker", { state: worker });
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setLoading(true);
    try {
      const { credential } = credentialResponse;
      const decoded = jwtDecode(credential); // decode JWT
      console.log("Decoded Google Profile:", decoded);

      if (!decoded.email) throw new Error("Google profile with email is required");

      const res = await api.post(
        "/api/v1/worker/google-login",
        { credential },
        { withCredentials: true }
      );

      const worker = res.data?.data?.worker;
      const accessToken = res.data?.data?.accessToken;

      if (!worker || !accessToken) throw new Error("Google login failed: Missing worker or token");

      localStorage.setItem("workerId", worker._id);
      localStorage.setItem("accessToken", accessToken);

      loginWorker(worker, accessToken);
      alert("Google login successful!");
      navigate("/worker", { state: worker });
    } catch (err) {
      console.error("Login Failed:", err);
      alert("Google login failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  return ( 
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
     
      <div className="card shadow" style={{ width: "28rem" }}>
        <div className="card-body">
          <h3 className="text-center mb-4"
          >Worker Login</h3>


          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <label className="form-label mb-1">Password</label>
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
                name="password"
                className="form-control"
                value={form.password}
                onChange={handleChange}
              />
            </div>
            <p className="mt-3 text-center">
              Don't have an account?{" "}
              <span
                style={{ color: "#007bff", cursor: "pointer", textDecoration: "underline" }}
                onClick={() => navigate("/signup_worker")}
              >
                Sign up
              </span>
            </p>
            <button type="submit" className="btn btn-primary w-100">
              Sign In
            </button>

            <p></p>
            <p style={{textAlign:"center"}}>Or</p>

            <div
  style={{
    display: "flex",           // enable flex
    justifyContent: "center",  // center horizontally
    width: "28rem",            // match your card width
    maxWidth: "100%",          // responsive on smaller screens
    margin: "1rem auto",       // center container in page
  }}
>
    <GoogleLogin
      onSuccess={handleGoogleLogin}
      onError={() => console.log("Google login failed")}
      theme="filled_blue"
      size="large"
      width={448} // max width allowed
    ></GoogleLogin>
    </div>
          </form>
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
                <h5 className="modal-title fw-bold">Reset Worker Password</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowForgotModal(false)}
                ></button>
              </div>
              <form onSubmit={handleForgotPassword}>
                <div className="modal-body py-3">
                  <p className="text-muted small mb-3">
                    Enter the email address registered with your Karigar Worker account. We will generate and email you a new login password.
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
                    <label className="form-label small fw-semibold">Registered Email</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. worker@example.com"
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

      {loading && (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(255, 255, 255, 0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
        }}
      >
        <Spinner />
      </div>
    )}
    </div>
  );
};

export default Signin_worker;
