import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomer } from "../../Context/Customer_context";
import { MdOutlineEdit } from "react-icons/md";
import { FiLogOut } from "react-icons/fi";

// Make sure ServiceCard is imported correctly in your project!
// import ServiceCard from "./ServiceCard"; 

// Added to prevent ReferenceErrors in your <style> template strings
const colors = {
  primaryBrand: '#0056b3',
  accentBrand: '#ff6b00',
  bgGradientStart: '#f8f9fa',
  bgGradientEnd: '#e9ecef',
  darkHeading: '#333'
};

const occupations = [
  { title: 'Plumber', image: '/plumber.png' },
  { title: 'Electrician', image: '/electrician.png' },
  { title: 'Carpenter', image: '/carpenter.png' },
  { title: 'Painter', image: '/painter.png' },
  { title: 'AC Repair', image: '/ac.png' },
  { title: 'Washing Machine', image: '/washing-machine.png' },
  { title: 'TV Repair', image: '/tv.png' },
  { title: 'Laptop Repair', image: '/laptop.png' },
  { title: 'Fridge Repair', image: '/fridge.png' },
];

const Occupations = () => {
  const navigate = useNavigate();
  const { customer, setCustomer } = useCustomer();

  const handleLogout = () => {
    setCustomer(null);
    localStorage.removeItem("karigar_customer");
    navigate("/signin_customer");
  };

  // Added this missing function referenced in your occupations map
  const handleNavigation = (path) => {
    navigate(path);
  };

  useEffect(() => {
    if (!customer || !customer.fullName) {
      navigate("/signin_customer");
    }
  }, [customer, navigate]);

  return (
    <div className="container my-5">
      {/* Customer Info Card */}
      <div className="card mb-4 shadow p-4 position-relative" style={{ borderRadius: "14px" }}>
        {/* Edit Icon */}
        <MdOutlineEdit
          size={26}
          className="position-absolute top-0 end-0 m-3 text-dark"
          style={{ cursor: "pointer" }}
          title="Edit Profile"
          onClick={() => navigate("/edit_customer", { state: customer })}
        />

        {/* Profile Info */}
        <div className="d-flex align-items-center mb-3">
          <div
            style={{
              width: "110px",
              height: "110px",
              borderRadius: "50%",
              overflow: "hidden",
              marginRight: "20px",
              border: "2px solid #ccc",
            }}
          >
            <img
              src={
                customer?.profilePhoto && customer.profilePhoto.trim() !== ""
                  ? customer.profilePhoto
                  : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt="Profile"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div>
            <h4 className="fw-bold mb-1">{customer?.fullName || "Customer"}</h4>
            <p className="mb-1 text-muted">{customer?.email || "Email not available"}</p>
            <p className="mb-1 text-muted">{customer?.phone || "Phone not available"}</p>
            <p className="mb-0 text-muted">{customer?.address || "Address not available"}</p>
          </div>

          <button
            className="btn btn-outline-primary fw-bold position-absolute bottom-0 end-0 m-3"
            onClick={() => navigate("/history_customer")}
            title="History"
          >
            History
          </button>
        </div>

        {/* Logout Button */}
        <div className="text-end">
          <button
            className="btn btn-outline-danger d-flex align-items-center gap-2 fw-bold"
            onClick={handleLogout}
            title="Logout"
          >
            <FiLogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Make Request Button */}
      <div className="text-center mb-4">
        <button
          className="fw-bold btn btn-warning px-5 py-3"
          onClick={() => navigate("/service_req_form")}
        >
          Make a Request
        </button>
      </div>
  
      {/* Services */}
      {/* Reduced gutter spacing on mobile (g-3) vs desktop (g-4) */}
      <div className="row g-3 g-md-4 justify-content-center services-grid">
        {occupations.map((occ) => (
            <ServiceCard 
                key={occ.title}
                occupation={occ}
                onNavigate={() => handleNavigation("/signin_customer")}
                accentColor={colors.accentBrand}
            />
        ))}
      </div>

      {/* --- CSS Styles --- */}
      <style>{`
        /* --- ANIMATIONS --- */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translate3d(0, 30px, 0); }
            to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .animate-fade-up {
            animation-name: fadeInUp; animation-duration: 0.8s; animation-fill-mode: both; animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .delay-100 { animation-delay: 0.1s; } .delay-200 { animation-delay: 0.2s; } .delay-300 { animation-delay: 0.3s; } .delay-400 { animation-delay: 0.4s; }
        .services-grid .service-card-col:nth-child(1) { animation-delay: 0.5s; } .services-grid .service-card-col:nth-child(2) { animation-delay: 0.6s; } .services-grid .service-card-col:nth-child(3) { animation-delay: 0.7s; } .services-grid .service-card-col:nth-child(4) { animation-delay: 0.8s; } .services-grid .service-card-col:nth-child(5) { animation-delay: 0.9s; } .services-grid .service-card-col:nth-child(6) { animation-delay: 1.0s; } .services-grid .service-card-col:nth-child(7) { animation-delay: 1.1s; } .services-grid .service-card-col:nth-child(8) { animation-delay: 1.2s; } .services-grid .service-card-col:nth-child(9) { animation-delay: 1.3s; }

        /* --- TYPING EFFECT --- */
        .typing-text { display: inline-block; overflow: hidden; border-right: 3px solid ${colors.accentBrand}; white-space: nowrap; margin: 0 auto; letter-spacing: 1px; animation: typing 2.5s steps(30, end), blink-caret .75s step-end infinite; }
        @keyframes typing { from { width: 0 } to { width: 100% } }
        @keyframes blink-caret { from, to { border-color: transparent } 50% { border-color: ${colors.accentBrand}; } }

        /* --- LAYOUT & COMPONENT STYLES --- */
        .hero-section { background: linear-gradient(135deg, ${colors.bgGradientStart} 0%, ${colors.bgGradientEnd} 100%); position: relative; overflow: hidden; }
        .hero-section::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(${colors.primaryBrand} 0.5px, transparent 0.5px); background-size: 20px 20px; opacity: 0.05; z-index: 1; }

        /* Default styles for larger screens */
        .hero-headline { fontSize: 3.5rem; }
        .hero-subtitle { maxWidth: 650px; }
        .mobile-card-title { fontSize: 1.1rem; }
        .mobile-card-text { fontSize: 0.85rem; }
        .image-wrapper { height: 160px; position: relative; overflow: hidden; background: linear-gradient(to bottom, #f8f9fa, #e9ecef); }

        .professional-btn { border-radius: 12px; border: none; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); box-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1); color: #ffffff; }
        .professional-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
        /* Helper to ensure icons inherit text color */
        .icon-style { color: inherit; }

        /* --- DESKTOP BUTTON SIZING (min-width: 576px) --- */
        /* On larger screens, force buttons to a substantial, uniform width for balance */
        @media (min-width: 576px) {
          .professional-btn {
            width: 300px;
          }
        }

        /* --- MOBILE RESPONSIVE STYLES (under 576px) --- */
        @media (max-width: 576px) {
            /* 1. Smaller Headline */
            .hero-headline { fontSize: 2rem !important; }
            /* 2. Full width subtitle */
            .hero-subtitle { maxWidth: 100% !important; padding: 0 15px; font-size: 1rem !important; }
            /* 3. Smaller section title */
            .mobile-section-title { font-size: 1.75rem; }
            /* 4. Shorter image height for small cards */
            .image-wrapper { height: 130px; }
            /* 5. Smaller card text */
            .mobile-card-title { fontSize: 0.95rem !important; }
            .mobile-card-text { fontSize: 0.75rem !important; }
            /* 6. Adjust button padding and icon size */
            .btn-lg { padding: 0.75rem 1rem; }
            .btn-lg svg { width: 20px; height: 20px; margin-right: 0.5rem !important; }
        }
        
        /* --- WORKER BUTTON STYLES (Blue) --- */
        .worker-btn {
            background-color: ${colors.primaryBrand};
            box-shadow: 0 4px 15px rgba(0, 86, 179, 0.3);
        }
        
        /* FIX: HOVER STATE = Keep Blue BG, Turn Text BLACK */
        .worker-btn:hover {
             background-color: ${colors.primaryBrand} !important; 
             color: ${colors.darkHeading} !important; /* <-- Text becomes BLACK */
        }

        /* ACTIVE STATE (Clicking) - Worker: Keep Blue BG, Keep Text BLACK */
        .worker-btn:active, 
        .worker-btn:focus,
        .worker-btn:active:focus {
            background-color: ${colors.primaryBrand} !important;
            color: ${colors.darkHeading} !important; /* <-- Keep text BLACK */
            box-shadow: inset 0 3px 5px rgba(0,0,0,0.2) !important;
            transform: translateY(1px) !important;
            outline: none !important;
        }

        /* --- CUSTOMER BUTTON STYLES (Orange Gradient) --- */
        .customer-btn {
            background: linear-gradient(45deg, ${colors.accentBrand}, #ff8f33);
            box-shadow: 0 4px 15px rgba(255, 107, 0, 0.3);
        }

        /* FIX: HOVER STATE = Keep Gradient BG, Turn Text BLACK */
        .customer-btn:hover {
            background: linear-gradient(45deg, ${colors.accentBrand}, #ff8f33) !important;
            color: ${colors.darkHeading} !important; /* <-- Text becomes BLACK */
        }

        /* ACTIVE STATE (Clicking) - Customer: Keep Gradient BG, Keep Text BLACK */
        .customer-btn:active,
        .customer-btn:focus,
        .customer-btn:active:focus {
            background: linear-gradient(45deg, ${colors.accentBrand}, #ff8f33) !important;
            color: ${colors.darkHeading} !important; /* <-- Keep text BLACK */
            box-shadow: inset 0 3px 5px rgba(0,0,0,0.2) !important;
            transform: translateY(1px) !important;
            outline: none !important;
        }

        .service-card { border: none; border-radius: 16px; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.03); transition: all 0.4s ease; cursor: pointer; overflow: hidden; border-top: 4px solid transparent; }
        .service-card:hover { box-shadow: 0 15px 30px rgba(0,50,100,0.1); transform: translateY(-8px); border-top-color: ${colors.accentBrand}; }
        .loader-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 5; }
        .image-wrapper img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease, opacity 0.4s ease-in-out; }
        .image-wrapper .overlay { position: absolute; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0); transition: background 0.3s ease; z-index: 2; }
        .service-card:hover img { transform: scale(1.08); }
        .service-card:hover .overlay { background: rgba(0,0,0,0.1); }
      `}</style>
      
      {/* Custom CSS */}
      <style>{`
        .occupation-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }

        .occupation-card:active {
          transform: scale(0.97);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
};

export default Occupations;
