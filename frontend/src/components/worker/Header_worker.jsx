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
    <header className="bg-white shadow-sm border-bottom">
      <div className="container-fluid d-flex align-items-center py-2 px-2">

        {/* Logo */}
        <a href="/" className="d-flex align-items-center text-decoration-none me-auto">
          <i className="bi bi-tools me-2 fs-3 text-primary"></i>
          <span
            style={{
              fontSize: "1.8rem",
              fontWeight: "900",
              color: "#0d6efd",
              letterSpacing: "1px",
            }}
          >
            Karigar
          </span>
        </a>

        {/* All Requests */}
        {isOnline && (
          <button className="btn btn-warning me-3" onClick={handle_navigate}>
            All Requests
          </button>
        )}

        {/* Navigation */}
        <div className="d-flex align-items-center gap-3 flex-nowrap">

          <ul className="nav align-items-center">
            <li className="nav-item dropdown me-2">
              <a className="nav-link dropdown-toggle text-dark" data-bs-toggle="dropdown" href="#">
                Home Services
              </a>
              <ul className="dropdown-menu">
                <li><a className="dropdown-item" href="#">Plumber</a></li>
                <li><a className="dropdown-item" href="#">Electrician</a></li>
                <li><a className="dropdown-item" href="#">Carpenter</a></li>
                <li><a className="dropdown-item" href="#">Painter</a></li>
              </ul>
            </li>

            <li className="nav-item dropdown me-2">
              <a className="nav-link dropdown-toggle text-dark" data-bs-toggle="dropdown" href="#">
                Appliances
              </a>
              <ul className="dropdown-menu">
                <li><a className="dropdown-item" href="#">TV</a></li>
                <li><a className="dropdown-item" href="#">Fridge</a></li>
                <li><a className="dropdown-item" href="#">AC</a></li>
                <li><a className="dropdown-item" href="#">Washing Machine</a></li>
              </ul>
            </li>

            <li className="nav-item dropdown me-2">
              <a className="nav-link dropdown-toggle text-dark" data-bs-toggle="dropdown" href="#">
                Electronics
              </a>
              <ul className="dropdown-menu">
                <li><a className="dropdown-item" href="#">Laptop</a></li>
              </ul>
            </li>
          </ul>

          {/* LOCATION (ONLY IMPROVED PART) */}
          <div
            className="input-group input-group-stylish rounded-pill"
            style={{ minWidth: "250px", maxWidth: "320px" }}
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

              <span className="d-none d-sm-inline">
                {isLoadingLoc ? "..." : "Detect"}
              </span>
            </button>
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
