
import { Outlet } from "react-router-dom";
import Header from '../../components/general/Header.jsx'
import Footer from "../../components/general/Footer.jsx";
import Occupations from "../../components/customer/Occupations.jsx";



 const App=()=>{
   return (
    <div className="d-flex flex-column min-vh-100">
      <div style={{ position: "relative", zIndex: 1200 }}>
        <Header/>
      </div>
      <main className="flex-grow-1" style={{ position: "relative", zIndex: 1 }}>
        <Occupations/>
      </main>
      <Footer compact />
    </div>
   );
 }

 export default App;
