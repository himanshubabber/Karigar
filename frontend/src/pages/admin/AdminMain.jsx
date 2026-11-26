import { Link } from "react-router-dom";

const AdminMain = () => {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
      <div className="card shadow-lg rounded-4 border-0 p-4" style={{ width: "100%", maxWidth: "440px" }}>
        <div className="card-body text-center p-4">
          <div className="d-inline-flex p-3 rounded-4 bg-primary bg-opacity-10 text-primary fs-3 mb-3">
            ⚡
          </div>
          <h3 className="fw-bold text-dark mb-1">Karigar Admin</h3>
          <p className="text-muted small mb-4">
            Sign in with your authorized credentials or submit an elevation request to access platform management tools.
          </p>
          <Link to="/signin_admin" className="btn btn-primary btn-lg w-100 mb-3 fw-semibold">
            Sign in as Admin
          </Link>
          <Link to="/admin/request-access" className="btn btn-outline-secondary btn-lg w-100 fw-semibold">
            Request Admin Access
          </Link>
          <div className="mt-4 pt-3 border-top text-center text-muted" style={{ fontSize: "11px" }}>
            Access is restricted to authorized platform administrators.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMain;
