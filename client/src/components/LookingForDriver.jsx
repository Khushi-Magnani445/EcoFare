import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
 // Use your map image here
import { FaSearchLocation, FaMapMarkerAlt } from 'react-icons/fa';
import { IoIosArrowDown } from "react-icons/io";
import RouteProgressMap from './RouteProgressMap';
import SocketDataContext from "../context/SocketDataContext";

const LookingForDriver = (props) => {
    const { socket } = useContext(SocketDataContext);
    const [captainPos, setCaptainPos] = useState(null);

    useEffect(() => {
        if (!socket || !props.captainId) return;
        const handler = (payload) => {
            // payload: { captainId, location: { ltd, lng } }
            if (payload?.captainId === props.captainId && payload.location) {
                setCaptainPos({ lat: payload.location.ltd, lng: payload.location.lng });
            }
        };
        socket.on('captain-location', handler);
        return () => socket.off('captain-location', handler);
    }, [socket, props.captainId]);

    return (
        <div className='w-full h-full bg-black flex flex-col items-center justify-start rounded-lg'>
        {/* Map Image with route overlay */}
        <h5 onClick={() => props.onClose()} color='red' className='top-0 right-0'>
            <IoIosArrowDown className='text-gray-400' size={24}/>
        </h5>
        {/* Live route map to pickup (renders only when captainId available) */}
        {props.captainId && (
            <div className="w-[95%] h-64 md:h-80 my-3 rounded-2xl overflow-hidden bg-gray-200">
                <RouteProgressMap
                    phase={'to_pickup'}
                    captainPos={captainPos}
                    pickup={props.pickup}
                    destination={props.destination}
                    fitBounds={true}
                    showMarkers={true}
                />
            </div>
        )}
        {/* Floating Card */}
        
            {/* Rider Info */}
            <div className='w-[80vw] h-full bg-white rounded-lg'>
                <h2 className='text-4xl font-bold text-gray-800 text-center'>Looking For Driver</h2>
            <div className="flex items-center justify-between mt-4 p-3 bg-white rounded-lg">
            <div className="flex items-center gap-3">
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Rider" className="w-10 h-10 rounded-full object-cover" />
                <div className="font-semibold text-gray-800">{props.user?.name || props.user?.username || 'You'}</div>
                <span className="ml-2 bg-green-300 text-xs font-bold px-2 py-1 rounded">ApplePay</span>
                <span className="ml-1 bg-green-300 text-xs font-bold px-2 py-1 rounded">Discount</span>
            </div>
            <div className="flex flex-col items-end">
                <div className="font-bold text-3xl text-gray-800">₹{props.fare?.[props.vehicleType] ?? props.fare}</div>
                <div className="text-xl text-gray-500">
                  {(() => {
                    const raw = props.distance || props.fare?.distance || props.fare?.distanceInKm || props.ride?.distance || props.ride?.distanceInKm || props.ride?.estimatedDistance;
                    if (raw == null || raw === '') return '-';
                    const num = Number(raw);
                    if (Number.isNaN(num)) return '-';
                    const km = num >= 1000 ? (num / 1000) : num; // convert meters to km if needed
                    return `${km.toFixed(1)} km`;
                  })()}
                </div>
            </div>
            </div>
            {/* Pickup & Dropoff */}
            <div className="mt-3 ml-20">
            <div className="text-xl text-gray-400 font-semibold mb-1">PICK UP</div>
            <div className="flex items-center gap-2 mb-2">
                <FaMapMarkerAlt className="text-green-500" />
                <span className="text-gray-800 font-medium">{props.pickup}</span>
                <FaSearchLocation className="ml-2 text-gray-400" />
            </div>
            <div className="text-xl text-gray-400 font-semibold mb-1 mt-2">DROP OFF</div>
            <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-pink-500" />
                <span className="text-gray-800 font-medium">{props.destination}</span>
            </div>
            </div>
            {/* OTP intentionally not shown here; revealed after confirmation in WaitingForDriver */}
            </div>
        </div>
    );
};

export default LookingForDriver;
