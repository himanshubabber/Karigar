import React, { useEffect } from "react";
import { MdOutlineEdit, MdVerifiedUser } from "react-icons/md";
import { FaWallet, FaStar, FaCalendarAlt } from "react-icons/fa";
import { IoIosInformationCircle } from "react-icons/io";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
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
            });
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
    <div className="container-fluid container-md py-3 py-sm-4 px-2 px-sm-3">
      <div className="row g-3 g-md-4 align-items-stretch">
        {/* Left Card */}
        <div className="col-12 col-md-8">
          <div
            className="card p-3 p-sm-4 shadow-sm h-100 border-0 d-flex flex-column"
            style={{ borderRadius: "14px", backgroundColor: "#ffffff" }}
          >
            {/* Top Bar with Online Badge & Edit Profile */}
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <span
                className={`badge ${isOnline ? "bg-success" : "bg-danger"} fs-6 px-3 py-2 rounded-pill`}
              >
                {isOnline ? "Online" : "Offline"}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-3 py-1"
                onClick={() => navigate("/edit_worker", { state: NewWorker })}
                title="Edit Profile"
              >
                <MdOutlineEdit size={18} />
                <span>Edit Profile</span>
              </button>
            </div>

            {/* Profile Info Section */}
            <div className="d-flex flex-column flex-sm-row align-items-center align-items-sm-start text-center text-sm-start mb-4 gap-3">
              <div
                style={{
                  width: "110px",
                  height: "110px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "3px solid #e9ecef",
                  flexShrink: 0,
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
              <div className="w-100 overflow-hidden">
                <h3 className="fw-bold mb-1 fs-4 text-dark text-break">{NewWorker.fullName}</h3>
                <p className="text-muted fs-6 mb-1 text-break">{NewWorker.email}</p>
                <p className="text-muted fs-6 mb-1 text-break">{NewWorker.phone}</p>
                <p className="text-muted fs-6 mb-0 text-break">{NewWorker.address}</p>
              </div>
            </div>

            {/* Working Categories Header & Go Online Button */}
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h5 className="fw-bold fs-6 mb-0 text-dark">Working Categories:</h5>
              <button
                onClick={toggleOnlineStatus}
                className="btn fw-semibold"
                disabled={suspended}
                style={{
                  borderRadius: "20px",
                  padding: "6px 18px",
                  backgroundColor: isOnline ? "#dc3545" : "#198754",
                  color: "#fff",
                  border: `2px solid ${isOnline ? "#dc3545" : "#198754"}`,
                  opacity: suspended ? 0.6 : 1,
                  cursor: suspended ? "not-allowed" : "pointer",
                  minHeight: "40px",
                }}
                title={suspended ? "You cannot go online while suspended" : ""}
              >
                {isOnline ? "Go Offline" : "Go Online"}
              </button>
            </div>

            {/* Categories */}
            <div className="d-flex flex-wrap gap-2 mb-4">
              {NewWorker.workingCategory?.length > 0 ? (
                NewWorker.workingCategory.map((cat, idx) => (
                  <span
                    key={idx}
                    className="badge bg-primary-subtle text-primary border border-primary-subtle"
                    style={{
                      textTransform: "capitalize",
                      fontSize: "0.9rem",
                      padding: "0.5rem 1rem",
                      borderRadius: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {cat}
                  </span>
                ))
              ) : (
                <span className="text-muted small">No categories added</span>
              )}
            </div>

            {/* Logout & History */}
            <div className="d-flex justify-content-between align-items-center mt-auto pt-3 border-top gap-2">
              <button
                onClick={handleLogout}
                className="btn btn-outline-danger fw-semibold d-flex align-items-center rounded-pill px-3 py-2"
                style={{ minHeight: "40px" }}
              >
                <FiLogOut className="me-2" size={17} />
                Logout
              </button>

              <button
                className="btn btn-outline-primary fw-semibold rounded-pill px-4 py-2"
                style={{ minHeight: "40px" }}
                onClick={() => navigate("/history_worker")}
              >
                History
              </button>
            </div>
          </div>
        </div>

        {/* Right Cards */}
        <div className="col-12 col-md-4 d-flex flex-column gap-3">
          <div
            className="card text-center shadow-sm flex-fill border-0"
            style={{ borderRadius: "14px", backgroundColor: "#ffffff" }}
          >
            <div className="card-body p-3 p-sm-4 d-flex flex-column justify-content-center">
              <h5 className="fw-bold mb-2 text-dark">
                <FaWallet size={22} className="me-2 text-primary" /> Wallet
              </h5>
              <p className="fs-3 fw-bold text-success mb-0">₹ {NewWorker.walletBalance || 0}</p>
            </div>
          </div>

          <div
            className="card text-center shadow-sm flex-fill border-0"
            style={{ borderRadius: "14px", backgroundColor: "#ffffff" }}
          >
            <div className="card-body p-3 p-sm-4 d-flex flex-column justify-content-center">
              <h5 className="fw-bold mb-3 text-dark">
                <IoIosInformationCircle size={22} className="me-2 text-primary" />
                Worker Info
              </h5>
              <div className="d-flex flex-column gap-2 text-start px-2">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted small">
                    <FaStar className="me-1 text-warning" /> Rating:
                  </span>
                  <span className="fw-semibold small">
                    {NewWorker.rating !== undefined && NewWorker.rating !== null
                      ? Number(NewWorker.rating).toFixed(2)
                      : "N/A"}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted small">
                    <FaCalendarAlt className="me-1 text-secondary" /> Experience:
                  </span>
                  <span className="fw-semibold small">{NewWorker.yearOfExperience || 0} yrs</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted small">
                    <MdVerifiedUser className="me-1 text-primary" /> Verified:
                  </span>
                  <span className={`fw-semibold small ${NewWorker.isVerified ? "text-success" : "text-danger"}`}>
                    {NewWorker.isVerified ? "✅ Yes" : "❌ No"}
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
