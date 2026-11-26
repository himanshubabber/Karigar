import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { IoIosInformationCircle } from "react-icons/io";
import { CgProfile } from "react-icons/cg";
import { FaHammer } from "react-icons/fa6";
import { MdOutlineDescription } from "react-icons/md";
import { MdNetworkWifi } from "react-icons/md";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { MdOutlineAccessTimeFilled } from "react-icons/md";
import { AiTwotoneAudio } from "react-icons/ai";
import { GiMultiDirections } from "react-icons/gi";
import { TiPin } from "react-icons/ti";
import { MdOutlineDirectionsRun } from "react-icons/md";
import { FiMapPin } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useServiceReq } from "../../Context/Service_req_context.jsx";
import {useWorker} from "../../Context/Worker_context.jsx"
import { useSocket } from "../../Context/SocketContext.jsx";
import axios from "axios";
import api from "../../api.js";
import Otp_timer from "../general/Otp_timer.jsx";




const sourceIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2202/2202112.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -30],
});

const manIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -30],
});

function Routing({ from, to }) {
  const map = useMap();

  useEffect(() => {
    if (
      !from || !to ||
      !Array.isArray(from) || !Array.isArray(to) ||
      from.length !== 2 || to.length !== 2 ||
      from.some(coord => typeof coord !== "number" || isNaN(coord)) ||
      to.some(coord => typeof coord !== "number" || isNaN(coord))
    ) return;

    const control = L.Routing.control({
      waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
      lineOptions: { styles: [{ color: "blue", weight: 5 }] },
      show: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      createMarker: () => null,
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
      }),
    }).addTo(map);

    return () => {
      if (control && map) {
        try {
          map.removeControl(control);
        } catch (e) {
          console.warn("Error removing routing control:", e);
        }
      }
    };
  }, [from, to, map]);

  return null;
}


function getBearingAndDistance(from, to) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const [lat1, lon1] = from;
  const [lat2, lon2] = to;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const R = 6371000; // meters
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  if (d < 10) {
    return {
      distance: 0,
      distanceText: "0 m",
      bearing: 0,
      time: 0,
    };
  }

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  let brng = toDeg(Math.atan2(y, x));
  brng = (brng + 360) % 360;

  const estimatedTimeMin = Math.round(d / 70);

  const distanceText = d >= 1000 ? `${(d / 1000).toFixed(2)} km` : `${Math.round(d)} m`;

  return {
    distance: Math.round(d),
    distanceText,
    bearing: Math.round(brng),
    time: estimatedTimeMin,
  };
}


