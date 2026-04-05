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
      alert('Geolocation not supported.');
      return;
    }

    setIsLoadingLoc(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
             { headers: { 'User-Agent': 'KarigarApp/1.0' } }
          );
          const data = await res.json();
          const city = data.display_name|| 'Unknown';
          setLocation(city);
        } catch {
          alert('Failed to fetch location');
        } finally {
          setIsLoadingLoc(false);
        }
      },
      () => {
        alert('Permission denied or error occurred. Please check browser settings.');
        setIsLoadingLoc(false);
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
          <div className="input-group input-group-stylish rounded-pill w-100 w-lg-auto" style={{ maxWidth: '100%', minWidth: '250px', lgMaxWidth: '320px' }}>
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
                     <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                     <i className="bi bi-crosshair"></i>
                  )}
                  {/* Show 'Detect' text only on larger screens */}
                  <span className="d-none d-sm-inline">{isLoadingLoc ? '...' : 'Detect'}</span>
                </button>
              </div>

          
        </div>
      </div>
    </header>
  );
};

export default Header_worker;
