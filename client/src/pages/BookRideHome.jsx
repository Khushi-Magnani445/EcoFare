import { useState, useRef, useEffect, useContext } from "react";
import axios from "axios";
import gsap from "gsap";
import LocationSearchPanel from "../components/LocationSearchPanel";
import VehiclePanel from "../components/VehiclePanel";
import ConfirmRidePopUp from "../components/ConfirmRidePopUp";
import LookingForDriver from "../components/LookingForDriver";
import WaitingForDriver from "../components/WaitingForDriver";
import LiveTracking from "../components/LiveTracking";
import RatingModal from "../components/RatingModal";
import SocketDataContext from "../context/SocketDataContext";
import AuthDataContext from "../context/AuthDataContext";
import { useNavigate, useLocation } from "react-router-dom";
const BASE_URL = import.meta.env.VITE_BASE_URL;
export default function BookRideHome() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [fare, setFare] = useState({});
  const [otp,setOtp] = useState('')
  const [vehicleType, setVehicleType] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null); // 'pickup' or 'destination'
  const [panelOpen, setPanelOpen] = useState(false); // for suggestions
  const [showVehiclePanel, setShowVehiclePanel] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showLookingForDriver, setShowLookingForDriver] = useState(false);
  const [showWaitingForDriver, setShowWaitingForDriver] = useState(false);
  const [confirmRide,setConfirmRide] = useState(null);
  const [createdRide, setCreatedRide] = useState(null);
  // Shared ride UI state
  const [shareRideEnabled, setShareRideEnabled] = useState(false);
  const [shareMaxSeats, setShareMaxSeats] = useState(2);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rideToRateId, setRideToRateId] = useState(null);
  const { socket } = useContext(SocketDataContext);
  const { user, setUser } = useContext(AuthDataContext);
  // controls which panel is visible
  const formPanelRef = useRef();
  const vehiclePanelRef = useRef();
  const suggestionPanelRef = useRef();
  const confirmPopupRef = useRef();
  const lookingForDriverRef = useRef();
  const waitingForDriverRef = useRef();

  const navigate = useNavigate()
  const location = useLocation();
  
  // Animate form/vehicle panel transitions
  console.log('BookRideHome - user:', user);
  console.log('BookRideHome - socket:', socket);
  console.log('BookRideHome - localStorage token:', localStorage.getItem("token"));
  console.log('BookRideHome - localStorage user:', localStorage.getItem("user"));
  
  useEffect(()=>{
    try {
      console.log('BookRideHome useEffect - user:', user);
      console.log('BookRideHome useEffect - socket:', socket);
      
      if (user && user._id && socket) {
        console.log('Sending join message with user data:', {
          userId: user._id,
          role: 'user'
        });
        
        socket.emit('join', {
          userId: user._id,
          role: 'user'
        });
      } else {
        console.log('User or socket not available:', { 
          user: user, 
          socket: socket,
          hasUserId: user && user._id,
          hasSocket: !!socket
        });
      }
    } catch (error) {
      console.error('Error in socket join:', error);
    }
  },[user, socket]);

  // Open rating modal if navigated here after a ride ended
  useEffect(() => {
    const state = location.state;
    if (state?.rideEnded && state?.rideId) {
      setRideToRateId(state.rideId);
      setShowRatingModal(true);
      // Clear state so back/refresh doesn't re-open
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // Re-emit join on reconnect to avoid stale/missing socketId at critical events
  useEffect(() => {
    if (!socket || !user || !user._id) return;
    const onConnect = () => {
      try {
        console.log('[User] socket reconnected, re-sending join', { userId: user._id });
        socket.emit('join', { userId: user._id, role: 'user' });
      } catch (e) {
        console.error('Failed to re-emit join on reconnect', e);
      }
    };
    socket.on('connect', onConnect);
    return () => socket.off('connect', onConnect);
  }, [socket, user]);

  useEffect(() => {
    if (!socket) return;
    const handler = (payload) => {
      try {
        console.log('[User] ride-confirmed event received:', payload);
        // Support both shapes: ride object directly, or { ride }
        const ride = payload?.ride || payload;
        if (!ride || !ride._id) {
          console.warn('[User] ride-confirmed payload missing ride id');
          return;
        }
        setConfirmRide(ride);
        setShowLookingForDriver(false); // Close Looking for Driver
        setShowWaitingForDriver(true);  // Open Waiting for Driver
      } catch (e) {
        console.error('[User] error handling ride-confirmed:', e);
      }
    };
    socket.on('ride-confirmed', handler);
    return () => socket.off('ride-confirmed', handler);
  }, [socket]);

  // Shared ride: confirmed
  useEffect(() => {
    if (!socket) return;
    const handler = (payload) => {
      try {
        const ride = payload?.ride || payload;
        if (!ride || !ride._id) return;
        setConfirmRide(ride);
        setShowLookingForDriver(false);
        setShowWaitingForDriver(true);
      } catch (e) {
        console.error('[User] error handling shared-ride-confirmed:', e);
      }
    };
    socket.on('shared-ride-confirmed', handler);
    return () => socket.off('shared-ride-confirmed', handler);
  }, [socket]);

  // If captain cancels after accept/OTP stage, backend re-queues the ride
  // Show LookingForDriver again and clear OTP/confirmed ride state
  useEffect(() => {
    if (!socket) return;
    const reopenLooking = (payload) => {
      try {
        console.log('[User] requeue signal received:', payload);
        const ride = payload?.data?.ride || payload?.ride || payload?.data || payload;
        if (ride && ride._id) {
          setCreatedRide(ride);
        }
        setOtp('');
        setConfirmRide(null);
        setShowWaitingForDriver(false);
        setShowConfirmPopup(false);
        setShowLookingForDriver(true);
      } catch (e) {
        console.error('[User] error handling requeue signal:', e);
      }
    };
    const onRequeued = (payload) => reopenLooking(payload);
    const onStatusUpdated = (payload) => {
      const ride = payload?.data?.ride || payload?.ride || payload?.data || payload;
      const status = ride?.status || payload?.data?.status || payload?.status;
      if (status === 'pending') reopenLooking(payload);
    };
    // Defensive: handle a potential explicit cancel event name as well
    const onCancelled = (payload) => reopenLooking(payload);
    socket.on('ride-requeued', onRequeued);
    socket.on('ride-status-updated', onStatusUpdated);
    socket.on('ride-cancelled', onCancelled);
    return () => {
      socket.off('ride-requeued', onRequeued);
      socket.off('ride-status-updated', onStatusUpdated);
      socket.off('ride-cancelled', onCancelled);
    };
  }, [socket]);

  useEffect(()=>{
    if(!socket) return;
    socket.on('ride-started',ride=>{
      setShowWaitingForDriver(false);
      navigate('/riding',{state :{ride}})
    });
    return ()=> socket.off('ride-started')
  },[socket,navigate])

  // Shared ride: started
  useEffect(() => {
    if (!socket) return;
    const onStarted = (payload) => {
      const ride = payload?.ride || payload;
      setShowWaitingForDriver(false);
      navigate('/riding', { state: { ride } });
    };
    socket.on('shared-ride-started', onStarted);
    return () => socket.off('shared-ride-started', onStarted);
  }, [socket, navigate]);

  // When ride ends, show rating modal to the user
  useEffect(() => {
    if (!socket) return;
    const onRideEnded = (payload) => {
      const ride = payload?.ride || payload;
      try {
        const rideId = ride?._id;
        if (!rideId) return;
        setRideToRateId(rideId);
        setShowRatingModal(true);
      } catch {
        console.log('ride-ended failed');
      }
    };
    socket.on('ride-ended', onRideEnded);
    return () => socket.off('ride-ended', onRideEnded);
  }, [socket]);

  // Shared ride: ended
  useEffect(() => {
    if (!socket) return;
    const onEnded = (payload) => {
      const ride = payload?.ride || payload;
      try {
        const rideId = ride?._id;
        if (!rideId) return;
        setRideToRateId(rideId);
        setShowRatingModal(true);
      } catch {
        console.log('shared-ride-ended failed');
      }
    };
    socket.on('shared-ride-ended', onEnded);
    return () => socket.off('shared-ride-ended', onEnded);
  }, [socket]);
  
  useEffect(() => {
    if (showVehiclePanel) {
      gsap.to(formPanelRef.current, { y: "100%", opacity: 0, duration: 0.4, pointerEvents: "none" });
      gsap.to(vehiclePanelRef.current, { y: "0%", opacity: 1, duration: 0.4, pointerEvents: "auto" });
    } else {
      gsap.to(formPanelRef.current, { y: "0%", opacity: 1, duration: 0.4, pointerEvents: "auto" });
      gsap.to(vehiclePanelRef.current, { y: "100%", opacity: 0, duration: 0.4, pointerEvents: "none" });
    }
  }, [showVehiclePanel]);

  useEffect(() => {
    if (showConfirmPopup) {
      gsap.to(formPanelRef.current, { y: "100%", opacity: 0, duration: 0.4, pointerEvents: "none" });
      gsap.to(vehiclePanelRef.current, { y: "0%", opacity: 0, duration: 0.4, pointerEvents: "auto" });
      gsap.to(confirmPopupRef.current, { y: "0%", opacity: 1, duration: 0.4, pointerEvents: "auto" });
    } else {
      gsap.to(formPanelRef.current, { y: "0%", opacity: 1, duration: 0.4, pointerEvents: "auto" });
      gsap.to(vehiclePanelRef.current, { y: "100%", opacity: 0, duration: 0.4, pointerEvents: "none" });
      gsap.to(confirmPopupRef.current, { y: "100%", opacity: 0, duration: 0.4, pointerEvents: "none" });
    }
  }, [showConfirmPopup]);

  // Fetch fresh profile (to get latest rewardsPoints) when confirming ride
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !showConfirmPopup) return;
        const res = await axios.get(`${BASE_URL.replace(/\/$/, '')}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res?.data?.user) {
          setUser(res.data.user);
        }
      } catch (e) {
        console.warn('Failed to refresh profile for rewards points:', e?.response?.data || e?.message);
      }
    };
    fetchProfile();
  }, [showConfirmPopup, setUser]);

  useEffect(() => {
    if (showLookingForDriver) {
      gsap.to(formPanelRef.current, { y: "100%", opacity: 0, duration: 0.4, pointerEvents: "none" });
      gsap.to(vehiclePanelRef.current, { y: "0%", opacity: 0, duration: 0.4, pointerEvents: "auto" });
      gsap.to(lookingForDriverRef.current, { y: "0%", opacity: 1, duration: 0.4, pointerEvents: "auto" });
    } else {
      gsap.to(formPanelRef.current, { y: "0%", opacity: 1, duration: 0.4, pointerEvents: "auto" });
      gsap.to(vehiclePanelRef.current, { y: "100%", opacity: 0, duration: 0.4, pointerEvents: "none" });
      gsap.to(lookingForDriverRef.current, { y: "100%", opacity: 0, duration: 0.4, pointerEvents: "none" });
    }
  }, [showLookingForDriver]);

  useEffect(() => {
    if (showWaitingForDriver) {
      gsap.to(waitingForDriverRef.current, { y: "0%", opacity: 1, duration: 0.4, pointerEvents: "auto" });
    } else {
      gsap.to(waitingForDriverRef.current, { y: "100%", opacity: 0, duration: 0.4, pointerEvents: "none" });
    }
  }, [showWaitingForDriver]);

  // Fetch suggestions from backend
  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      setPanelOpen(false);
      return;
    }
    try {
      const res = await axios.get(`${BASE_URL}/maps/get-suggestions`, {
        params: { query },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const suggestions = res.data.suggestions || [];
      setSuggestions(suggestions);
      console.log("Suggestions:", suggestions);
      setPanelOpen(true);
    } catch {
      setSuggestions([]);
      setPanelOpen(false);
    }
  };

  // Handle input change
  const handleInputChange = (e, type) => {
    const value = e.target.value;
    if (type === "pickup") setPickup(value);
    else setDestination(value);
    setActiveField(type);
    fetchSuggestions(value);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    if (activeField === "pickup") setPickup(suggestion);
    else setDestination(suggestion);
    setPanelOpen(false);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPanelOpen(false);
    // Auth gate: require login before searching fares
    const token = localStorage.getItem("token");
    if (!token || !user || !user._id) {
      navigate('/login', { state: { redirectTo: '/book-ride-home' } });
      return;
    }
    setShowVehiclePanel(true);

    const res = await axios.get(`${BASE_URL}/rides/get-fare`,{
      params:{pickup,destination},
      headers:{
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
    console.log(res.data);
    setFare(res.data);
  };

  const createRide = async (opts = {}) => {
    try {
      console.log('[User] Creating ride...', { pickup, destination, vehicleType, userId: user?._id });
      const payload = {
        pickup,
        destination,
        vehicleType
      };
      if (typeof opts.rewardsPointsToUse === 'number' && opts.rewardsPointsToUse > 0) {
        payload.rewardsPointsToUse = opts.rewardsPointsToUse;
      }
      const res = await axios.post(`${BASE_URL}/rides/create`,{
        ...payload
      },{
        headers:{
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      })
      console.log('[User] /rides/create success:', res.data);
      console.log('[User] OTP:', res.data.ride.otp);
      setOtp(res.data.ride.otp);
      setCreatedRide(res.data.ride); // Store the complete ride data with OTP
    } catch (err) {
      console.error('[User] /rides/create failed:', err?.response?.data || err?.message);
    }
  }

  // Create SHARED ride (now in component scope, not inside useEffect)
  const createSharedRide = async (opts = {}) => {
    try {
      const maxSeats = Number(opts.maxSeats ?? shareMaxSeats) || 2;
      console.log('[User] Creating SHARED ride...', { pickup, destination, vehicleType, userId: user?._id, maxSeats });
      const payload = {
        pickup,
        destination,
        vehicleType,
        maxSeats
      };
      if (typeof opts.discountFactor === 'number') {
        payload.discountFactor = opts.discountFactor;
      }
      if (typeof opts.rewardsPointsToUse === 'number' && opts.rewardsPointsToUse > 0) {
        payload.rewardsPointsToUse = opts.rewardsPointsToUse;
      }
      const res = await axios.post(`${BASE_URL}/rides/shared/create`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('[User] /rides/shared/create success:', res.data);
      setOtp(res.data?.ride?.otp || '');
      setCreatedRide(res.data.ride);
    } catch (err) {
      console.error('[User] /rides/shared/create failed:', err?.response?.data || err?.message);
    }
  };

  // Close suggestion panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionPanelRef.current &&
        !suggestionPanelRef.current.contains(event.target) &&
        event.target.getAttribute("name") !== "pickup" &&
        event.target.getAttribute("name") !== "destination"
      ) {
        setPanelOpen(false);
      }
    };
    if (panelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [panelOpen]);

  return (
    <div className="book-ride-home w-screen min-h-screen flex flex-col bg-gray-100 overflow-x-hidden">
      {/* Map Placeholder */}
      <div className="w-full h-[45vh] md:h-[60vh] bg-gray-300 flex items-center justify-center text-2xl font-bold">
        <LiveTracking />
      </div>
      {/* Form Panel (slide up) */}
      {!showVehiclePanel && !showConfirmPopup && <div
        ref={formPanelRef}
        className="bottom-0 z-30 w-full bg-white rounded-t-3xl shadow-lg p-6 sm:p-8 transition-all flex flex-col items-center justify-center"
        style={{ y: 0, opacity: 1 }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-lg px-2">
          <label className="flex flex-col text-lg font-semibold">
            Pickup Location
            <input
              name="pickup"
              type="text"
              value={pickup}
              onChange={(e) => handleInputChange(e, "pickup")}
              onFocus={() => {
                setActiveField("pickup");
                setPanelOpen(!!pickup);
                fetchSuggestions(pickup);
              }}
              placeholder="Enter pickup location"
              autoComplete="off"
              className="mt-2 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#709775]"
            />
          </label>
          <label className="flex flex-col text-lg font-semibold">
            Destination
            <input
              name="destination"
              type="text"
              value={destination}
              onChange={(e) => handleInputChange(e, "destination")}
              onFocus={() => {
                setActiveField("destination");
                setPanelOpen(!!destination);
                fetchSuggestions(destination);
              }}
              placeholder="Enter destination"
              autoComplete="off"
              className="mt-2 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#709775]"
            />
          </label>
          <button type="submit" className="book-btn bg-green-600 text-white py-3 rounded-lg text-lg sm:text-xl font-bold mt-1 sm:mt-2 hover:bg-green-700 transition w-full">
            Book Ride
          </button>
        </form>
        {/* Suggestion Panel */}
        {panelOpen && (
          <div ref={suggestionPanelRef} className="mt-2 w-full max-w-lg px-2 max-h-60 overflow-auto">
            <LocationSearchPanel
              suggestions={suggestions}
              onSelect={handleSuggestionClick}
            />
          </div>
        )}
      </div>}
      {/* Vehicle Panel (slide up, covers lower half) */}
      {showVehiclePanel && !showConfirmPopup && 
      <div
        ref={vehiclePanelRef}
        className="fixed left-0 bottom-0 w-[100vw] h-[60vh] z-40 bg-white rounded-t-3xl shadow-lg transition-all flex flex-col"
        style={{ y: "100%", opacity: 0, pointerEvents: "none" }}
      >
        <VehiclePanel
          pickup={pickup}
          destination={destination}
          fare={fare}
          
          onClose={() => setShowVehiclePanel(false)}
          onSelectVehicle={(vehicle) => {
            
            setShowVehiclePanel(false);
            setShowConfirmPopup(true);
            setVehicleType(vehicle);
          }}
        />
      </div>}

      <div
      ref={confirmPopupRef}
      className="fixed left-0 bottom-0 w-[100vw] h-[60vh] z-50 bg-white rounded-t-3xl shadow-lg transition-all flex flex-col overflow-y-auto"
      style={{ y: "100%", opacity: 0, pointerEvents: "none" }}
      >
      {showConfirmPopup && (
        <ConfirmRidePopUp
          pickup={pickup}
          destination={destination}
          fare={fare}
          vehicleType={vehicleType}
          user={user}
          setConfirmRidePopUp = {setShowConfirmPopup}
          setVehiclePanelOpen = {setShowVehiclePanel}
          setLookingForDriver = {setShowLookingForDriver}
          createRide = {(opts = {}) => createRide(opts)}
          createSharedRide = {(opts = {}) => createSharedRide(opts)}
          shareRideEnabled={shareRideEnabled}
          shareMaxSeats={shareMaxSeats}

          onClose={() => setShowConfirmPopup(false)}

        />
      )}
      </div>
      <div
      ref={lookingForDriverRef}
      className="fixed left-0 bottom-0 w-[100vw] h-[60vh] z-50 bg-white rounded-t-3xl shadow-lg transition-all flex flex-col overflow-y-auto"
      style={{ y: "100%", opacity: 0, pointerEvents: "none" }}
      >
      {showLookingForDriver && (
        <LookingForDriver
          pickup={pickup}
          destination={destination}
          fare={fare}
          vehicleType={vehicleType}
          ride={createdRide}
          user={user}
          setConfirmRidePopUp = {setShowConfirmPopup}
          setVehiclePanelOpen = {setShowVehiclePanel}
          setLookingForDriver = {setShowLookingForDriver}
          createRide = {createRide}
          
          onClose={() => setShowLookingForDriver(false)}
          
        />
      )}
      </div>

      <div
      ref={waitingForDriverRef}
      className="fixed left-0 bottom-0 w-[100vw] h-[90vh] md:h-[92vh] z-50 bg-white rounded-t-3xl shadow-lg transition-all flex flex-col overflow-y-auto"
      style={{ y: "100%", opacity: 0, pointerEvents: "none" }}
      >
      {showWaitingForDriver && (
        <WaitingForDriver
          pickup={pickup}
          destination={destination}
          fare={fare}
          vehicleType={vehicleType}
          setConfirmRidePopUp = {setShowConfirmPopup}
          setVehiclePanelOpen = {setShowVehiclePanel}
          setLookingForDriver = {setShowLookingForDriver}
          createRide = {createRide}
          ride = {confirmRide}
          otp = {otp}
          
          onClose={() => setShowWaitingForDriver(false)}
          
        />
      )}
      </div>
      {showRatingModal && !!rideToRateId && (
        <RatingModal
          rideId={rideToRateId}
          onClose={(submitted) => {
            setShowRatingModal(false);
            setRideToRateId(null);
            if (submitted) {
              // Optionally toast success
            }
          }}
        />
      )}
    </div>
  );
}

