import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Header_worker = ({ isOnline }) => {
  const [location, setLocation] = useState("");
  const [isLoadingLoc, setIsLoadingLoc] = useState(false);

  const navigate = useNavigate();

  const handle_navigate = () => {
    navigate("/all_requests");
  };

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
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );

          if (!res.ok) {
            throw new Error("Failed to fetch location");
          }

          const data = await res.json();

          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.suburb ||
            data.display_name ||
            "Unknown";

          setLocation(city);
        } catch (err) {
          console.error("Location fetch error:", err);
          alert("Failed to fetch location");
        } finally {
          setIsLoadingLoc(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Permission denied or location unavailable");
        setIsLoadingLoc(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
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

        {/* Menu */}
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

          {/* Location */}
          <div className="d-flex align-items-center" style={{ maxWidth: "260px" }}>
            <input
              type="text"
              className="form-control rounded-pill px-3 me-2"
              placeholder="Enter or Detect Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <button
              className="btn btn-outline-primary rounded-pill d-flex align-items-center gap-1"
              onClick={detectLocation}
              type="button"
              disabled={isLoadingLoc}
            >
              <i className="bi bi-crosshair"></i>
              <span className="d-none d-sm-inline">
                {isLoadingLoc ? "Loading..." : "Detect"}
              </span>
            </button>
          </div>

          {/* Search */}
          <form className="d-flex" style={{ maxWidth: "180px" }}>
            <input
              type="search"
              className="form-control rounded-pill px-3 py-2"
              placeholder="Search..."
            />
          </form>
        </div>
      </div>
    </header>
  );
};

export default Header_worker;
