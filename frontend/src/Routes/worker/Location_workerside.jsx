import Footer from "../../components/general/Footer.jsx";
import Header_worker from "../../components/worker/Header_worker.jsx";
import Location_map from "../../components/worker/Location_map.jsx";

const Location_workerside = () => {
  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: "#f4f6f9" }}>
      <Header_worker />
      <main className="flex-grow-1" style={{ position: "relative", zIndex: 1 }}>
        <Location_map />
      </main>
      <Footer compact />
    </div>
  );
};

export default Location_workerside;
