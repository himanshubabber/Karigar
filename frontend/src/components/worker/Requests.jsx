import React, { useEffect, useState, useMemo } from "react";
import api from "../../api.js";
import Request from "./Request";
import { useServiceReq } from "../../Context/Service_req_context";
import { useWorker } from "../../Context/Worker_context";
import { FaFilter, FaMapMarkerAlt, FaTag, FaRupeeSign, FaRedo } from "react-icons/fa";

/**
 * Haversine formula to compute geodesic distance between two points in km.
 */
const calculateHaversineKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculates geographic bounding box [minLat, maxLat, minLng, maxLng] for a given radius in km.
 * 1 degree latitude ≈ 111.32 km; 1 degree longitude ≈ 111.32 * cos(lat) km.
 */
const getBoundingBox = (centerLat, centerLng, radiusKm) => {
  if (centerLat == null || centerLng == null || radiusKm == null) return null;
  const latDelta = radiusKm / 111.32;
  const lonDelta = radiusKm / (111.32 * Math.cos((centerLat * Math.PI) / 180));
  return {
    minLat: centerLat - latDelta,
    maxLat: centerLat + latDelta,
    minLng: centerLng - lonDelta,
    maxLng: centerLng + lonDelta,
  };
};

/**
 * Checks whether target coordinates lie inside a bounding box.
 */
const isInsideBoundingBox = (bbox, targetLat, targetLng) => {
  if (!bbox || targetLat == null || targetLng == null) return false;
  return (
    targetLat >= bbox.minLat &&
    targetLat <= bbox.maxLat &&
    targetLng >= bbox.minLng &&
    targetLng <= bbox.maxLng
  );
};

/**
 * Evaluates radius matching using combined Bounding Box (spatial pre-filter) + Haversine (exact spherical validation).
 */
const matchesRadiusWithBoundingBoxAndHaversine = (workerLat, workerLng, custLat, custLng, filterOption) => {
  if (workerLat == null || workerLng == null || custLat == null || custLng == null) {
    return false;
  }

  if (filterOption === "<5") {
    // 5 km bounding box pre-filter
    const bbox5 = getBoundingBox(workerLat, workerLng, 5);
    if (!isInsideBoundingBox(bbox5, custLat, custLng)) return false;
    // Haversine exact calculation
    const dist = calculateHaversineKm(workerLat, workerLng, custLat, custLng);
    return dist < 5;
  }

  if (filterOption === "10") {
    // 10 km bounding box pre-filter
    const bbox10 = getBoundingBox(workerLat, workerLng, 10);
    if (!isInsideBoundingBox(bbox10, custLat, custLng)) return false;
    // Haversine exact calculation
    const dist = calculateHaversineKm(workerLat, workerLng, custLat, custLng);
    return dist <= 10;
  }

  if (filterOption === "20") {
    // 20 km bounding box pre-filter
    const bbox20 = getBoundingBox(workerLat, workerLng, 20);
    if (!isInsideBoundingBox(bbox20, custLat, custLng)) return false;
    // Haversine exact calculation
    const dist = calculateHaversineKm(workerLat, workerLng, custLat, custLng);
    return dist <= 20;
  }

  if (filterOption === "20+") {
    // Point outside 20km bounding box is definitely > 20km
    const bbox20 = getBoundingBox(workerLat, workerLng, 20);
    if (!isInsideBoundingBox(bbox20, custLat, custLng)) {
      return true;
    }
    // Edge case inside box: calculate exact Haversine distance
    const dist = calculateHaversineKm(workerLat, workerLng, custLat, custLng);
    return dist > 20;
  }

  return true;
};

const ALL_CATEGORIES = [
  "plumber",
  "electrician",
  "tv",
  "fridge",
  "ac",
  "washing-machine",
  "laptop",
  "carpenter",
  "painter",
];

const normalizeCat = (cat) => (cat || "").toString().trim().toLowerCase().replace(/[-\s_]+/g, "");

const formatCategory = (cat) => {
  if (!cat) return "";
  return cat
    .replace(/[-_]+/g, " ")
    .split(" ")
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
};

