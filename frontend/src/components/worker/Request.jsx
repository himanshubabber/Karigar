import React, { useState ,useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { useServiceReq } from "../../Context/Service_req_context";
import axios from "axios";
import api from "../../api.js";
import { FaMapMarkerAlt, FaUser, FaWrench, FaRupeeSign } from "react-icons/fa";
import Spinner from "../../components/Style/Spinner.jsx"
import {useWorker} from "../../Context/Worker_context.jsx"


const Request = ({ request }) => {
  const { token } = useWorker();
  const navigate = useNavigate();
  const { updateSelectedReq } = useServiceReq();
  const [accepted, setAccepted] = useState(false);
  const [loading,setLoading]=useState(false);
  const [address, setAddress] = useState("");

  const {
    _id,
    category,
    description,
    audioNoteUrl,
    customerId,
    customerLocation,
    orderStatus,
    jobStatus,
    visitingCharge,
    createdAt,
  } = request;


  useEffect(() => {
    async function fetchAddress() {
      if (customerLocation?.coordinates?.length === 2) {
        const [lng, lat] = customerLocation.coordinates; // [lng, lat]
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          setAddress(data.display_name || "");
        } catch (err) {
          console.error("Reverse geocode error:", err);
          setAddress("");
        }
      }
    }

    fetchAddress();
  }, [customerLocation]);

  const handleAccept = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser");
      return;
    }
   setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await api.post(
            "/api/v1/serviceRequest/accept",
            { 
              serviceRequestId: _id,
              coordinates: [longitude, latitude],
            },
            { 
             headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
            }
          );

          const fullDetails = await api.post(
            "/api/v1/serviceRequest/get-service-details",
            { serviceRequestId: _id },
            { withCredentials: true }
          );

          const fetchedRequest = fullDetails?.data?.data?.serviceRequest;
          updateSelectedReq(fetchedRequest);

          localStorage.setItem("serviceRequestId", _id);
          localStorage.setItem("serviceRequestData", JSON.stringify(fetchedRequest));

          setAccepted(true);
          navigate("/location_worker");
        } catch (err) {
          console.error("Accept error:", err);
          alert("Failed to accept the request.");
        }
        finally{
          setLoading(false);
        }
      },
      (err) => {
        console.error("Location error:", err);
        alert("Location access denied or failed.");
      }
     
    );
  };

  return (
    <div
      className="card border-0 shadow-sm p-3 p-sm-4 w-100 d-flex flex-column justify-content-between h-100"
      style={{ borderRadius: "16px", backgroundColor: "#fff" }}
    >
      <div>
        {/* Header: Category Badge & Status */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span
            className="badge rounded-pill px-3 py-2 text-capitalize fw-bold d-flex align-items-center"
            style={{
              backgroundColor: "#e7f1ff",
              color: "#0d6efd",
              border: "1px solid #b6d4fe",
              fontSize: "0.95rem",
            }}
          >
            <FaWrench className="me-2" />
            {category?.toLowerCase() || "Service"}
          </span>
          <span className="badge bg-light text-muted border px-2 py-1 small text-capitalize">
            {orderStatus} | {jobStatus}
          </span>
        </div>

        {/* Customer Profile Block */}
        <div className="d-flex align-items-center gap-3 mb-3 p-2 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
          <div
            className="flex-shrink-0 shadow-sm"
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid #fff",
            }}
          >
            <img
              src={
                customerId?.profilePhoto && customerId.profilePhoto.trim() !== ""
                  ? customerId.profilePhoto
                  : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt={customerId?.fullName || "Customer"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
              }}
            />
          </div>
          <div className="flex-grow-1 min-w-0">
            <span className="text-muted d-block fw-semibold text-uppercase" style={{ fontSize: "0.72rem", letterSpacing: "0.5px" }}>Customer</span>
            <h6 className="fw-bold text-dark mb-0 text-truncate">{customerId?.fullName || "Customer"}</h6>
            {customerId?.phone && (
              <span className="text-muted small d-block">
                <i className="bi bi-telephone me-1 text-primary"></i>{customerId.phone}
              </span>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="d-flex align-items-start mb-2 px-1">
          <div
            className="bg-danger bg-opacity-10 text-danger p-2 rounded-circle me-2 d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
            style={{ width: "30px", height: "30px" }}
          >
            <FaMapMarkerAlt size={13} />
          </div>
          <div className="flex-grow-1">
            <span className="text-muted d-block fw-semibold" style={{ fontSize: "0.75rem" }}>LOCATION</span>
            <span className="text-dark small text-break">{address || "Fetching address..."}</span>
          </div>
        </div>

        {/* Visiting Charge */}
        <p className="mb-3 d-flex align-items-center text-dark px-1">
          <FaRupeeSign className="me-2 text-success" /> <strong>Visiting Charge:</strong>&nbsp;₹{visitingCharge}
        </p>

        {/* Issue Description Box */}
        <div
          className="p-3 rounded-3 mb-3"
          style={{ backgroundColor: "#f8f9fa", borderLeft: "4px solid #0d6efd" }}
        >
          <span className="text-muted small fw-semibold d-block mb-1">Issue Description</span>
          <p className="mb-0 text-dark small" style={{ whiteSpace: "pre-wrap" }}>
            {description || "No description provided"}
          </p>
        </div>

        {/* Voice Note */}
        {audioNoteUrl && (
          <div className="mb-3">
            <span className="text-muted small fw-semibold d-block mb-1">
              <i className="bi bi-mic me-1 text-primary"></i> Voice Note
            </span>
            <audio controls className="w-100 rounded-3">
              <source src={audioNoteUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>

      {/* Footer Meta & Accept Button */}
      <div className="pt-3 border-top mt-auto d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="text-muted small">
          <i className="bi bi-clock me-1"></i>
          {new Date(createdAt).toLocaleDateString()} · {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>

        {!accepted ? (
          <button
            className="btn btn-success fw-semibold px-4 py-2 rounded-pill shadow-sm"
            onClick={handleAccept}
          >
            Accept Request
          </button>
        ) : (
          <button className="btn btn-primary fw-semibold px-4 py-2 rounded-pill" disabled>
            ✓ Accepted
          </button>
        )}
      </div>

      {loading && <Spinner />}
    </div>
  );
};

export default Request;
