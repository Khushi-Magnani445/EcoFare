import React from 'react';
import { FaSearchLocation, FaMapMarkerAlt } from 'react-icons/fa';
import { IoIosArrowDown } from "react-icons/io";

import { useContext, useEffect, useState } from 'react';
import RouteProgressMap from './RouteProgressMap';
import SocketDataContext from "../context/SocketDataContext";

const WaitingForDriver = (props) => {
    const { ride } = props;
    if (!ride) return null;

    // Captain info (may already be populated in ride-confirmed payload)
    const captain = ride.captain || {};
    const captainId = typeof ride.captain === 'string'
        ? ride.captain
        : (captain._id || ride.captainId || null);
    const driverName = captain.name || "Driver is on the way";
    const driverImg = "https://randomuser.me/api/portraits/men/44.jpg"; // placeholder
    const fare = ride.fare || "";
    const pickup = ride.pickup || "";
    const destination = ride.destination || "";

    // Live captain position from socket
    const { socket } = useContext(SocketDataContext);
    const [captainPos, setCaptainPos] = useState(null);

    useEffect(() => {
        if (!socket || !captainId) return;
        const handler = (payload) => {
            // payload: { captainId, location: { ltd, lng } }
            if (payload?.captainId === captainId && payload.location) {
                setCaptainPos({ lat: payload.location.ltd, lng: payload.location.lng });
            }
        };
        socket.on('captain-location', handler);
        return () => socket.off('captain-location', handler);
    }, [socket, captainId]);

    // Discount summary is now decided at ride creation
    const discountAmount = Number(ride?.discountAmount || 0);
    const discountPointsUsed = Number(ride?.discountPointsUsed || 0);

    return (
        <div className='w-full h-full flex flex-col items-center justify-start rounded-lg overflow-y-auto'>
            <h5 onClick={() => props.onClose()} color='red' className='top-0 right-0'>
                <IoIosArrowDown className='text-gray-400' size={24}/>
            </h5>
            {/* Live map to pickup (matches captain view pre-OTP) */}
            {captainId && (
                <div className="w-[95%] h-[40vh] sm:h-[45vh] md:h-[50vh] lg:h-[55vh] xl:h-[60vh] my-3 rounded-2xl overflow-hidden bg-gray-200">
                    <RouteProgressMap
                        phase={'to_pickup'}
                        captainPos={captainPos}
                        pickup={pickup}
                        destination={destination}
                        fitBounds={true}
                        showMarkers={true}
                    />
                </div>
            )}
            <div className='w-[95%] md:w-[90%] lg:w-[80%] max-w-3xl h-full bg-white rounded-lg overflow-y-auto'>
                <h2 className='text-4xl font-bold text-gray-800 text-center'>Driver is on the way!</h2>
                <div className="flex items-center justify-between mt-4 p-3 bg-white rounded-lg">
                    <div className="flex items-center gap-3">
                        <img src={driverImg} alt="Driver" className="w-10 h-10 rounded-full object-cover" />
                        <div className="font-semibold text-gray-800">{driverName}</div>
                    </div>
                    <div className="flex flex-col items-end">
                        {(() => {
                            const finalFare = Number(fare) || 0;
                            const originalFare = discountAmount > 0 ? finalFare + discountAmount : null;
                            return (
                                <div className="flex flex-col items-end">
                                    <div className="font-bold text-3xl text-gray-800">₹{finalFare}</div>
                                    {originalFare ? (
                                        <div className="text-sm text-gray-500 line-through">₹{originalFare}</div>
                                    ) : null}
                                    {discountAmount > 0 && (
                                        <div className="text-xs text-green-700">Discount applied: ₹{discountAmount}{discountPointsUsed>0?` (${discountPointsUsed} pts)`:''}</div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
                <div className="mt-3 px-4 md:px-8">
                    <div className="text-xl text-gray-400 font-semibold mb-1">PICK UP</div>
                    <div className="flex items-center gap-2 mb-2">
                        <FaMapMarkerAlt className="text-green-500" />
                        <span className="text-gray-800 font-medium">{pickup}</span>
                        <FaSearchLocation className="ml-2 text-gray-400" />
                    </div>
                    <div className="text-xl text-gray-400 font-semibold mb-1 mt-2">DROP OFF</div>
                    <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-pink-500" />
                        <span className="text-gray-800 font-medium">{destination}</span>
                    </div>
                </div>
                {/* OTP Display for User (shown only after ride is confirmed) */}
                {ride.otp && (
                    <div className="mt-6 px-4 md:px-8">
                        <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 text-center">
                            <h3 className="text-lg font-semibold text-blue-800 mb-2">Your Ride OTP</h3>
                            <div className="text-4xl font-mono font-bold text-blue-900 bg-white py-3 px-6 rounded-lg border-2 border-blue-300 inline-block">
                                {ride.otp}
                            </div>
                            <p className="text-sm text-blue-700 mt-3">
                                Share this OTP with your driver when they arrive at the pickup location
                            </p>
                        </div>
                    </div>
                )}

                {/* Rewards UI removed; discount is applied during Confirm Ride */}
            </div>
        </div>
    );
};

export default WaitingForDriver;