const Requests = () => {
  const { serviceReqs, updateAllRequests } = useServiceReq();
  const { worker, setWorker, token } = useWorker();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [radiusFilter, setRadiusFilter] = useState("");
  const [quoteFilter, setQuoteFilter] = useState("");

  const [workerCoords, setWorkerCoords] = useState(() => {
    if (worker?.workerLocation?.coordinates?.length === 2) {
      return {
        lng: worker.workerLocation.coordinates[0],
        lat: worker.workerLocation.coordinates[1],
      };
    }
    return null;
  });

  // Sync latest worker profile from backend to get freshly updated workingCategory & location
  useEffect(() => {
    const fetchCurrentWorker = async () => {
      if (!token) return;
      try {
        const res = await api.get("/api/v1/worker/current-user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res?.data?.data) {
          setWorker(res.data.data);
          if (res.data.data.workerLocation?.coordinates?.length === 2) {
            setWorkerCoords({
              lng: res.data.data.workerLocation.coordinates[0],
              lat: res.data.data.workerLocation.coordinates[1],
            });
          }
        }
      } catch (err) {
        console.warn("Could not sync current worker data:", err);
      }
    };

    fetchCurrentWorker();
  }, [token, setWorker]);

  // Request browser geolocation for distance calculation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setWorkerCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn("Geolocation warning in Requests:", err.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await api.get("/api/v1/serviceRequest/find-requests");

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

  const workerCategories = useMemo(() => {
    return Array.isArray(worker?.workingCategory) ? worker.workingCategory : [];
  }, [worker?.workingCategory]);

  const getRequestDistance = (req) => {
    if (!workerCoords) return null;
    const coords = req.customerLocation?.coordinates;
    if (!coords || coords.length !== 2) return null;
    const [custLng, custLat] = coords;
    return calculateHaversineKm(workerCoords.lat, workerCoords.lng, custLat, custLng);
  };

  const filteredRequests = useMemo(() => {
    const workerCatsNormalized = workerCategories.map(normalizeCat);

    return serviceReqs.filter((req) => {
      const reqCatNormalized = normalizeCat(req.category);

      // 1. Category filter: if specific category selected, match it; otherwise filter by worker profile categories
      if (selectedCategory) {
        if (normalizeCat(selectedCategory) !== reqCatNormalized) {
          return false;
        }
      } else {
        if (workerCatsNormalized.length > 0 && !workerCatsNormalized.includes(reqCatNormalized)) {
          return false;
        }
      }

      // 3. Location Radius filter: Bounding Box + Haversine
      if (radiusFilter) {
        const coords = req.customerLocation?.coordinates;
        if (!coords || coords.length !== 2 || !workerCoords) {
          return false;
        }
        const [custLng, custLat] = coords;
        const inRadius = matchesRadiusWithBoundingBoxAndHaversine(
          workerCoords.lat,
          workerCoords.lng,
          custLat,
          custLng,
          radiusFilter
        );
        if (!inRadius) return false;
      }

      // 4. Quote amount filter: < 100, < 500, < 1000, < 5000, 5000+ at last
      if (quoteFilter) {
        const reqQuote =
          req.quoteAmount != null
            ? Number(req.quoteAmount)
            : (req.amount != null ? Number(req.amount) : null);

        if (reqQuote == null) {
          return false;
        }

        if (quoteFilter === "<100" && reqQuote > 100) {
          return false;
        }
        if (quoteFilter === "<500" && reqQuote > 500) {
          return false;
        }
        if (quoteFilter === "<1000" && reqQuote > 1000) {
          return false;
        }
        if (quoteFilter === "<5000" && reqQuote > 5000) {
          return false;
        }
        if (quoteFilter === "5000+" && reqQuote < 5000) {
          return false;
        }
      }

      return true;
    });
  }, [serviceReqs, workerCategories, selectedCategory, radiusFilter, quoteFilter, workerCoords]);

  const handleClearFilters = () => {
    setSelectedCategory("");
    setRadiusFilter("");
    setQuoteFilter("");
  };

  const hasActiveFilters = Boolean(selectedCategory || radiusFilter || quoteFilter);

  return (
    <div className="container-fluid container-md py-3 py-sm-4 px-2 px-sm-3 d-flex flex-column align-items-center">
      <h3 className="mb-3 mb-sm-4 text-center fw-bold text-dark">Service Requests</h3>

      {/* Main Content Wrapper - Centered */}
      <div className="w-100" style={{ maxWidth: "860px", margin: "0 auto" }}>
        {/* Filters Bar Card */}
        <div
          className="card shadow-sm p-3 p-sm-4 mb-4 border-0"
          style={{
            borderRadius: "14px",
            backgroundColor: "#ffffff",
            boxShadow: "0 4px 18px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
            <span className="fw-bold d-flex align-items-center text-dark fs-6">
              <FaFilter className="me-2 text-primary" /> Filter Requests
              {hasActiveFilters && (
                <span className="badge bg-primary text-white ms-2" style={{ fontSize: "0.75rem" }}>
                  Active
                </span>
              )}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger d-flex align-items-center"
                onClick={handleClearFilters}
              >
                <FaRedo className="me-1" size={11} /> Clear All
              </button>
            )}
          </div>

          <div className="row g-3">
            {/* Category Filter - all 9 categories total */}
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-secondary mb-1 d-flex align-items-center">
                <FaTag className="me-1 text-primary" size={13} /> Category
              </label>
              <select
                className="form-select text-capitalize shadow-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ borderRadius: "8px" }}
              >
                <option value="">All Categories ({ALL_CATEGORIES.length})</option>
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {formatCategory(cat)}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Radius Filter: < 5 Km , 10 Km , 20 Km and 20 Km + */}
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-secondary mb-1 d-flex align-items-center">
                <FaMapMarkerAlt className="me-1 text-danger" size={13} /> Location Radius
              </label>
              <select
                className="form-select shadow-none"
                value={radiusFilter}
                onChange={(e) => setRadiusFilter(e.target.value)}
                style={{ borderRadius: "8px" }}
              >
                <option value="">All Distances</option>
                <option value="<5">&lt; 5 Km</option>
                <option value="10">10 Km</option>
                <option value="20">20 Km</option>
                <option value="20+">20 Km +</option>
              </select>
            </div>

            {/* Quote Amount Filter: <100, <500, <1000, <5000, 5000+ at last */}
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold text-secondary mb-1 d-flex align-items-center">
                <FaRupeeSign className="me-1 text-success" size={13} /> Quote Amount
              </label>
              <select
                className="form-select shadow-none"
                value={quoteFilter}
                onChange={(e) => setQuoteFilter(e.target.value)}
                style={{ borderRadius: "8px" }}
              >
                <option value="">All Quotes</option>
                <option value="<100">&lt; 100</option>
                <option value="<500">&lt; 500</option>
                <option value="<1000">&lt; 1000</option>
                <option value="<5000">&lt; 5000</option>
                <option value="5000+">5000+</option>
              </select>
            </div>
          </div>

          {/* Location warning if radius filter active but worker location not yet detected */}
          {radiusFilter && !workerCoords && (
            <div className="alert alert-warning py-2 px-3 small mt-3 mb-0" role="alert">
              Location access is needed to filter by distance. Please enable location permissions in browser.
            </div>
          )}

          {/* Helper message if worker has no profile categories */}
          {workerCategories.length === 0 && (
            <div className="alert alert-info py-2 px-3 small mt-3 mb-0" role="alert">
              No service categories found in your profile. Please add categories in your profile to view matching requests.
            </div>
          )}
        </div>

        {/* Results summary */}
        <div className="d-flex justify-content-between align-items-center mb-3 px-1">
          <span className="small text-muted">
            Showing <strong>{filteredRequests.length}</strong> available request{filteredRequests.length === 1 ? "" : "s"}
          </span>
          {hasActiveFilters && (
            <span className="small text-primary">
              Filtered from {serviceReqs.length} total
            </span>
          )}
        </div>

        {/* Requests Cards List */}
        {workerCategories.length === 0 ? (
          <p className="text-center text-muted py-4">Please add service categories in your profile to view requests.</p>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-5 bg-light rounded-3">
            <p className="text-muted mb-2">No service requests match the selected filters.</p>
            {hasActiveFilters && (
              <button className="btn btn-sm btn-outline-primary" onClick={handleClearFilters}>
                Reset filters to view all
              </button>
            )}
          </div>
        ) : (
          <div className="d-flex flex-wrap justify-content-center gap-4">
            {filteredRequests.map((req) => (
              <Request
                key={req._id}
                request={req}
                distanceKm={getRequestDistance(req)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Requests;
