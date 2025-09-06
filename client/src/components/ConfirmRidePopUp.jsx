import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
 // Use your map image here
import { FaSearchLocation, FaMapMarkerAlt } from 'react-icons/fa';
import { IoIosArrowDown } from "react-icons/io";

const ConfirmRidePopUp = (props) => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // Single-capacity guard
    const singleCapacityTypes = new Set(['ev_bike','bike','scooter']);
    const isSingleCapacityVehicle = singleCapacityTypes.has(String(props.vehicleType));
    // Local shared-ride control (visible on user confirm popup)
    const [localShareEnabled, setLocalShareEnabled] = useState(!!props.shareRideEnabled);
    const [localSeats, setLocalSeats] = useState(Number(props.shareMaxSeats || 2));
    // Rewards points selection (user side)
    const [pointsToUse, setPointsToUse] = useState(0);
    const safeFareValue = (() => {
        const f = props.fare;
        const vt = props.vehicleType;
        if (f == null) return 0;
        if (typeof f === 'object') return Number(f?.[vt] || 0);
        return Number(f) || 0;
    })();
    const userTier = (props.user?.rewardsTier || '').toLowerCase();
    const tierPerc = userTier === 'gold' ? 0.10 : userTier === 'silver' ? 0.07 : 0.05;
    const perRideCap = 50; // ₹50 cap
    const maxDiscountByTier = Math.floor(safeFareValue * tierPerc);
    const maxDiscountAllowed = Math.min(perRideCap, maxDiscountByTier);
    const availablePoints = Number(props.user?.rewardsPoints || 0);
    const maxPointsUsable = Math.max(0, Math.min(availablePoints, maxDiscountAllowed));
    const clampedPointsToUse = Math.max(0, Math.min(pointsToUse || 0, maxPointsUsable));
    
    const submitHandler = async (e) => {
        e.preventDefault();
        
        if (!otp || otp.length !== 4) {
            setError('Please enter a valid 4-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const isShared = !!props.ride?.isShared;
            const url = isShared
                ? `${import.meta.env.VITE_BASE_URL}/rides/shared/start`
                : `${import.meta.env.VITE_BASE_URL}/rides/start-ride`;
            const response = await axios.get(url, {
                params: {
                    rideId: props.ride._id,
                    otp: otp
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                console.log('Ride started successfully:', response.data);
                
                // Close current popup and show finish ride popup with ride data
                props.setConfirmRidePopUp(false);
                props.setFinishRidePopUp(true);
                
                // Pass ride data to parent component so it can be passed to FinishRide
                if (props.setRideData) {
                    props.setRideData(response.data.ride);
                }
            }
        } catch (error) {
            console.error('OTP verification failed:', error);
            setError(error.response?.data?.error || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='w-full h-full flex flex-col items-center justify-center rounded-lg'>
        {/* Map Image with route overlay */}
        <h5 onClick={() => props.setConfirmRidePopUp(false)} color='red' className='top-0 right-0'>
            <IoIosArrowDown className='text-gray-400' size={24}/>
        </h5>
        {/* Floating Card */}
        
            {/* Rider Info */}
            <div className='w-[80vw] h-full bg-white rounded-lg'>
            <div className="flex items-center justify-between mt-4 p-3 bg-white rounded-lg">
            <div className="flex items-center gap-3">
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Rider" className="w-10 h-10 rounded-full object-cover" />
                <div className="font-semibold text-gray-800">{props.user?.name || props.user?.username || props.ride?.user?.name || props.ride?.user?.username || 'Rider'}</div>
                <span className="ml-2 bg-green-300 text-xs font-bold px-2 py-1 rounded">ApplePay</span>
                <span className="ml-1 bg-green-300 text-xs font-bold px-2 py-1 rounded">Discount</span>
            </div>
            <div className="flex flex-col items-end">
                {
                  // Safely compute fare whether it's a number or an object keyed by vehicleType
                }
                <div className="font-bold text-3xl text-gray-800">
                  {(() => {
                    const f = props.fare;
                    if (f == null) return '₹—';
                    if (typeof f === 'object') {
                      const val = f?.[props.vehicleType];
                      return `₹${val ?? '—'}`;
                    }
                    return `₹${f}`;
                  })()}
                </div>
                <div className="text-xl text-gray-500">
                  {(() => {
                    const d = props.distance || props.fare?.distance || props.fare?.distanceInKm || props.ride?.distance || props.ride?.distanceInKm || props.ride?.estimatedDistance;
                    if (!d && d !== 0) return '-';
                    const num = Number(d);
                    const km = num >= 1000 ? (num / 1000) : num; // treat values >=1000 as meters
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
            {/* Conditional: OTP Input for Captain OR Simple Buttons for User */}
            <div className="mt-6 px-4">
            {/* Show OTP input only if this is captain side (has ride prop) */}
            {props.ride ? (
                <>
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
                <form onSubmit={submitHandler} className="flex flex-col gap-4">
                    <input 
                        type="text" 
                        placeholder='Enter 4-digit OTP from passenger' 
                        onChange={(e)=>{setOtp(e.target.value)}}
                        value={otp}
                        maxLength={4}
                        className='w-full py-3 px-4 rounded-lg font-mono text-3xl bg-gray-100 text-gray-800 font-semibold outline-none border-2 border-gray-300 focus:border-[#1f3f25]' 
                    />
                    
                    <div className="flex justify-center gap-3 w-full">
                        <button 
                            type="button"
                            className="w-1/3 py-3 rounded-lg bg-gray-400 text-white font-semibold hover:bg-gray-500 transition-colors" 
                            onClick={() => {
                                props.setConfirmRidePopUp(false);
                                props.setVehiclePanelOpen && props.setVehiclePanelOpen(false);
                                props.setLookingForDriver && props.setLookingForDriver(false);
                            }}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="w-1/3 py-3 rounded-lg bg-[#1f3f25] text-white font-bold shadow hover:bg-[#2a4f32] transition-colors text-center flex items-center justify-center disabled:opacity-50"
                            disabled={loading || !otp || otp.length !== 4}
                        >
                            {loading ? 'Starting...' : 'Start Ride'}
                        </button>
                    </div>
                </form>
                </>
            ) : (
                <div className="flex flex-col gap-4 w-full">
                    {/* Share ride controls (disabled for single-capacity vehicles) */}
                    <div className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center gap-4">
                        <label className={`flex items-center gap-2 ${isSingleCapacityVehicle ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input
                                type="checkbox"
                                disabled={isSingleCapacityVehicle}
                                checked={!isSingleCapacityVehicle && localShareEnabled}
                                onChange={(e)=> setLocalShareEnabled(e.target.checked)}
                            />
                            <span className="text-sm font-medium text-gray-700">Share this ride</span>
                        </label>
                        {!isSingleCapacityVehicle && localShareEnabled && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Seats:</span>
                                <select
                                    value={localSeats}
                                    onChange={(e)=> setLocalSeats(Number(e.target.value))}
                                    className="border rounded px-2 py-1"
                                >
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                    <option value={3}>3</option>
                                    <option value={4}>4</option>
                                </select>
                            </div>
                        )}
                        {isSingleCapacityVehicle && (
                            <div className="text-xs text-gray-500">Sharing not available for this vehicle type</div>
                        )}
                    </div>
                    {/* Rewards points application */}
                    <div className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 font-semibold">Rewards</div>
                            <div className="text-xs text-gray-500">Tier: {props.user?.rewardsTier || 'Bronze'} · Available: {availablePoints}</div>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">Max usable now: <span className="font-semibold">{maxPointsUsable}</span></div>
                        <div className="mt-2 flex items-center gap-2">
                            <input
                                type="number"
                                min={0}
                                max={maxPointsUsable}
                                value={clampedPointsToUse}
                                onChange={(e)=> setPointsToUse(Number(e.target.value))}
                                className="w-28 py-2 px-3 rounded border border-gray-300"
                            />
                            <button
                                type="button"
                                onClick={()=> setPointsToUse(maxPointsUsable)}
                                className="py-2 px-3 rounded bg-green-100 text-green-800 text-sm font-semibold hover:bg-green-200"
                            >Use Max</button>
                            <button
                                type="button"
                                onClick={()=> setPointsToUse(0)}
                                className="py-2 px-3 rounded bg-gray-100 text-gray-800 text-sm hover:bg-gray-200"
                            >Clear</button>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                            Estimated final fare: <span className="font-semibold">₹{Math.max(0, safeFareValue - clampedPointsToUse)}</span>
                        </div>
                    </div>
                    <div className="flex justify-center gap-3 w-full">
                        <button 
                            type="button"
                            className="w-1/3 py-3 rounded-lg bg-gray-400 text-white font-semibold hover:bg-gray-500 transition-colors" 
                            onClick={() => {
                                props.setConfirmRidePopUp(false);
                                props.setVehiclePanelOpen && props.setVehiclePanelOpen(false);
                                props.setLookingForDriver && props.setLookingForDriver(false);
                            }}
                        >
                            Cancel
                        </button>
                        <button 
                            type="button"
                            className="w-1/3 py-3 rounded-lg bg-[#1f3f25] text-white font-bold shadow hover:bg-[#2a4f32] transition-colors text-center flex items-center justify-center"
                            onClick={async () => {
                                props.setConfirmRidePopUp(false);
                                const pts = clampedPointsToUse > 0 ? clampedPointsToUse : 0;
                                try {
                                    const allowShare = !isSingleCapacityVehicle && localShareEnabled;
                                    if (allowShare && props.createSharedRide) {
                                        await props.createSharedRide({ rewardsPointsToUse: pts, maxSeats: localSeats });
                                    } else {
                                        await props.createRide({ rewardsPointsToUse: pts });
                                    }
                                } finally {
                                    // Show Looking panel regardless; API errors are logged in parent
                                    props.setLookingForDriver(true);
                                }
                            }}
                        >
                            Confirm Ride
                        </button>
                    </div>
                </div>
            )}
            </div>
            </div>
            </div>
        
    );
};

export default ConfirmRidePopUp;
