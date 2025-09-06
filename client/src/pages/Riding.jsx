import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SocketDataContext from '../context/SocketDataContext';
import RouteProgressMap from '../components/RouteProgressMap';

const Riding = () => {
    const location = useLocation();
    const { ride } = location.state || {};
    const { socket } = useContext(SocketDataContext);
    const navigate = useNavigate();
    const [captainPos, setCaptainPos] = useState(null);
    const [isPaying, setIsPaying] = useState(false);
    const [paid, setPaid] = useState(Boolean(ride?.paymentId || ride?.orderId || ride?.signature));
    const [paymentMethod, setPaymentMethod] = useState(() => {
        const m = (ride?.paymentMethod || '').toLowerCase();
        if (paid) return 'online';
        if (m === 'online' || m === 'wallet') return 'online';
        return 'cod';
    });

    useEffect(() => {
        if (!socket) return;
        const handler = (payload) => {
            console.log('User received ride-ended event:', payload);
            const endedRide = payload?.ride || payload;
            const rideId = endedRide?._id || ride?._id;
            navigate('/book-ride-home', { state: { rideEnded: true, rideId } });
        };
        socket.on('ride-ended', handler);
        return () => socket.off('ride-ended', handler);
    }, [socket, navigate, ride]);

    // Subscribe to captain live location for route progress
    useEffect(() => {
        if (!socket || !ride) return;
        const capId = typeof ride.captain === 'string' ? ride.captain : (ride.captain?._id || ride.captainId);
        if (!capId) return;
        const handler = (payload) => {
            if (payload?.captainId === capId && payload.location) {
                setCaptainPos({ lat: payload.location.ltd, lng: payload.location.lng });
            }
        };
        socket.on('captain-location', handler);
        return () => socket.off('captain-location', handler);
    }, [socket, ride]);

    // Listen for payment method updates from backend (optional real-time sync)
    useEffect(() => {
        if (!socket || !ride?._id) return;
        const handler = (payload) => {
            const { rideId, paymentMethod: m } = payload?.data || {};
            if (rideId === ride._id && m) {
                setPaymentMethod(String(m).toLowerCase());
            }
        };
        socket.on('payment-method-updated', handler);
        return () => socket.off('payment-method-updated', handler);
    }, [socket, ride]);

    // Fallbacks for missing data
    const captain = ride?.captain || {};
    // Note: server user model nests vehicle under user.captain.vehicle
    const vehicle = (captain.captain && captain.captain.vehicle) || captain.vehicle || {};
    const driverName = captain.fullname?.firstname || captain.name || 'Your Driver';
    const vehiclePlate = vehicle.plateNumber || 'N/A';
    const vehicleModel = vehicle.model || 'Vehicle Model';
    const driverImg = captain.imgUrl || 'https://randomuser.me/api/portraits/men/44.jpg';
    const fare = ride?.fare || '--';
    const destination = ride?.destination || '--';
    const pickup = ride?.pickup || '--';
    const otp = ride?.otp || '--'

    const handlePayment = async () => {
        if (!ride?._id) return;
        setIsPaying(true);
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/rides/complete-payment`,
                { rideId: ride._id },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            setPaid(true);
            alert('Payment successful');
        } catch (e) {
            const status = e?.response?.status;
            const msg = e?.response?.data?.error || 'Payment failed';
            // Treat already-completed as success to avoid duplicate alerts
            if ((status === 400 || status === 200) && /already/i.test(msg)) {
                setPaid(true);
                alert('Payment already completed');
            } else {
                console.error('Payment failed', e);
                alert(msg);
            }
        } finally {
            setIsPaying(false);
        }
    };

    const handlePaymentMethodChange = async (e) => {
        const next = e.target.value;
        setPaymentMethod(next);
        if (!ride?._id) return;
        try {
            await axios.post(
                `${import.meta.env.VITE_BASE_URL}/rides/update-payment-method`,
                { rideId: ride._id, paymentMethod: next },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
        } catch (err) {
            console.error('Failed to update payment method', err);
            const msg = err?.response?.data?.error || 'Failed to update payment method';
            alert(msg);
        }
    };

    return (
        <div className='h-screen bg-gray-100'>
            <Link to='/home' className='fixed right-2 top-2 h-10 w-10 bg-white flex items-center justify-center rounded-full shadow'>
                <i className="text-lg font-medium ri-home-5-line"></i>
            </Link>
            <div className='h-1/2'>
                <RouteProgressMap
                    phase={'to_destination'}
                    captainPos={captainPos}
                    pickup={pickup}
                    destination={destination}
                    fitBounds={true}
                    showMarkers={true}
                />
            </div>
            <div className='h-1/2 p-5'>
                <div className='flex items-center justify-between'>
                    <img className='h-12 w-12 rounded-full object-cover' src={driverImg} alt="Driver" />
                    <div className='text-right'>
                        <h2 className='text-lg font-medium capitalize'>{driverName}</h2>
                        <h4 className='text-xl font-semibold -mt-1 -mb-1'>{vehiclePlate}</h4>
                        <p className='text-sm text-gray-600'>{vehicleModel}</p>
                    </div>
                </div>
                <div className='flex gap-2 justify-between flex-col items-center'>
                    <div className='w-full mt-5'>
                        <div className='flex items-center gap-5 p-3 border-b-2'>
                            <i className="text-lg ri-map-pin-2-fill"></i>
                            <div>
                                <h3 className='text-lg font-medium'>Pickup : {pickup}</h3>
                                <h3 className='text-lg -mt-1 font-medium'>Destination : {destination}</h3>
                            </div>
                        </div>
                        <div className='flex items-center gap-5 p-3'>
                            <i className="ri-currency-line"></i>
                            <div>
                                <h3 className='text-lg font-medium'>₹{fare}</h3>
                                {!paid && (
                                  <div className='mt-1'>
                                    <label className='text-sm text-gray-700 mr-2'>Payment Method</label>
                                    <select
                                      className='border border-gray-300 rounded px-2 py-1 text-sm'
                                      value={paymentMethod}
                                      onChange={handlePaymentMethodChange}
                                    >
                                      <option value='cod'>Cash (COD) - No company fee</option>
                                      <option value='online'>Online/Wallet - 2% company fee</option>
                                    </select>
                                  </div>
                                )}
                                {(() => {
                                  const amt = Number(fare || 0);
                                  const isOnline = paid || paymentMethod !== 'cod';
                                  const fee = isOnline ? Math.round(amt * 0.02) : 0;
                                  return (
                                    <p className='text-sm text-gray-600 mt-1'>Company fee: ₹{fee} {isOnline ? '(online)' : '(COD)'} </p>
                                  );
                                })()}
                                <h2 className='text-lg font-medium'>OTP : {otp}</h2>
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handlePayment}
                    disabled={isPaying || paid}
                    className={`w-full text-white font-semibold p-2 rounded-lg ${paid ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600'}`}
                >
                    {paid ? 'Payment Completed' : (isPaying ? 'Processing…' : 'Make a Payment')}
                </button>
            </div>
        </div>
    );
};

export default Riding; 