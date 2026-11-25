
import { Outlet } from "react-router-dom";
import Header from '../../components/general/Header.jsx'
import Footer from "../../components/general/Footer.jsx";
import Occupations from "../../components/customer/Occupations.jsx";



 const App=()=>{
   return (
    <div className="d-flex flex-column min-vh-100">
      <div className="border-1 border-black">
        <Header/>
      </div>
      <main className="flex-grow-1">
        <Occupations/>
      </main>
      <Footer compact />
    </div>
   );
 }

 export default App;
