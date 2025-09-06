import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoadScript } from "@react-google-maps/api";
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import BookRideHome from './pages/BookRideHome';
import CaptainHome from './pages/CaptainHome';
import CaptainRiding from './pages/CaptainRiding';
import Login from './pages/Login';
import Register from './pages/Register';
import Rider from './pages/Rider';
import RiderPayment from './pages/RiderPayment';
import FinishRide from './pages/FinishRide';
import Riding from './pages/Riding';
import UserProtectWrapper from "./components/UserProtectWrapper";
import UserProfile from './pages/UserProfile';

function App() {
  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <div className="min-h-screen flex flex-col">
       <Navbar />
      <main className="flex-1">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        {/** Deprecated route removed: /book-ride (unprotected) */}
        <Route path="/book-ride-home" element={<BookRideHome />} />
        <Route path="/captain/home" element={
          <UserProtectWrapper>
            <CaptainHome />
          </UserProtectWrapper>
        } />
        <Route path="/captain/riding" element={
          <UserProtectWrapper>
            <CaptainRiding />
          </UserProtectWrapper>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/rider" element={<Rider />} />
        <Route path="/riding" element={<Riding/>} />
        <Route path="/rider/payment" element={
          <UserProtectWrapper>
            <RiderPayment />
          </UserProtectWrapper>
        } />
        <Route path="/finish-ride" element={
          <UserProtectWrapper>
            <FinishRide />
          </UserProtectWrapper>
        } />
        <Route path="/profile" element={
          <UserProtectWrapper>
            <UserProfile />
          </UserProtectWrapper>
        } />
        {/* Add more routes as needed */}
      </Routes>
      </main>
       <Footer />
    </div>
    </LoadScript>
  );
}
export default App;