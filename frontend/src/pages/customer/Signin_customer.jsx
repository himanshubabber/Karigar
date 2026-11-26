import { useState } from "react";
import api from "../../api.js";
import { useNavigate } from "react-router-dom";
import { useCustomer } from "../../Context/Customer_context";
import Spinner from "../../components/Style/Spinner.jsx";
import { GoogleLogin } from "@react-oauth/google";
import {jwtDecode} from "jwt-decode";

const Signin_customer = () => {
  const navigate = useNavigate();
  const { loginCustomer } = useCustomer();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

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
      const res = await api.post("/api/v1/customer/forgot-password", { email: forgotEmail.trim() });
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
    console.log(e);

    try {
      const res = await api.post("/api/v1/customer/login", form, {
        withCredentials: true,
      });

      const customer = res.data?.data?.customer;
      const accessToken = res.data?.data?.accessToken;

      if (!customer || !accessToken) {
        throw new Error("Login failed: Missing customer or token in response");
      }

      // ✅ Only this line added to store token
      localStorage.setItem("karigar_customer_token", accessToken);

      loginCustomer(customer, accessToken);

      alert("Login successful!");
      navigate("/customer", { state: customer });
    } catch (Error) {
      console.error("Login failed:", Error.response.data.message);
      alert("Login failed: " + (Error.response?.data?.message || Error.message));
    }
    finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setLoading(true);
    try {
      const { credential } = credentialResponse;
      const decoded = jwtDecode(credential);
      console.log("Decoded Google Profile:", decoded);

      if (!decoded.email) throw new Error("Google profile with email is required");

      const res = await api.post(
        "/api/v1/customer/google-login",
        { credential },
        { withCredentials: true }
      );

      const customer = res.data?.data?.customer;
      const accessToken = res.data?.data?.accessToken;

      if (!customer || !accessToken)
        throw new Error("Google login failed: Missing customer or token");

      localStorage.setItem("karigar_customer_token", accessToken);
      loginCustomer(customer, accessToken);

      alert("Google login successful!");
      navigate("/customer", { state: customer });
    } catch (err) {
      console.error("Google login failed:", err);
      alert("Google login failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light py-4 px-2 px-sm-3">
      <div className="card shadow rounded-4 border-0" style={{ width: "100%", maxWidth: "420px" }}>
        <div className="card-body p-3 p-sm-4">
          <h3 className="text-center mb-4 fw-bold text-dark">Customer Login</h3>
          <form onSubmit={handleSubmit}>
            {["email", "password"].map((field, idx) => (
              <div className="mb-3" key={idx}>
                <div className="d-flex justify-content-between align-items-center">
                  <label className="form-label mb-1">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  {field === "password" && (
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
                  )}
                </div>
                <input
                  type={field === "password" ? "password" : "email"}
                  name={field}
                  className="form-control"
                  value={form[field]}
                  onChange={handleChange}
                />
              </div>
            ))}

            <p className="mt-3 text-center">
              Don't have an account?{" "}
              <span
                style={{ color: "#007bff", cursor: "pointer", textDecoration: "underline" }}
                onClick={() => navigate("/signup_customer")}
              >
                Sign up
              </span>
            </p>

            <button type="submit" className="btn btn-primary w-100">
              Sign In
            </button>

            <p className="text-center mt-3 mb-2">Or</p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                maxWidth: "100%",
                margin: "1rem auto",
              }}
            >
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => console.log("Google login failed")}
                theme="filled_blue"
                size="large"
                width={380}
              />
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
                <h5 className="modal-title fw-bold">Reset Your Password</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowForgotModal(false)}
                ></button>
              </div>
              <form onSubmit={handleForgotPassword}>
                <div className="modal-body py-3">
                  <p className="text-muted small mb-3">
                    Enter the email address registered with your Karigar account. We will generate and email you a new login password.
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
                      placeholder="e.g. user@example.com"
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

      {loading && <Spinner/>}
    </div>
  );
};

export default Signin_customer;
