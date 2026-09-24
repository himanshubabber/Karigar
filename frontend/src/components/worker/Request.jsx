import React, { useState ,useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { useServiceReq } from "../../Context/Service_req_context";
import api from "../../api.js";
import { FaMapMarkerAlt, FaUser, FaWrench, FaRupeeSign } from "react-icons/fa";
import Spinner from "../../components/Style/Spinner.jsx"
import {useWorker} from "../../Context/Worker_context.jsx"


const Request = ({ request, distanceKm }) => {
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
    quoteAmount,
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
            }
          );

          const fullDetails = await api.post(
            "/api/v1/serviceRequest/get-service-details",
            { serviceRequestId: _id }
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
      className="card shadow-sm mb-4 p-3 p-sm-4 w-100 border-0"
      style={{
        borderRadius: "14px",
        maxWidth: "420px",
        backgroundColor: "#ffffff",
        boxShadow: "0 4px 18px rgba(0, 0, 0, 0.06)",
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="fw-bold text-capitalize mb-0 d-flex align-items-center text-dark">
          <FaWrench className="me-2 text-primary" /> {category.toLowerCase()}
        </h5>
        {distanceKm != null && (
          <span className="badge bg-light text-primary border border-primary-subtle px-2 py-1 small">
            {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} Km`}
          </span>
        )}
      </div>

      <div className="small text-muted mb-2">
        <FaUser className="me-2 text-secondary" />
        <strong>Customer:</strong> {customerId?.fullName || "Unknown"}
      </div>

      <div className="small text-muted mb-2 text-break">
        <FaMapMarkerAlt className="me-2 text-danger flex-shrink-0" />
        <strong>Location:</strong> {address || "Locating..."}
      </div>

      <div className="small mb-2 text-break">
        <strong>Issue:</strong> {description}
      </div>

      <div className="d-flex flex-wrap gap-3 py-1 mb-2 border-top border-bottom">
        <div className="small">
          <FaRupeeSign className="me-1 text-success" />
          <strong>Visiting:</strong> ₹{visitingCharge}
        </div>
        {quoteAmount != null && (
          <div className="small">
            <FaRupeeSign className="me-1 text-primary" />
            <strong>Quote:</strong> ₹{quoteAmount}
          </div>
        )}
      </div>

      <div className="small text-muted mb-1">
        <strong>Status:</strong> <span className="badge bg-secondary-subtle text-dark">{orderStatus}</span> | <span className="badge bg-info-subtle text-dark">{jobStatus}</span>
      </div>
      <div className="small text-muted mb-2">
        <strong>Created:</strong> {new Date(createdAt).toLocaleString()}
      </div>

      {audioNoteUrl && (
        <audio controls className="w-100 mt-2 mb-2">
          <source src={audioNoteUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}

      {!accepted ? (
        <button 
          className="btn btn-success mt-3 w-100 py-2 fw-semibold d-flex justify-content-center align-items-center" 
          style={{ minHeight: "44px", borderRadius: "8px" }} 
          onClick={handleAccept}
          disabled={loading}
        >
          Accept Request
        </button>
      ) : (
        <button
          className="btn btn-primary mt-3 w-100 py-2 fw-semibold"
          style={{ minHeight: "44px", borderRadius: "8px" }}
          disabled
        >
          Accepted
        </button>
      )}
      {loading && <Spinner/>}
    </div>
  );
};

export default Request;
