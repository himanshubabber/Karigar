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
      const res = await api.post("/api/v1/customer/login", form);

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

      const res = await api.post("/api/v1/customer/google-login", { credential });

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
    <div className="d-flex justify-content-center align-items-center min-vh-100 py-4 py-sm-5 px-3 bg-light">
      <div className="card shadow-sm border-0 w-100" style={{ maxWidth: "28rem", borderRadius: "14px", backgroundColor: "#ffffff" }}>
        <div className="card-body p-3 p-sm-4">
          <h3 className="text-center mb-4 fw-bold text-dark">Customer Login</h3>
          <form onSubmit={handleSubmit}>
            {["email", "password"].map((field, idx) => (
              <div className="mb-3" key={idx}>
                <label className="form-label fw-semibold">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type={field === "password" ? "password" : "email"}
                  name={field}
                  className="form-control"
                  value={form[field]}
                  onChange={handleChange}
                  placeholder={`Enter your ${field}`}
                  required
                />
              </div>
            ))}

            <p className="mt-3 text-center small text-muted">
              Don't have an account?{" "}
              <span
                style={{ color: "#007bff", cursor: "pointer", textDecoration: "underline", fontWeight: "600" }}
                onClick={() => navigate("/signup_customer")}
              >
                 Sign up 
              </span>
            </p>

            <button
              type="submit"
              className="btn btn-primary w-100 fw-semibold py-2"
              style={{ minHeight: "44px", borderRadius: "8px" }}
            >
              Sign In
            </button>

            <div className="text-center my-3 text-muted small">Or continue with</div>

            <div className="w-100 d-flex justify-content-center overflow-hidden">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => console.log("Google login failed")}
                theme="filled_blue"
                size="large"
                shape="pill"
              />
            </div>
          </form>
        </div>
      </div>
      {loading && <Spinner/>}
    </div>
  );
};

export default Signin_customer;
