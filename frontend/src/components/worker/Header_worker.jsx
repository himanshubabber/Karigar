import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";

const Header_worker = ({ isOnline }) => {
  const [location, setLocation] = useState("");
  const [isLoadingLoc, setIsLoadingLoc] = useState(false);

  const navigate = useNavigate();

  const handle_navigate = () => {
    navigate("/all_requests");
  };

  // ✅ IMPROVED LOCATION (FASTER + SAME FUNCTIONALITY)
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }

    setIsLoadingLoc(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
          );

          const data = await res.json();

          const city = data.display_name|| 'Unknown';
          setLocation(city);
        } catch (err) {
          console.error(err);
          alert("Failed to fetch location");
        } finally {
          setIsLoadingLoc(false);
        }
      },
      (error) => {
        console.log("Geo error:", error);
        alert("Location permission denied or unavailable.");
        setIsLoadingLoc(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  };

  return (
    <header className="navbar navbar-expand-lg navbar-light bg-white shadow-sm border-bottom sticky-top py-2 py-lg-3">
      <div className="container-fluid px-3 px-lg-4">

        {/* Logo */}
        <a href="/" className="navbar-brand d-flex align-items-center text-decoration-none me-2 me-lg-3">
          <i className="bi bi-tools me-2 fs-4 text-primary"></i>
          <span
            style={{
              fontSize: "1.6rem",
              fontWeight: "900",
              color: "#0d6efd",
              letterSpacing: "1px",
            }}
          >
            Karigar
          </span>
        </a>

        {/* All Requests (Mobile quick button if online) */}
        {isOnline && (
          <button className="btn btn-warning btn-sm fw-semibold me-2 d-lg-none" onClick={handle_navigate}>
            All Requests
          </button>
        )}

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggler border-0 shadow-none ms-auto"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#workerNavbarContent"
          aria-controls="workerNavbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Collapsible Content */}
        <div className="collapse navbar-collapse mt-3 mt-lg-0" id="workerNavbarContent">
          {/* Main Navigation */}
          <ul className="navbar-nav mx-auto mb-3 mb-lg-0 gap-1 gap-lg-3 justify-content-center text-center text-lg-start">
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle text-dark" data-bs-toggle="dropdown" href="#">
                Home Services
              </a>
              <ul className="dropdown-menu shadow-sm border-0 text-center text-lg-start">
                <li><a className="dropdown-item" href="#">Plumber</a></li>
                <li><a className="dropdown-item" href="#">Electrician</a></li>
                <li><a className="dropdown-item" href="#">Carpenter</a></li>
                <li><a className="dropdown-item" href="#">Painter</a></li>
              </ul>
            </li>

            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle text-dark" data-bs-toggle="dropdown" href="#">
                Appliances
              </a>
              <ul className="dropdown-menu shadow-sm border-0 text-center text-lg-start">
                <li><a className="dropdown-item" href="#">TV</a></li>
                <li><a className="dropdown-item" href="#">Fridge</a></li>
                <li><a className="dropdown-item" href="#">AC</a></li>
                <li><a className="dropdown-item" href="#">Washing Machine</a></li>
              </ul>
            </li>

            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle text-dark" data-bs-toggle="dropdown" href="#">
                Electronics
              </a>
              <ul className="dropdown-menu shadow-sm border-0 text-center text-lg-start">
                <li><a className="dropdown-item" href="#">Laptop</a></li>
              </ul>
            </li>
          </ul>

          <div className="d-flex flex-column flex-lg-row align-items-center gap-2">
            {/* All Requests (Desktop) */}
            {isOnline && (
              <button className="btn btn-warning fw-semibold d-none d-lg-inline-block text-nowrap" onClick={handle_navigate}>
                All Requests
              </button>
            )}

            {/* LOCATION */}
            <div
              className="input-group input-group-stylish rounded-pill w-100"
              style={{ maxWidth: "320px" }}
            >
              <span className="input-group-text ps-3">
                <i className="bi bi-geo-alt-fill"></i>
              </span>

              <input
                type="text"
                className="form-control"
                placeholder="Location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />

              <button
                className="btn btn-primary btn-detect m-1 rounded-pill d-flex align-items-center gap-2"
                onClick={detectLocation}
                type="button"
                disabled={isLoadingLoc}
              >
                {isLoadingLoc ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  <i className="bi bi-crosshair"></i>
                )}

                <span className="d-inline">
                  {isLoadingLoc ? "..." : "Detect"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STYLES */}
      <style>{`
        .input-group-stylish {
          border: 1px solid #e9ecef;
          padding: 3px;
          background: #f8f9fa;
          border-radius: 50px;
          transition: all 0.25s ease;
          align-items: center;
        }

        .input-group-stylish:focus-within {
          background: #fff;
          border-color: #0d6efd;
          box-shadow: 0 0 0 3px rgba(13,110,253,0.15);
        }

        .input-group-stylish .form-control {
          border: none;
          background: transparent;
          box-shadow: none;
          font-size: 0.95rem;
        }

        .input-group-stylish .input-group-text {
          background: transparent;
          border: none;
          color: #0d6efd;
        }

        .btn-detect {
          border-radius: 50px !important;
          padding: 6px 14px;
          font-size: 0.85rem;
          transition: 0.2s ease;
        }

        .btn-detect:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(13,110,253,0.25);
        }
      `}</style>
    </header>
  );
};

export default Header_worker;
