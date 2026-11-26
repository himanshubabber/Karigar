import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine"
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import Feedback from "./Feedback.jsx";
import { IoIosInformationCircle } from "react-icons/io";
import { CgProfile } from "react-icons/cg";
import { FaHammer, FaStar } from "react-icons/fa6";
import {
  MdOutlineDescription,
  MdNetworkWifi,
  MdOutlineAccessTimeFilled,
  MdVerifiedUser,
} from "react-icons/md";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { AiTwotoneAudio } from "react-icons/ai";
import { useNavigate } from "react-router-dom";

import { useServiceReq } from "../../Context/Service_req_context.jsx";
import { useCustomer } from "../../Context/Customer_context.jsx";
import { useWorker } from "../../Context/Worker_context.jsx";
import { useOtp } from "../../Context/Otp_context.jsx";
import api from "../../api.js";

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

const Location_map_user = () => {
  const { customer,token,setCustomer } = useCustomer();
  const { worker, setWorker } = useWorker();
  const { otpData: otp } = useOtp();
  const { selectedReq: ser, updateSelectedReq } = useServiceReq();

  const [otpShow, setOtpShow] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const [showCancelOptions, setShowCancelOptions] = useState(false);
  const [track, setTrack] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [verifyText, setVerifyText] = useState("");
  const [verifyError, setVerifyError] = useState(null);
  const [verifyDone, setVerifyDone] = useState(false);
  const [textSubmitted,setTextSubmitted]=useState(false);


  const serviceRequestId = ser?._id || localStorage.getItem("serviceRequestId");
  const navigate = useNavigate();

  useEffect(() => {
    if (serviceRequestId) {
      api
        .post("/api/v1/serviceRequest/get-service-details", { serviceRequestId })
        .then((response) => {
          const resData = response.data?.data;
          const {
            customer: fetchedCustomer,
            worker: fetchedWorker,
            serviceRequest: fetchedServiceReq,
          } = resData || {};

          setCustomer(fetchedCustomer || null);
          setWorker(fetchedWorker || null);
          updateSelectedReq(fetchedServiceReq || null);

          if (fetchedServiceReq?._id) {
            localStorage.setItem("serviceRequestId", fetchedServiceReq._id);
            localStorage.setItem("selectedReq", JSON.stringify(fetchedServiceReq));
          }
        })
        .catch((err) => {
          console.error("Error fetching service details:", err);
        });
    }
  }, [serviceRequestId]);

  useEffect(() => {
    setTrack(true);
  }, []);

  useEffect(() => {
    let watchId;
    if (track) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => alert("Location error: " + err.message),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 50000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [track]);

  

  const handle_notproceed = () => {
    navigate("/customer");
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    try {
      console.log({serviceRequestId})
      const { data } = await api.post(
         `/api/v1/payment/${serviceRequestId}/create-order`,
         {
          amount: ser.visitingCharge+ser.quoteAmount, 
          currency: "INR"
        }
  
      );

      setOtpShow(true)
      const options = {
        key: "rzp_test_4RSGtzPekc2oSp", // <- ✅ Use VITE_ prefixed env var
        order_id: data.data.id,
        ...data.data,
        handler: async function (response) {
          const options = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          };
          try {
            await api.post(
              `/api/v1/payment/${serviceRequestId}/verify-payment`, options);
            alert("Payment successful!");
          } catch {
            alert("Payment verification failed.");
          }
        },
      };
      await api.post(
        "/api/v1/serviceRequest/update-job-status",
        { serviceRequestId, newStatus: "accepted" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const rzp = new window.Razorpay(options);
      console.log("Order created:", rzp);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("Failed to initiate payment");
    }
  };

  // const workerCoords = worker?.workerLocation?.coordinates?.length === 2
  //   ? [worker.workerLocation.coordinates[1], worker.workerLocation.coordinates[0]]
  //   : null;
  const workerCoords = ser?.orderStatus === "cancelled" 
  ? null 
  : (ser?.workerLocation?.coordinates?.length === 2
    ? [ser.workerLocation.coordinates[1], ser.workerLocation.coordinates[0]]
    : null);
  console.log(worker)
  const destination = workerCoords;

  const distanceInfo = userPosition && destination
  ? getBearingAndDistance(userPosition, destination)
  : null;
   {console.log("user pos",userPosition)}
   {console.log("dest pos",destination)}

  useEffect(() => {
    if (!userPosition && ser?.customerLocation?.coordinates?.length === 2) {
      setUserPosition([
        ser.customerLocation.coordinates[1],
        ser.customerLocation.coordinates[0],
      ]);
    }
  }, [customer, userPosition]);

  function Routing({ from, to }) {
    const map = useMap();
  
    useEffect(() => {
      if (!map || !from || !to) return;
  
      const control = L.Routing.control({
        waypoints: [
          L.latLng(from[0], from[1]),
          L.latLng(to[0], to[1]),
        ],
        router: L.Routing.osrmv1({
          serviceUrl: "https://router.project-osrm.org/route/v1",
          profile: "driving",
          // explicitly convert to [lon,lat] for OSRM
          coordinates: [
            [from[1], from[0]], // [lon, lat]
            [to[1], to[0]]      // [lon, lat]
          ]
        }),
        lineOptions: { styles: [{ color: "blue", weight: 5 }] },
        show: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        createMarker: () => null,
      }).addTo(map);
  
      return () => {
        if (map && control) {
          map.removeControl(control);
        }
      };
    }, [map, from, to]);
  
    return null;
  }
  console.log(ser)

  const handleOnPayment = async () => {
    console.log(token);
    try {
      const response = await api.put(
        "/api/v1/serviceRequest/mark-payment",
        {
          serviceRequestId: ser._id,
          Authorization: `Bearer ${token}`,
           // sending in body
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      console.log("✅ Payment status updated:", response.data);
      setOtpShow(true)
      // Optionally show success message or update UI
    } catch (error) {
      console.error("❌ Failed to update payment status:", error?.response?.data?.message || error.message);
      // Optionally show error message to user
    }
  };
  // service status show logic 

  const updateJobStatus = async (serviceRequestId, newStatus, token) => {
    try {
      const response = await api.post(
        "/api/v1/serviceRequest/update-job-status",
        { serviceRequestId, newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data; 
    } catch (error) {
      console.error("Failed to update job status:", error.response?.data || error.message);
      throw error;
    }
  };


  const statusMap = [
    "searching",
    "connected",
    "onway",
    "arrived",
    "verified",
    "repairAmountQuoted",
    "accepted",
    "completed"
  ];
  
  const statusLabels = {
    searching: "🔍 Searching for Technician",
    connected: "🔗 Connected to Technician",
    onway: "🚗 Technician On The Way",
    arrived: "📍 Technician Arrived",
    verified: "🔧 Issue Verified",
    repairAmountQuoted: "💰 Repair Amount Quoted",
    accepted: "✅ Repair Accepted",
    completed: "🎉 Job Completed",
  };
  
  const currentStatusIndex = statusMap.indexOf(ser?.orderStatus);
  console.log(otp?.otp);

  const [hasArrived, setHasArrived] = useState(false);
  
useEffect(() => {
  console.log(distanceInfo);
  if (
    distanceInfo && 
    distanceInfo.distance <= 40 && 
    !hasArrived && 
    ser.orderStatus === "connected"
  ) {
    updateJobStatus(ser._id, "arrived", token)
      .then((updatedData) => {
        setHasArrived(true);
        updateSelectedReq(updatedData.data);
      })
      .catch(console.error);
  }
}, [distanceInfo, hasArrived, ser.orderStatus]);

  // {console.log("distance is:",distanceInfo.distance)}
  {console.log('order status:',ser?.orderStatus)}
  {console.log('verify text:',verifyText)}

  useEffect(() => {
    if (verifyText.trim().toLowerCase() === "yes" && !verifyDone && textSubmitted) {
      (async () => {
        try {
          const updatedData = await updateJobStatus(serviceRequestId, "verified", token);
          updateSelectedReq(updatedData.data || updatedData);
          setVerifyDone(true);
          setVerifyError(null);

        } catch (err) {
          console.error(err);
          setVerifyError("Failed to verify issue. Please try again.");
        }
      })();
    }
  }, [verifyText, verifyDone, serviceRequestId, token, updateSelectedReq]);
  
  const handleVerifySubmit = async () => {
    if (verifyText.trim().toLowerCase() !== "yes") {
      setVerifyError("Please type 'yes' to verify.");
      return;
    }
    try {
       
      const updatedData = await updateJobStatus(serviceRequestId, "verified", token);
      updateSelectedReq(updatedData.data || updatedData);
      setVerifyDone(true);
      setVerifyError(null);
      setTextSubmitted(true)
    } catch (err) {
      console.error(err);
      setVerifyError("Failed to verify issue. Please try again.");
    }
  };

  const handleWorkerNotResponding = async () => {
    try {
      // const res = await api.post(
      //   `/api/v1/serviceRequest/${serviceRequestId}/cancelled-by-customer-as-worker-not-responding-or-late`,
      //   {},
      //   {
      //     headers: { Authorization: `Bearer ${token}` },
      //   }
      // );
      // alert(res.data.message || "Cancelled: Worker not responding");
      // navigate("/customer");
      alert("You can't cancel the request")
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Error cancelling request";
        //console.log(message);
      alert(message);
      console.error("Error cancelling request:", err);
    }
  };


  return (
    <div className="container py-3 px-2 px-md-3" style={{ maxWidth: "1200px" }}>
      {/* Map Section */}
      <div className="card border-0 shadow-sm overflow-hidden mb-3 mb-md-4" style={{ borderRadius: "16px", position: "relative", zIndex: 1 }}>
        {destination && ser.orderStatus !== "completed" && ser.orderStatus !== "" && userPosition ? (
          <MapContainer
            center={userPosition}
            zoom={13}
            style={{
              minHeight: "320px",
              height: "420px",
              width: "100%",
            }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={destination} icon={manIcon}>
              <Popup>👷 Worker Location</Popup>
            </Marker>
            <Marker position={userPosition} icon={sourceIcon}>
              <Popup>📍 Your Location</Popup>
            </Marker>
            <Routing from={userPosition} to={destination} />
          </MapContainer>
        ) : (
          <div className="p-4 text-center bg-light">
            <span className="badge bg-warning bg-opacity-10 text-warning px-3 py-2 rounded-pill fw-semibold mb-2">
              Status Notice
            </span>
            <p className="text-muted small mb-0">
              {ser.orderStatus === "completed"
                ? "Job has been completed. Technician is no longer tracked."
                : "Worker location is currently unavailable or connecting..."}
            </p>
          </div>
        )}
      </div>

      {/* Service Progress Stepper */}
      <div
        className="card border-0 shadow-sm p-3 p-md-4 mb-3 mb-md-4"
        style={{ borderRadius: "16px", backgroundColor: "#fff" }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <span className="badge rounded-pill bg-primary px-2 py-1">●</span> Service Progress
          </h6>
          <span className="badge bg-primary bg-opacity-10 text-primary fw-semibold px-3 py-2 rounded-pill">
            {statusLabels[ser?.orderStatus] || ser?.orderStatus || "Searching"}
          </span>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {statusMap.map((step, idx) => {
            const isCurrent = idx === currentStatusIndex;
            const isDone = idx < currentStatusIndex;
            return (
              <span
                key={step}
                className={`badge px-3 py-2 rounded-pill fw-semibold ${
                  isCurrent
                    ? "bg-primary text-white shadow-sm"
                    : isDone
                    ? "bg-success text-white"
                    : "bg-light text-muted border"
                }`}
                style={{ fontSize: "0.82rem" }}
              >
                {isDone ? "✓ " : isCurrent ? "▶ " : ""}{statusLabels[step]}
              </span>
            );
          })}
        </div>
      </div>

      {/* Main Aligned 3-Column Grid */}
      <div className="row g-3 g-md-4 align-items-stretch">
        {/* Card 1: Request Info */}
        <div className="col-12 col-md-6 col-lg-4 d-flex">
          <div
            className="card border-0 shadow-sm p-3 p-md-4 w-100 d-flex flex-column"
            style={{ borderRadius: "16px", backgroundColor: "#fff" }}
          >
            <h5 className="fw-bold mb-3 pb-2 border-bottom d-flex align-items-center text-dark">
              <IoIosInformationCircle className="me-2 text-primary" size={22} />
              Request Info
            </h5>

            <div className="d-flex flex-column gap-2 mb-3">
              <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                <span className="text-muted small fw-medium d-flex align-items-center">
                  <CgProfile className="me-1 text-primary" /> Name
                </span>
                <span className="fw-bold text-dark small">{customer?.fullName || "N/A"}</span>
              </div>

              <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                <span className="text-muted small fw-medium d-flex align-items-center">
                  <FaHammer className="me-1 text-primary" /> Category
                </span>
                <span className="badge bg-primary bg-opacity-10 text-primary fw-bold text-capitalize">
                  {ser?.category || "N/A"}
                </span>
              </div>

              <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                <span className="text-muted small fw-medium d-flex align-items-center">
                  <MdNetworkWifi className="me-1 text-primary" /> Job Status
                </span>
                <span className="badge bg-warning bg-opacity-10 text-dark fw-bold">
                  {ser?.jobStatus || "N/A"}
                </span>
              </div>

              <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                <span className="text-muted small fw-medium d-flex align-items-center">
                  <RiMoneyDollarCircleFill className="me-1 text-primary" /> Payment
                </span>
                <span className={`badge ${ser?.paymentStatus === 'paid' ? 'bg-success' : 'bg-secondary'} fw-bold text-capitalize`}>
                  {ser?.paymentStatus || "N/A"}
                </span>
              </div>
            </div>

            <div
              className="p-3 rounded-3 mb-3 flex-grow-1"
              style={{ backgroundColor: "#f8f9fa", borderLeft: "4px solid #0d6efd" }}
            >
              <span className="text-muted small fw-semibold d-block mb-1">Issue Description</span>
              <p className="mb-0 text-dark small" style={{ whiteSpace: "pre-wrap" }}>
                {ser?.description || "No description provided"}
              </p>
            </div>

            {ser?.audioNoteUrl ? (
              <div className="mt-auto pt-2 border-top">
                <span className="text-muted small fw-semibold d-block mb-1">
                  <AiTwotoneAudio className="me-1 text-primary" /> Voice Note
                </span>
                <audio controls src={ser.audioNoteUrl} className="w-100 rounded-3" />
              </div>
            ) : (
              <p className="text-muted small mb-0 mt-auto pt-2 border-top">No audio note provided.</p>
            )}
          </div>
        </div>

        {/* Card 2: Actions & Payment */}
        <div className="col-12 col-md-6 col-lg-4 d-flex">
          <div
            className="card border-0 shadow-sm p-3 p-md-4 w-100 d-flex flex-column text-center justify-content-between"
            style={{ borderRadius: "16px", backgroundColor: "#fff" }}
          >
            <div>
              <h5 className="fw-bold mb-3 pb-2 border-bottom text-dark">
                Actions & Status
              </h5>

              {ser.orderStatus === "cancelled" && (
                <div className="alert alert-danger text-center mb-3 py-2 small rounded-3">
                  <strong>Cancelled by: </strong>
                  {ser.cancelledBy === "worker"
                    ? "Worker"
                    : ser.cancelledBy === "customer"
                    ? "Customer"
                    : ser.cancelledBy === "system"
                    ? "System"
                    : "Unknown"}
                </div>
              )}

              {/* Issue Verification Box */}
              {ser.orderStatus !== "cancelled" && ser?.paymentStatus !== "paid" && ser?.orderStatus === "arrived" && (
                <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: "#f8f9fa" }}>
                  <p className="fw-bold mb-2 text-dark small">Has the technician arrived & diagnosed the issue?</p>
                  {(verifyDone || ser.orderStatus === "verified" || ser.orderStatus === "completed") && !verifyError ? (
                    <div className="badge bg-success px-3 py-2 rounded-pill">✅ Issue verified!</div>
                  ) : (
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <input
                          type="text"
                          className="form-control form-control-sm text-center"
                          value={verifyText}
                          onChange={(e) => {
                            setVerifyText(e.target.value);
                            if (verifyError) setVerifyError(null);
                          }}
                          placeholder="Type 'yes' to verify"
                        />
                        <button
                          className="btn btn-primary btn-sm px-3 fw-semibold flex-shrink-0"
                          onClick={handleVerifySubmit}
                          disabled={verifyText.trim().toLowerCase() !== "yes"}
                        >
                          Submit
                        </button>
                      </div>
                      {verifyError && <div className="text-danger small">{verifyError}</div>}
                    </div>
                  )}
                </div>
              )}

              {/* Payment Section */}
              {ser.orderStatus !== "completed" && typeof ser?.quoteAmount === "number" && ser?.quoteAmount > 0 && (
                <div className="p-3 rounded-3 mb-3 border border-primary border-opacity-25" style={{ backgroundColor: "#e7f1ff" }}>
                  <span className="text-muted small fw-semibold text-uppercase d-block mb-1">Total Amount Payable</span>
                  <h4 className="fw-bold text-primary mb-2">
                    ₹ {Number(ser.visitingCharge || 0) + Number(ser.quoteAmount || 0)}
                  </h4>
                  <button className="btn btn-primary fw-bold w-100 py-2 rounded-pill shadow-sm" onClick={handlePayment}>
                    Pay to Start Work
                  </button>
                  {otpShow && <div className="text-success small fw-semibold mt-2">✓ OTP Sent to Registered Mobile No.</div>}
                </div>
              )}
            </div>

            {/* Bottom Actions: Cancel or Completed Feedback */}
            <div className="mt-3 pt-3 border-top">
              {ser.orderStatus !== "completed" && ser.orderStatus !== "cancelled" ? (
                !showCancelOptions ? (
                  <button
                    className="btn btn-outline-danger btn-sm rounded-pill px-4 fw-semibold"
                    onClick={() => setShowCancelOptions(true)}
                  >
                    Cancel Request
                  </button>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    <button
                      onClick={handleWorkerNotResponding}
                      className="btn btn-warning btn-sm rounded-pill fw-semibold text-dark"
                    >
                      Worker not responding
                    </button>
                    <button
                      onClick={() => setShowCancelOptions(false)}
                      className="btn btn-light btn-sm text-muted"
                    >
                      Keep Request
                    </button>
                  </div>
                )
              ) : ser.orderStatus === "completed" ? (
                <div>
                  <div className="alert alert-success py-2 small mb-3 rounded-3">
                    ✅ Your service request has been successfully completed.
                  </div>
                  {!feedbackSubmitted ? (
                    <Feedback
                      serviceRequestId={serviceRequestId}
                      onSubmit={() => setFeedbackSubmitted(true)}
                    />
                  ) : (
                    <div>
                      <h6 className="text-success fw-bold mb-2">✅ Thanks for your feedback!</h6>
                      <button
                        className="btn btn-primary btn-sm rounded-pill px-4 fw-semibold"
                        onClick={() => navigate("/customer")}
                      >
                        Go to Profile
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Card 3: Worker Info */}
        <div className="col-12 col-md-12 col-lg-4 d-flex">
          <div
            className="card border-0 shadow-sm p-3 p-md-4 w-100 d-flex flex-column"
            style={{ borderRadius: "16px", backgroundColor: "#fff" }}
          >
            <h5 className="fw-bold mb-3 pb-2 border-bottom d-flex align-items-center text-dark">
              <CgProfile className="me-2 text-primary" size={22} />
              Worker Info
            </h5>

            <div className="d-flex flex-column gap-2 mb-3">
              <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                <span className="text-muted small fw-medium">Name</span>
                <span className="fw-bold text-dark small">{worker?.fullName || "Waiting for worker..."}</span>
              </div>

              <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                <span className="text-muted small fw-medium d-flex align-items-center">
                  <FaStar className="me-1 text-warning" /> Rating
                </span>
                <span className="badge bg-warning text-dark fw-bold px-2 py-1">
                  {typeof worker?.rating === "number" ? worker.rating.toFixed(2) : "N/A"} ★
                </span>
              </div>

              <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                <span className="text-muted small fw-medium d-flex align-items-center">
                  <MdOutlineAccessTimeFilled className="me-1 text-primary" /> Experience
                </span>
                <span className="fw-bold text-dark small">{worker?.yearOfExperience || 0} yrs</span>
              </div>

              <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                <span className="text-muted small fw-medium d-flex align-items-center">
                  <MdVerifiedUser className="me-1 text-primary" /> Verified
                </span>
                <span className={`badge ${worker?.isVerified ? "bg-success" : "bg-danger"} fw-bold`}>
                  {worker?.isVerified ? "Verified" : "Not Verified"}
                </span>
              </div>

              <div className="d-flex justify-content-between align-items-center p-2 px-3 rounded-3" style={{ backgroundColor: "#f8f9fa" }}>
                <span className="text-muted small fw-medium">Status</span>
                <span className={`badge ${worker?.workerLocation ? "bg-success" : "bg-secondary"} fw-bold`}>
                  {worker?.workerLocation ? "● Online" : "○ Offline"}
                </span>
              </div>
            </div>

            <div className="mt-auto pt-3 border-top">
              <span className="text-muted small fw-semibold d-block mb-2">Service Categories:</span>
              <div className="d-flex flex-wrap gap-2">
                {worker?.workingCategory && worker.workingCategory.length > 0 ? (
                  worker.workingCategory.map((cat, idx) => (
                    <span
                      key={idx}
                      className="badge rounded-pill px-3 py-2 text-capitalize"
                      style={{
                        backgroundColor: "#e7f1ff",
                        color: "#0d6efd",
                        border: "1px solid #b6d4fe",
                        fontSize: "0.82rem",
                        fontWeight: "600",
                      }}
                    >
                      {cat}
                    </span>
                  ))
                ) : (
                  <span className="text-muted small">No categories listed</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Location_map_user;
