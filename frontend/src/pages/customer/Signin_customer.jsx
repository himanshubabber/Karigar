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
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light py-4 py-md-0">
      <div className="card shadow" style={{ width: "28rem", maxWidth: "94vw" }}>
        <div className="card-body p-4">
          <h3 className="text-center mb-4">Customer Login</h3>
          <form onSubmit={handleSubmit}>
            {["email", "password"].map((field, idx) => (
              <div className="mb-3" key={idx}>
                <label className="form-label">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
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
      {loading && <Spinner/>}
    </div>
  );
};

export default Signin_customer;
