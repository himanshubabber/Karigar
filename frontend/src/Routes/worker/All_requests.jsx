import Footer from "../../components/general/Footer.jsx";
import Header_worker from "../../components/worker/Header_worker.jsx";
import Requests from "../../components/worker/Requests.jsx";

const All_requests = () => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header_worker isOnline={true} />
      <main className="flex-grow-1 d-flex flex-column" style={{ position: "relative", zIndex: 1 }}>
        <Requests />
      </main>
      <Footer compact />
    </div>
  );
};

export default All_requests;