const Location_map = () => {
  const { selectedReq: order, updateSelectedReq } = useServiceReq();
  const destination = order?.customerLocation?.coordinates
    ? [order.customerLocation.coordinates[1], order.customerLocation.coordinates[0]]
    : null;

  const [userPosition, setUserPosition] = useState(null);
  const [track, setTrack] = useState(false);
  const [address, setAddress] = useState("");
  const [showCancelOptions, setShowCancelOptions] = useState(false);
  const [otp, setOtp] = useState("");
  const [quoteAmount, setQuoteAmount] = useState(0);
  const [quoteMessage, setQuoteMessage] = useState(null);
  const [isLocated,setisLocated]= useState(false);
  const { token } = useWorker();
  const { socket, joinRequestRoom, leaveRequestRoom, emitWorkerLocation } = useSocket();

  const urlParams = new URLSearchParams(window.location.search);
  const queryServiceId = urlParams.get("serviceRequestId");
  const serviceRequestId = queryServiceId || order?._id || localStorage.getItem("serviceRequestId");

  const navigate = useNavigate();

  useEffect(() => {
    if (queryServiceId) {
      try {
        localStorage.setItem("serviceRequestId", queryServiceId);
      } catch (e) {
        console.error("Storage error:", e);
      }
    }
  }, [queryServiceId]);

  // Real-time WebSocket room subscription & event listeners for worker
  useEffect(() => {
    if (!serviceRequestId) return;

    joinRequestRoom(serviceRequestId);

    if (!socket) return;

    // Customer accepts or rejects quote
    const handleQuoteUpdate = (data) => {
      if (data?.action === "quote_accepted") {
        setQuoteMessage("✅ Customer APPROVED your repair quote!");
        updateSelectedReq((prev) => (prev ? { ...prev, orderStatus: "accepted" } : prev));
      } else if (data?.action === "quote_rejected") {
        setQuoteMessage("❌ Customer rejected the repair quote.");
        updateSelectedReq((prev) => (prev ? { ...prev, orderStatus: "rejected" } : prev));
      }
    };

    // Customer completes payment
    const handlePaymentCompleted = () => {
      updateSelectedReq((prev) => (prev ? { ...prev, paymentStatus: "paid" } : prev));
    };

    // Customer or system updates job status
    const handleJobStatusUpdate = (data) => {
      if (data?.orderStatus || data?.jobStatus) {
        updateSelectedReq((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            jobStatus: data.jobStatus || prev.jobStatus,
            orderStatus: data.orderStatus || prev.orderStatus,
          };
        });
      }
    };

    socket.on("quote_update", handleQuoteUpdate);
    socket.on("payment_completed", handlePaymentCompleted);
    socket.on("job_status_update", handleJobStatusUpdate);

    return () => {
      leaveRequestRoom(serviceRequestId);
      socket.off("quote_update", handleQuoteUpdate);
      socket.off("payment_completed", handlePaymentCompleted);
      socket.off("job_status_update", handleJobStatusUpdate);
    };
  }, [socket, serviceRequestId, joinRequestRoom, leaveRequestRoom]);

  useEffect(() => {
    if (serviceRequestId && (!order || order._id !== serviceRequestId)) {
      api
        .post("/api/v1/serviceRequest/get-service-details", { serviceRequestId })
        .then((response) => {
          const resData = response.data?.data;
          const { serviceRequest: fetchedServiceReq } = resData || {};
          if (fetchedServiceReq) {
            updateSelectedReq(fetchedServiceReq);
            localStorage.setItem("serviceRequestId", fetchedServiceReq._id);
            localStorage.setItem("selectedReq", JSON.stringify(fetchedServiceReq));
          }
        })
        .catch((err) => {
          console.error("Error fetching service details for worker:", err);
        });
    }
  }, [serviceRequestId, order?._id]);

  useEffect(() => {
    let watchId;
    if (track) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setUserPosition(coords);

          // Stream live location over WebSocket directly to customer map
          if (serviceRequestId) {
            emitWorkerLocation({
              serviceRequestId,
              coordinates: [coords[1], coords[0]], // [lng, lat]
              workerId: order?.workerId?._id || order?.workerId,
              heading: pos.coords.heading || 0,
              speed: pos.coords.speed || 0,
            });
          }

          fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords[0]}&lon=${coords[1]}`)
            .then((res) => res.json())
            .then((data) => setAddress(data.display_name || "Address not found"))
            .catch(() => setAddress("Unable to fetch address"));
        },
        (err) => alert("Error watching position: " + err.message),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [track, serviceRequestId, emitWorkerLocation, order?.workerId]);

  const startTracking = () => {
    setisLocated(true);
    setTrack(true);
  };
  const mapCenter = userPosition || [28.6139, 77.209];
  const distanceInfo = userPosition && destination
    ? getBearingAndDistance(userPosition, destination)
    : null;

  if (!order) {
    return (
      <div className="container py-5 px-3 text-center" style={{ maxWidth: "540px" }}>
        <div className="card shadow-sm border-0 p-4 rounded-4 bg-white">
          <div className="spinner-border text-primary mx-auto mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="fw-bold mb-1 text-dark">Loading Service Request...</h5>
          <p className="text-muted small mb-4">
            {serviceRequestId
              ? "Fetching real-time service request details..."
              : "No active service request selected."}
          </p>
          <div className="d-flex justify-content-center gap-2 flex-wrap">
            <button
              onClick={() => navigate("/all_requests")}
              className="btn btn-warning rounded-pill px-4 fw-semibold"
            >
              Browse All Requests
            </button>
            <button
              onClick={() => navigate("/worker")}
              className="btn btn-outline-secondary rounded-pill px-4"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const customer = order.customerId || {};

  const handleSubmitOtp = async () => {
    if (!otp) return alert("Please enter OTP");
    if (otp.trim().length !== 6) return alert("Please enter a valid 6-digit OTP");
  
    try {
      const res = await api.post(
        `/api/v1/worker/verify-otp`, // Adjust base path if needed
        {
          serviceRequestId: order._id,
          otp: otp
        },
        { headers: { Authorization: `Bearer ${token}` },
        withCredentials: true, }
      );
  
      alert("OTP verified! Job marked as completed.");
      navigate("/worker"); // Or wherever you want to redirect
    } catch (err) {
      console.error("OTP verification failed", err);
      alert(err?.response?.data?.message || "Failed to verify OTP");
    }
  };

  useEffect(() => {
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
  });
   
  const updateJobStatus = async (serviceRequestId, newStatus) => {
   
  
    try {
      const response = await api.post(
        "/api/v1/serviceRequest/update-job-status",
        { serviceRequestId, newStatus },
      );
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handleQuoteSubmit = async () => {
    if (!quoteAmount || isNaN(quoteAmount)) {
      return alert("Please enter a valid amount");
    }
   
    try {
      const res = await api.patch(
        `/api/v1/serviceRequest/${order._id}/set-quote-amount`,
        { quoteAmount },
        {headers: { Authorization: `Bearer ${token}` },
        withCredentials: true, }
      );
      const updatedData = await updateJobStatus(order._id,"repairAmountQuoted");
    setQuoteMessage("✅ Quote submitted successfully");
    } catch (err) {
      console.error("Quote submission error:", err);
      setQuoteMessage("❌ " + (err.response?.data?.message || "Failed to submit quote"));
    }
  };

  useEffect(() => {
    setTrack(true);
  }, []);

  console.log("service is:",order);


  // Handle Cancellations

  const HandleCustomerNotResponding = async () => {
    try {
      const res=await api.post(
        `/api/v1/serviceRequest/${serviceRequestId}/cancelled-by-worker-as-customer-not-responding`,
        { distance: distanceInfo.distance }, // Example distance
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message);
      console.log("Cancelled: Customer not responding");
      navigate("/worker")
    } catch (err) {
      const message = err.response?.data?.message || err.message || "An error occurred";
     alert(message);
     console.error("Error cancelling request:", err);
    }
  };

  const HandleDontWantToProceed = async () => {
    try {
      await api.post(
        `/api/v1/serviceRequest/${serviceRequestId}/cancelled-by-worker-as-not-able-to-serve`
,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Cancelled: Worker not able to serve");
      alert("Cancelled: Worker not able to serve");
      navigate("/worker");
    } catch (err) {
      console.error("Error cancelling request:", err);
    }
  };


  return (
    <div className="container py-3 px-2 px-md-3" style={{ maxWidth: "1200px" }}>
      {/* Locate Button if not yet tracked */}
      {!isLocated && (
        <button
          onClick={startTracking}
          className="btn btn-primary fw-bold w-100 mb-3 py-3 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2"
        >
          <MdOutlineDirectionsRun size={20} /> Locate Customer & Start Tracking
        </button>
      )}

      {/* Map Section */}
      <div className="card border-0 shadow-sm overflow-hidden mb-3 mb-md-4" style={{ borderRadius: "16px" }}>
        <div style={{ height: "420px", minHeight: "320px", width: "100%" }}>
          <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {userPosition && destination && (
              <>
                <Marker position={destination} icon={manIcon}>
                  <Popup>📍 Customer Location</Popup>
                </Marker>
                <Marker position={userPosition} icon={sourceIcon}>
                  <Popup>👷‍♂️ Your Current Location</Popup>
                </Marker>
                <Routing from={userPosition} to={destination} />
              </>
            )}
          </MapContainer>
        </div>
      </div>

      {/* Aligned 2-Column Responsive Grid */}
      <div className="row g-3 g-md-4 align-items-stretch">
        {/* Left Column: Navigation, Quotes & Actions */}
        <div className="col-12 col-lg-6 d-flex">
          <div
            className="card border-0 shadow-sm p-3 p-md-4 w-100 d-flex flex-column"
            style={{ borderRadius: "16px", backgroundColor: "#fff" }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-2">
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center">
                <GiMultiDirections size={22} className="me-2 text-primary" />
                Navigation & Actions
              </h5>
              <span className="badge bg-warning bg-opacity-10 text-dark fw-bold px-3 py-2 rounded-pill text-capitalize">
                Status: {order?.orderStatus || "In Progress"}
              </span>
            </div>

            {userPosition ? (
              <div className="d-flex flex-column gap-3">
                {/* Distance & Quick Map Actions */}
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 p-2 px-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                  <div className="d-flex align-items-center">
                    <MdOutlineDirectionsRun size={20} className="me-2 text-primary" />
                    <span className="text-muted small fw-medium">Distance:</span>
                    <span className="badge bg-primary text-white fw-bold ms-2 px-2 py-1">
                      {distanceInfo?.distance ?? "..."} m
                    </span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${userPosition[0]},${userPosition[1]}&destination=${destination[0]},${destination[1]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-success btn-sm rounded-pill fw-semibold d-inline-flex align-items-center gap-1"
                  >
                    <FiMapPin size={14} /> Open in Google Maps
                  </a>
                </div>

                {/* Quote Setting Block */}
                <div className="p-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                  <label htmlFor="quoteAmount" className="form-label fw-bold small text-dark d-block mb-1">
                    💰 Set Repair Quote Amount (₹):
                  </label>
                  <div className="input-group mb-2">
                    <span className="input-group-text bg-white border-end-0">₹</span>
                    <input
                      type="number"
                      id="quoteAmount"
                      className="form-control"
                      placeholder={order?.quoteAmount > 0 ? String(order.quoteAmount) : "e.g., 500"}
                      value={quoteAmount || (order?.quoteAmount > 0 ? order.quoteAmount : "")}
                      onChange={(e) => setQuoteAmount(e.target.value)}
                      disabled={order.quoteAmount > 0}
                    />
                    <button
                      className="btn btn-primary fw-semibold px-3"
                      onClick={handleQuoteSubmit}
                      disabled={order.quoteAmount > 0}
                    >
                      {order.quoteAmount > 0 ? "Quoted" : "Submit Quote"}
                    </button>
                  </div>
                  {quoteMessage && (
                    <p
                      className={`small fw-semibold mb-0 ${
                        quoteMessage.startsWith("✅") ? "text-success" : "text-danger"
                      }`}
                    >
                      {quoteMessage}
                    </p>
                  )}
                </div>

                {/* OTP Completion Block */}
                <div className="p-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                  <label className="form-label fw-bold small text-dark d-block mb-1">
                    🔐 Verify Customer OTP to Complete Job:
                  </label>
                  <div className="d-flex gap-2">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="form-control"
                      maxLength={6}
                    />
                    <button
                      className="btn btn-success fw-bold px-4 rounded-3 flex-shrink-0"
                      onClick={handleSubmitOtp}
                    >
                      Verify OTP
                    </button>
                  </div>
                </div>

                {/* Cancellation Options */}
                <div className="pt-2 mt-auto border-top">
                  {!showCancelOptions ? (
                    <button
                      className="btn btn-outline-danger btn-sm rounded-pill w-100 fw-semibold py-2"
                      onClick={() => setShowCancelOptions(true)}
                    >
                      Cancel Request
                    </button>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      <button
                        className="btn btn-warning btn-sm rounded-pill fw-semibold text-dark"
                        onClick={HandleDontWantToProceed}
                      >
                        Don't want to proceed
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm rounded-pill fw-semibold"
                        onClick={HandleCustomerNotResponding}
                      >
                        Customer not responding
                      </button>
                      <button
                        className="btn btn-light btn-sm text-muted"
                        onClick={() => setShowCancelOptions(false)}
                      >
                        Keep Request
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 my-auto">
                <p className="text-muted small mb-0">Waiting for location permission to display route info...</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer & Request Details */}
        <div className="col-12 col-lg-6 d-flex">
          <div
            className="card border-0 shadow-sm p-3 p-md-4 w-100 d-flex flex-column"
            style={{ borderRadius: "16px", backgroundColor: "#fff" }}
          >
            <h5 className="fw-bold mb-3 pb-2 border-bottom d-flex align-items-center text-dark">
              <IoIosInformationCircle size={22} className="me-2 text-primary" />
              Customer & Request Details
            </h5>

            <div className="d-flex flex-column gap-2 mb-3">
              <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                <span className="text-muted small fw-medium d-flex align-items-center">
                  <CgProfile size={18} className="me-2 text-primary" /> Customer
                </span>
                <span className="fw-bold text-dark small">{customer.fullName || "Customer"}</span>
              </div>

              {customer.email && (
                <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                  <span className="text-muted small fw-medium">Email</span>
                  <span className="text-dark small text-break">{customer.email}</span>
                </div>
              )}

              {customer.phone && (
                <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                  <span className="text-muted small fw-medium">Phone</span>
                  <span className="text-dark small">{customer.phone}</span>
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                <span className="text-muted small fw-medium d-flex align-items-center">
                  <FaHammer size={16} className="me-2 text-primary" /> Category
                </span>
                <span className="badge bg-primary bg-opacity-10 text-primary fw-bold text-capitalize">
                  {order.category}
                </span>
              </div>

              <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                <span className="text-muted small fw-medium d-flex align-items-center">
                  <MdNetworkWifi size={18} className="me-2 text-primary" /> Job Status
                </span>
                <span className="badge bg-warning bg-opacity-10 text-dark fw-bold text-capitalize">
                  {order.jobStatus}
                </span>
              </div>

              <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                <span className="text-muted small fw-medium d-flex align-items-center">
                  <RiMoneyDollarCircleFill size={18} className="me-2 text-primary" /> Payment
                </span>
                <span className={`badge ${order?.paymentStatus === 'paid' ? 'bg-success' : 'bg-danger'} fw-bold text-capitalize`}>
                  {order.paymentStatus || "Unpaid"}
                </span>
              </div>
            </div>

            <div
              className="p-3 rounded-3 mb-3 flex-grow-1"
              style={{ backgroundColor: "#f8f9fa", borderLeft: "4px solid #0d6efd" }}
            >
              <span className="text-muted small fw-semibold d-block mb-1">
                <MdOutlineDescription className="me-1 text-primary" /> Issue Description
              </span>
              <p className="mb-0 text-dark small" style={{ whiteSpace: "pre-wrap" }}>
                {order.description || "No description provided"}
              </p>
            </div>

            {order.audioNoteUrl ? (
              <div className="mt-auto pt-2 border-top">
                <span className="text-muted small fw-semibold d-block mb-1">
                  <AiTwotoneAudio className="me-1 text-primary" /> Customer Voice Note
                </span>
                <audio controls src={order.audioNoteUrl} className="w-100 rounded-3" />
              </div>
            ) : (
              <p className="text-muted small mb-0 mt-auto pt-2 border-top">No audio note provided.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Location_map;
