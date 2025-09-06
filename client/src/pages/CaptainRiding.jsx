import React, { useRef, useState, useEffect, useContext } from "react";
import { useNavigate ,useLocation} from "react-router-dom";
import SocketDataContext from "../context/SocketDataContext";
import { CiLogout } from "react-icons/ci";
import { FaMapMarkerAlt } from "react-icons/fa";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import FinishRide from "./FinishRide";
import LiveTracking from "../components/LiveTracking";

function CaptainRiding() {
    const navigate = useNavigate();
    const finishRidePopUpPanelRef = useRef(null);
    const [finishRidePopUp, setFinishRidePopUp] = useState(false);
    const [ridePopUp, setRidePopUp] = useState(false);
    const location = useLocation();
    const rideData = location.state?.ride;
    const { socket } = useContext(SocketDataContext);

    // Listen for ride-ended event to navigate captain back to dashboard
    useEffect(() => {
        if (!socket) return;
        const handler = (data) => {
            console.log('Captain received ride-ended event:', data);
            navigate('/captain/home');
        };
        socket.on('ride-ended', handler);
        return () => socket.off('ride-ended', handler);
    }, [socket, navigate]);
    useGSAP(() => {
        if(finishRidePopUp){
            gsap.to(finishRidePopUpPanelRef.current,{
                transform: 'translateY(0)',
            })
        }
        else{
            gsap.to(finishRidePopUpPanelRef.current,{
                transform: 'translateY(100%)',
            })
        }
    },[finishRidePopUp])
    
    return (
        <div className="h-screen w-full overflow-x-hidden">
            <div className="h-[80%] w-full">
                <div className="flex items-center justify-between py-3 px-4 shadow-lg rounded-md">
                <CiLogout size={44} className="text-white" />
                </div>
                <LiveTracking />
            </div>
            <div className="h-[20%] pt-6 bg-amber-300 text-center">
                <div className="pt-4 px-4">
                <h4 className="text-lg md:text-xl text-[#111D1B] pb-3">4 Km Away</h4>
                <button 
                    className="w-full sm:w-75 py-3 rounded-lg bg-[#1f3f25] text-white text-md font-bold shadow hover:bg-[#2a4f32] transition-colors"
                    onClick={() => {
                        setFinishRidePopUp(true);
                    }}
                >
                    Complete Ride
                </button>
                </div>
            </div>
            {finishRidePopUp && (
                <div ref={finishRidePopUpPanelRef} className='fixed inset-x-0 w-full h-screen z-10 bottom-0 translate-y-full px-3 sm:px-0'>
                    <FinishRide 
                        setFinishRidePopUp={setFinishRidePopUp} 
                        setRidePopUp={setRidePopUp}
                        navigate={navigate}
                        rideData={rideData}
                    />
                </div>
            )}
        </div>
    );
}

export default CaptainRiding;
