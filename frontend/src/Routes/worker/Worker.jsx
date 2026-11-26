import React, { useEffect, useState } from "react";
import Header_worker from "../../components/worker/Header_worker.jsx";
import Worker_middle from "../../components/worker/Worker_middle.jsx";
import Footer from "../../components/general/Footer.jsx";
import { useLocation } from "react-router-dom";
import { useWorker } from "../../Context/Worker_context";

const Worker = () => {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(true); 
  const { worker, setWorker } = useWorker();

  // If navigated with state, update context
  useEffect(() => {
    if (location.state && location.state.fullName) {
      setWorker(location.state);
    }
  }, [location.state, setWorker]);
  console.log(worker);
  if (!worker) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <p className="text-muted">Loading worker info...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header_worker isOnline={isOnline} />
      <main className="flex-grow-1 d-flex align-items-center py-2 py-md-4">
        <Worker_middle isOnline={isOnline} setIsOnline={setIsOnline} worker={worker} />
      </main>
      <Footer compact />
    </div>
  );
};

export default Worker;
