import Footer from "../../components/general/Footer.jsx";
import Header from "../../components/general/Header.jsx";
import Location_map from "../../components/worker/Location_map.jsx";

const Location_workerside = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <main className="flex-grow-1">
        <Location_map />
      </main>
      <Footer compact />
    </div>
  );
};

export default Location_workerside;
