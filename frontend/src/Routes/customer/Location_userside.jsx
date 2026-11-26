import Footer from "../../components/general/Footer.jsx";
import Header from "../../components/general/Header.jsx";
import Location_map_user from "../../components/customer/Location_map_user.jsx";

const Location_userside = () => {
  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: "#f4f6f9" }}>
      <Header />
      <main className="flex-grow-1" style={{ position: "relative", zIndex: 1 }}>
        <Location_map_user />
      </main>
      <Footer compact />
    </div>
  );
};

export default Location_userside;
