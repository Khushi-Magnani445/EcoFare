import React, { useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom';
import { FaSearchLocation, FaMapMarkerAlt } from 'react-icons/fa';
import { IoIosArrowDown } from "react-icons/io";
import axios from 'axios';
import SocketDataContext from '../context/SocketDataContext';

function FinishRide(props) {
    const { socket } = useContext(SocketDataContext);
    const [alreadyPaid, setAlreadyPaid] = useState(Boolean(props.rideData?.paymentId || props.rideData?.orderId || props.rideData?.signature));
    const [pmethod, setPmethod] = useState(() => (props.rideData?.paymentMethod || 'cod').toLowerCase());

    // Keep fee preview in sync with live updates from user side
    useEffect(() => {
        if (!socket || !props.rideData?._id) return;
        const onMethod = (payload) => {
            const { rideId, paymentMethod } = payload?.data || {};
            if (rideId === props.rideData._id && paymentMethod) {
                setPmethod(String(paymentMethod).toLowerCase());
            }
        };
        const onPaid = (payload) => {
            const rid = payload?.data?.rideId || payload?.rideId;
            if (rid === props.rideData._id) {
                setAlreadyPaid(true);
            }
        };
        socket.on('payment-method-updated', onMethod);
        socket.on('payment-completed', onPaid);
        return () => {
            socket.off('payment-method-updated', onMethod);
            socket.off('payment-completed', onPaid);
        };
    }, [socket, props.rideData?._id]);

    const feePreview = useMemo(() => {
        const fare = Number(props.rideData?.fare || 0);
        const isOnline = alreadyPaid || (pmethod && pmethod !== 'cod');
        const fee = isOnline ? Math.round(fare * 0.02) : 0;
        return { fee, earning: Math.max(0, fare - fee), isOnline };
    }, [alreadyPaid, pmethod, props.rideData?.fare]);

    const endRide = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/end-ride`, {
                rideId: props.rideData._id
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.status === 200) {
                console.log('Ride ended successfully:', response.data);
                // Clear any persisted discount for this ride
                try { sessionStorage.removeItem(`ride_discount_${props.rideData._id}`); } catch {}
                props.setFinishRidePopUp(false);
                props.setRidePopUp && props.setRidePopUp(true);
                props.navigate('/captain/home');
            }
        } catch (error) {
            console.error('Error ending ride:', error);
            const msg = error?.response?.data?.error || 'Failed to end ride. Please try again.';
            alert(msg);
        }
    }
  return (
    <div className='w-full h-full bg-transparent flex flex-col items-center justify-end'>
        {/* Drag handle / close */}
        <h5 onClick={() => props.setFinishRidePopUp(false)} color='red' className='top-0 right-0'>
            <IoIosArrowDown className='text-gray-400' size={24}/>
        </h5>
        {/* Bottom Sheet */}
            {/* Rider Info */}
            <div className='w-full md:w-[92%] bg-white rounded-t-3xl shadow-lg pt-4 pb-6'>
            <div className="flex items-center justify-between mt-4 p-3 bg-white rounded-lg">
            <div className="flex items-center gap-3">
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Rider" className="w-10 h-10 rounded-full object-cover" />
                <div className="font-semibold text-gray-800">{props.rideData?.user?.name}</div>
                <span className="ml-2 bg-green-300 text-xs font-bold px-2 py-1 rounded">ApplePay</span>
                <span className="ml-1 bg-green-300 text-xs font-bold px-2 py-1 rounded">Discount</span>
            </div>
            <div className="flex flex-col items-end">
                {(() => {
                  const baseFare = Number(props.rideData?.fare || 0);
                  let applied = 0;
                  try {
                    const stored = sessionStorage.getItem(`ride_discount_${props.rideData?._id}`);
                    const num = Number(stored);
                    if (!Number.isNaN(num) && num > 0) applied = num;
                  } catch {}
                  const finalFare = Math.max(0, baseFare - applied);
                  return (
                    <div className="flex flex-col items-end">
                      <div className="font-bold text-3xl text-gray-800">₹{finalFare}</div>
                      {applied > 0 && (
                        <>
                          <div className="text-sm text-gray-500 line-through">₹{baseFare}</div>
                          <div className="text-xs text-green-700">Applied discount: ₹{applied}</div>
                        </>
                      )}
                    </div>
                  );
                })()}
                <div className="text-xl text-gray-500">
                  {(() => {
                    const d = props.rideData?.distance || props.rideData?.distanceInKm || props.rideData?.estimatedDistance;
                    if (!d && d !== 0) return '-';
                    const num = Number(d);
                    const km = num >= 1000 ? (num / 1000) : num;
                    return `${km.toFixed(1)} km`;
                  })()}
                </div>
            </div>
            </div>
            {/* Earnings breakdown (UI only) */}
            <div className="px-3 mt-1 text-sm text-gray-700">
              {(() => {
                const fare = Number(props.rideData?.fare || 0);
                const { fee, earning, isOnline } = feePreview;
                return (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between"><span>Total fare</span><span>₹{fare}</span></div>
                    <div className="flex justify-between"><span>Company fee {isOnline ? '(2% online)' : '(COD)'}</span><span>₹{fee}</span></div>
                    <div className="mt-1 border-t pt-2 flex justify-between font-semibold"><span>Your earning</span><span>₹{earning}</span></div>
                  </div>
                );
              })()}
            </div>
            {/* Payment method selection is handled on user side (Riding.jsx) */}
            {/* Pickup & Dropoff */}
            <div className="mt-3 px-3">
            <div className="text-xl text-gray-400 font-semibold mb-1">PICK UP</div>
            <div className="flex items-center gap-2 mb-2">
                <FaMapMarkerAlt className="text-green-500" />
                <span className="text-gray-800 font-medium">{props.rideData?.pickup}</span>
                <FaSearchLocation className="ml-2 text-gray-400" />
            </div>
            <div className="text-xs text-gray-400 font-semibold mb-1 mt-2">DROP OFF</div>
            <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-pink-500" />
                <span className="text-gray-800 font-medium">{props.rideData?.destination}</span>
            </div>
            </div>
            {/* Completed Ride Button */}
            <div className="mt-6 px-4">
                <button
                    className="w-50 py-3 rounded-lg bg-[#1f3f25] text-white font-bold shadow hover:bg-[#2a4f32] transition-colors inline-block text-center"
                    onClick={() => {
                        // Handle ride completion logic here
                        endRide()
                        
                    }}
                >
                    Finish Ride
                </button>
                <br />
                <br /><br />
                <p className='text-red-500 text-sm'>Click finish ride if you have reached the destination and payment had been done</p>
            </div>
            </div>
        </div>
  )
}

export default FinishRide