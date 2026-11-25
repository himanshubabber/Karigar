const Footer = ({ compact = false }) => {
  if (compact) {
    return (
      <footer className="bg-white text-dark border-top mt-auto shadow-sm">
        <div className="container py-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-tools fs-5 text-primary"></i>
              <span className="fw-bold text-dark">Karigar</span>
              <span className="text-muted small ms-2 d-none d-sm-inline">| Platform for on-demand services</span>
            </div>

            <div className="text-center text-muted small my-1 my-md-0">
              Support: <a href="mailto:karigar.mu.app@gmail.com" className="text-decoration-none text-primary fw-semibold">karigar.mu.app@gmail.com</a>
            </div>

            <div className="d-flex align-items-center gap-3">
              <p className="mb-0 small text-muted">© 2025 Karigar.</p>
              <ul className="list-unstyled d-flex mb-0">
                <li className="ms-2">
                  <a className="link-secondary fs-6" href="#" aria-label="Instagram">
                    <i className="bi bi-instagram"></i>
                  </a>
                </li>
                <li className="ms-2">
                  <a className="link-secondary fs-6" href="#" aria-label="Facebook">
                    <i className="bi bi-facebook"></i>
                  </a>
                </li>
                <li className="ms-2">
                  <a className="link-secondary fs-6" href="#" aria-label="Twitter">
                    <i className="bi bi-twitter-x"></i>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        {/* --- Yellow Stripe Footer Section --- */}
        <div style={{ backgroundColor: '#ffeb3b', color: '#000000', textAlign: 'center', padding: '6px 0', fontWeight: '700', fontSize: '0.85rem', width: '100%', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Himanshu 2k22/co/207
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-light text-dark py-3 mt-auto border-top">
      {/* Added text-center text-sm-start: Centers text on phones, left-aligns on tablets+ */}
      <div className="container text-center text-sm-start">
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-4">
          {/* Column 1: Brand */}
          <div className="col mb-3 mb-sm-2">
            <a
              href="/"
              className="d-flex align-items-center justify-content-center justify-content-sm-start mb-2 link-dark text-decoration-none"
              aria-label="Bootstrap"
            >
              <i className="bi bi-tools fs-3 me-2 text-primary"></i>
              <span className="fs-5 fw-bold">Karigar</span>
            </a>
            <p className="text-muted small mb-2">
              Trusted on-demand platform connecting skilled professionals with customers.
            </p>
            <p className="text-muted small mb-0">
              Need help? <a href="mailto:karigar.mu.app@gmail.com" className="text-decoration-none text-primary fw-semibold">karigar.mu.app@gmail.com</a>
            </p>
          </div>

          {/* Column 2: Services */}
          <div className="col mb-3 mb-sm-2">
            <h6 className="fw-bold">Services</h6>
            <ul className="nav flex-column">
              <li className="nav-item mb-1">
                <a href="#" className="nav-link p-0 text-muted small">Plumber</a>
              </li>
              <li className="nav-item mb-1">
                <a href="#" className="nav-link p-0 text-muted small">Electrician</a>
              </li>
              <li className="nav-item mb-1">
                <a href="#" className="nav-link p-0 text-muted small">Carpenter</a>
              </li>
              <li className="nav-item mb-1">
                <a href="#" className="nav-link p-0 text-muted small">Painter</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="col mb-3 mb-sm-2">
            <h6 className="fw-bold">Company</h6>
            <ul className="nav flex-column">
              <li className="nav-item mb-1">
                <a href="#" className="nav-link p-0 text-muted small">About Us</a>
              </li>
              <li className="nav-item mb-1">
                <a href="#" className="nav-link p-0 text-muted small">Careers</a>
              </li>
              <li className="nav-item mb-1">
                <a href="#" className="nav-link p-0 text-muted small">Contact</a>
              </li>
            </ul>
          </div>

          {/* Column 4: Help */}
          <div className="col mb-3 mb-sm-2">
            <h6 className="fw-bold">Help</h6>
            <ul className="nav flex-column">
              <li className="nav-item mb-1">
                <a href="#" className="nav-link p-0 text-muted small">FAQs</a>
              </li>
              <li className="nav-item mb-1">
                <a href="#" className="nav-link p-0 text-muted small">Support</a>
              </li>
              <li className="nav-item mb-1">
                <a href="#" className="nav-link p-0 text-muted small">Privacy</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center py-2 mt-2 border-top">
          <p className="mb-0 small text-muted">© 2025 Karigar. All rights reserved.</p>
          <ul className="list-unstyled d-flex mb-0 mt-2 mt-sm-0">
            <li className="ms-3">
              <a className="link-secondary fs-6" href="#">
                <i className="bi bi-instagram"></i>
              </a>
            </li>
            <li className="ms-3">
              <a className="link-secondary fs-6" href="#">
                <i className="bi bi-facebook"></i>
              </a>
            </li>
            <li className="ms-3">
              <a className="link-secondary fs-6" href="#">
                <i className="bi bi-twitter-x"></i>
              </a>
            </li>
          </ul>
        </div>
      </div>
      {/* --- Yellow Stripe Footer Section --- */}
      <div style={{ backgroundColor: '#ffeb3b', color: '#000000', textAlign: 'center', padding: '6px 0', fontWeight: '700', fontSize: '0.85rem', width: '100%', letterSpacing: '1px', boxShadow: '0 -4px 10px rgba(0,0,0,0.1)', textTransform: 'uppercase' }}>
        Himanshu 2k22/co/207
      </div>
    </footer>
  );
};

export default Footer;
