import React, { useEffect } from "react";
import axios from "axios";
import api from "../../api.js";
import Request from "./Request";
import { useServiceReq } from "../../Context/Service_req_context";

const Requests = () => {
  const { serviceReqs, updateAllRequests } = useServiceReq();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await api.get("/api/v1/serviceRequest/find-requests", {
          withCredentials: true,
        });
        
        const sortedRequests = [...res.data.data].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
  
        updateAllRequests(sortedRequests);
      } catch (err) {
        console.error("Failed to fetch requests:", err);
      }
    };

    fetchRequests();
  }, [updateAllRequests]);

  return (
    <div className={`container py-4 flex-grow-1 d-flex flex-column align-items-center ${serviceReqs.length === 0 ? "justify-content-center" : ""}`}>
      {/* Page Header */}
      <div className="text-center mb-4">
        <h3 className="fw-bold text-dark mb-1">Available Service Requests</h3>
        <p className="text-muted small mb-0">Browse and accept customer requests in your service area</p>
      </div>

      {serviceReqs.length === 0 ? (
        <div
          className="card text-center p-4 p-sm-5 shadow-sm border-0 my-auto"
          style={{ maxWidth: "480px", width: "100%", borderRadius: "16px", backgroundColor: "#fff" }}
        >
          <div
            className="d-flex align-items-center justify-content-center mx-auto mb-3"
            style={{ width: "64px", height: "64px", borderRadius: "16px", backgroundColor: "#e7f1ff" }}
          >
            <i className="bi bi-inbox fs-1 text-primary"></i>
          </div>
          <h5 className="fw-bold text-dark mb-2">No Requests Available</h5>
          <p className="text-muted small mb-0">New customer requests will show up here as soon as they are submitted.</p>
        </div>
      ) : (
        <div className="row g-4 justify-content-center w-100" style={{ maxWidth: "1050px" }}>
          {serviceReqs.map((req) => (
            <div className="col-12 col-md-6 d-flex align-items-stretch" key={req._id}>
              <Request request={req} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Requests;
