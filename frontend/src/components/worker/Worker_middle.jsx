import React, { useEffect } from "react";
import { MdOutlineEdit, MdVerifiedUser } from "react-icons/md";
import { FaWallet, FaStar, FaCalendarAlt } from "react-icons/fa";
import { IoIosInformationCircle } from "react-icons/io";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../../api.js";
import { useState } from "react";
import { useWorker } from "../../Context/Worker_context";

const Worker_middle = ({ isOnline, setIsOnline, worker }) => {
  const navigate = useNavigate();
  const [NewWorker,SetNewWorker]=useState(worker);
  
  const { token, logoutWorker } = useWorker();
  const [suspended, setSuspended] = useState(false);

  useEffect(() => {
    if (NewWorker === null) return; // wait for data to load
    if (!NewWorker?.fullName) {
      navigate("/signin");
    }
  }, [NewWorker, navigate]);

  useEffect(() => {
    if (NewWorker?.suspendedUntil) {
      const now = new Date();
      const suspendUntilDate = new Date(NewWorker.suspendedUntil);
      if (suspendUntilDate > now) {
        setSuspended(true);
        setIsOnline(false); 
      } else {
        setSuspended(false);
      }
    } else {
      setSuspended(false);
    }
  }, [NewWorker, setIsOnline]);
  
   
  const toggleOnlineStatus = () => {
    if (suspended) {
      alert(
        `You are suspended until ${new Date(NewWorker.suspendUntil).toLocaleString()}. You cannot go online.`
      );
      return;
    }
    setIsOnline((prev) => !prev);
  };


  useEffect(() => {
    const fetchWorkerInfo = async () => {
      try {
        const workerId = worker?._id;
        if (!workerId) {
          console.error("No worker ID found in localStorage");
          return;
        }
        const res = await api.post(
          "/api/v1/worker/worker-info",
          { _id: workerId }
        );
        SetNewWorker(res.data.data);
      } catch (err) {
        console.error("Failed to fetch worker info:", err);
      }
    };

    fetchWorkerInfo();
  });
  

  useEffect(() => {
    if (isOnline) {
      const watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          console.log(pos);
          try {
            await api.post("/api/v1/worker/update-location", {
              coordinates: [longitude, latitude],
            },
            { withCredentials: true },
          );
          } catch (err) {
            console.error("Location update failed", err);
          }
        },
        (err) => {
          console.error("Location error:", err);
        },
        { enableHighAccuracy: true }
      );
  
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isOnline]);


  const handleLogout = async () => {
    try {
      const res = await api.post("/api/v1/worker/logout", null, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      console.log(res);
  
      if (res.status === 200 || res.data?.success) {
        logoutWorker();
        localStorage.removeItem("token");
        localStorage.removeItem("worker");
        navigate("/signin", { replace: true });
      } else {
        alert(`Logout failed: ${res.statusText}`);
      }
    } catch (err) {
      console.error("Logout error:", err);
      alert(err?.response?.data?.message || "An error occurred during logout.");
    }
  };
  

  //  console.log("new worker",NewWorker);

  if (!NewWorker) {
    return (
      <div className="container text-center mt-5">
        <h4>Loading worker data...</h4>
      </div>
    );
  }

  return (
    <div className="container py-2 py-md-3">
      <div className="row g-3 g-md-4 align-items-stretch">
        {/* Left Card */}
        <div className="col-lg-8 col-md-7 mb-3 mb-md-0 d-flex flex-column">
          <div
            className="card border-0 shadow-sm p-4 p-md-4 h-100 d-flex flex-column justify-content-between"
            style={{ borderRadius: "16px", backgroundColor: "#fff", minHeight: "420px" }}
          >
            {/* Top Bar inside card */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span
                className={`badge ${isOnline ? "bg-success" : "bg-danger"} fs-6 px-3 py-2 rounded-pill fw-semibold`}
              >
                {isOnline ? "● Online" : "○ Offline"}
              </span>
              <button
                className="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "36px", height: "36px" }}
                title="Edit Profile"
                onClick={() => navigate("/edit_worker", { state: NewWorker })}
              >
                <MdOutlineEdit size={20} />
              </button>
            </div>

            {/* Profile Info */}
            <div className="d-flex flex-column flex-sm-row align-items-center align-items-sm-start text-center text-sm-start gap-3 mb-3">
              <div
                className="flex-shrink-0 shadow-sm"
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "3px solid #f1f3f5",
                }}
              >
                <img
                  src={
                    NewWorker?.profilePhoto ||
                    "https://thumbs.dreamstime.com/b/profile-picture-caucasian-male-employee-posing-office-happy-young-worker-look-camera-workplace-headshot-portrait-smiling-190186649.jpg"
                  }
                  alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div className="flex-grow-1">
                <h4 className="fw-bold mb-2 text-dark">{NewWorker.fullName}</h4>
                <p className="text-muted small mb-1 text-break">
                  <i className="bi bi-envelope me-2 text-primary"></i>{NewWorker.email}
                </p>
                <p className="text-muted small mb-1">
                  <i className="bi bi-telephone me-2 text-primary"></i>{NewWorker.phone}
                </p>
                <p className="text-muted small mb-0">
                  <i className="bi bi-geo-alt me-2 text-primary"></i>{NewWorker.address}
                </p>
              </div>
            </div>

            {/* Working Categories */}
            <div className="my-3 pt-3 border-top">
              <h6 className="fw-bold text-dark mb-2">Working Categories:</h6>
              <div className="d-flex flex-wrap gap-2">
                {NewWorker.workingCategory?.map((cat, idx) => (
                  <span
                    key={idx}
                    className="badge rounded-pill px-3 py-2"
                    style={{
                      backgroundColor: "#e7f1ff",
                      color: "#0d6efd",
                      border: "1px solid #b6d4fe",
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      textTransform: "capitalize",
                    }}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="d-flex justify-content-between align-items-center pt-3 mt-auto border-top flex-wrap gap-2">
              <button
                onClick={handleLogout}
                className="btn btn-outline-danger fw-semibold d-flex align-items-center px-3 py-2 rounded-pill"
              >
                <FiLogOut className="me-2" size={16} />
                Logout
              </button>

              <div className="d-flex gap-2">
                <button
                  onClick={toggleOnlineStatus}
                  className="btn fw-semibold px-3 py-2 rounded-pill"
                  disabled={suspended}
                  style={{
                    backgroundColor: isOnline ? "#dc3545" : "#198754",
                    color: "#fff",
                    border: "none",
                    opacity: suspended ? 0.6 : 1,
                    cursor: suspended ? "not-allowed" : "pointer",
                  }}
                  title={suspended ? "You cannot go online while suspended" : ""}
                >
                  {isOnline ? "Go Offline" : "Go Online"}
                </button>

                <button
                  className="btn btn-primary fw-semibold px-4 py-2 rounded-pill"
                  onClick={() => navigate("/history_worker")}
                >
                  History
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Cards */}
        <div className="col-lg-4 col-md-5 d-flex flex-column gap-3">
          {/* Wallet Card */}
          <div className="card border-0 shadow-sm text-center" style={{ borderRadius: "16px", backgroundColor: "#fff" }}>
            <div className="card-body p-3 p-md-4 d-flex flex-column align-items-center justify-content-center">
              <div
                className="d-flex align-items-center justify-content-center mb-2"
                style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: "#e8f5e9" }}
              >
                <FaWallet size={22} className="text-success" />
              </div>
              <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: "0.5px" }}>
                Wallet Balance
              </span>
              <h3 className="fw-bold text-success mb-0 mt-1">₹ {NewWorker.walletBalance || 0}</h3>
            </div>
          </div>

          {/* Worker Info Card */}
          <div className="card border-0 shadow-sm flex-grow-1 d-flex flex-column" style={{ borderRadius: "16px", backgroundColor: "#fff", minHeight: "260px" }}>
            <div className="card-body p-3 p-md-4 d-flex flex-column">
              <h5 className="fw-bold mb-3 pb-2 border-bottom d-flex align-items-center text-dark">
                <IoIosInformationCircle size={22} className="me-2 text-primary" />
                Worker Info
              </h5>
              <div className="d-flex flex-column gap-2 my-auto">
                <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                  <span className="text-muted fw-medium small d-flex align-items-center">
                    <FaStar className="me-2 text-warning" /> Rating
                  </span>
                  <span className="badge bg-warning text-dark px-3 py-1 fs-6 fw-bold">
                    {NewWorker.rating !== undefined && NewWorker.rating !== null
                      ? Number(NewWorker.rating).toFixed(2)
                      : "N/A"} ★
                  </span>
                </div>

                <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                  <span className="text-muted fw-medium small d-flex align-items-center">
                    <FaCalendarAlt className="me-2 text-primary" /> Experience
                  </span>
                  <span className="fw-bold text-dark small">
                    {NewWorker.yearOfExperience || 0} yrs
                  </span>
                </div>

                <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                  <span className="text-muted fw-medium small d-flex align-items-center">
                    <MdVerifiedUser className="me-2 text-primary" /> Verified
                  </span>
                  <span className={NewWorker.isVerified ? "badge bg-success text-white px-2 py-1 small fw-bold" : "badge bg-danger text-white px-2 py-1 small fw-bold"}>
                    {NewWorker.isVerified ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Worker_middle;
