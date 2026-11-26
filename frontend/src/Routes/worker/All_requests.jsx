import Footer from "../../components/general/Footer.jsx";
import Header from "../../components/general/Header.jsx";
import Requests from "../../components/worker/Requests.jsx";

const All_requests = () => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header />
      <main className="flex-grow-1 d-flex flex-column">
        <Requests />
      </main>
      <Footer compact />
    </div>
  );
};

export default All_requests;
