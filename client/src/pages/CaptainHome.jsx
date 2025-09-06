import React, { useRef, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

//import mapImage from '../assets/images/Map.jpeg';
import { CiLogout } from "react-icons/ci";
import CaptainDetails from '../components/CaptainDetails';
import RidePopUp from '../components/RidePopUp';
import ConfirmRidePopUp from '../components/ConfirmRidePopUp';
import LiveTracking from '../components/LiveTracking';
import RouteProgressMap from '../components/RouteProgressMap';
import FinishRide from './FinishRide';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import SocketDataContext from "../context/SocketDataContext";
import AuthDataContext from "../context/AuthDataContext";
import axios from 'axios'
const CaptainHome = () => {
    const navigate = useNavigate();
    const [ridePopUp, setRidePopUp] = useState(true);
    const [confirmRidePopUp, setConfirmRidePopUp] = useState(false);
    const [finishRidePopUp, setFinishRidePopUp] = useState(false);
    const ridePopUpPanelRef = useRef(null);
    const confirmRidePopUpPanelRef = useRef(null);
    const finishRidePopUpPanelRef = useRef(null);
    const [ride, setRide] = useState(null);
    const [RidePopUpUserData, setRidePopUpUserData] = useState(null); // Add state for ride data
    const [finishRideData, setFinishRideData] = useState(null); // Store ride data for FinishRide component
    const { socket } = useContext(SocketDataContext);
    const { user } = useContext(AuthDataContext);


    // console.log('CaptainHome - captain:', user);
    // console.log('CaptainHome - socket:', socket);
    // console.log('CaptainHome - localStorage token:', localStorage.getItem("token"));
    // console.log('CaptainHome - localStorage user:', localStorage.getItem("user"));

    useEffect(() => {
        
        try {
            if (user && user._id && socket) {
                const joinPayload = {
                    userId: user._id,
                    role: 'captain',
                    vehicleType: user?.captain?.vehicle?.vehicleType || null,
                };
                console.log('[Captain] Emitting join:', joinPayload);
                socket.emit('join', joinPayload);
                const updateLocation = () => {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition((position) => {
                            const { latitude, longitude } = position.coords;
                            //console.log(latitude,longitude)
                            socket.emit('update-location-captain', {
                                userId: user._id,
                                location: {
                                    ltd: latitude,
                                    lng: longitude
                                }
                            });
                        });
                    } else {
                        console.log('Geolocation is not supported by this browser.');
                    }
                };
                const locationInterval = setInterval(updateLocation, 10000);
                updateLocation();
                
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
    }, [user, socket]);

    useEffect(() => {
        if (!socket) return;
        const handler = (data) => {
            console.log('[Captain] Received new-ride event:', data?._id, {
                rideType: data?.vehicleType,
                pickup: data?.pickup,
                destination: data?.destination,
            });
            const captainVehicleType = user?.captain?.vehicle?.vehicleType;
            console.log('[Captain] Vehicle type check:', { rideType: data?.vehicleType, captainVehicleType });
            if (data?.vehicleType && captainVehicleType && data.vehicleType !== captainVehicleType) {
                console.log('[Captain] Ignoring ride due to vehicle type mismatch');
                return;
            }
            console.log('[Captain] Accepting ride and opening popup');
            setRidePopUpUserData(data.user);
            setRide(data);
            setRidePopUp(true);
        };
        socket.on('new-ride', handler);
        return () => {
            socket.off('new-ride', handler);
        };
    }, [socket, user]);

    // Listen for shared rides separately (namespaced event)
    useEffect(() => {
        if (!socket) return;
        const onShared = (data) => {
            console.log('[Captain] Received new-shared-ride event:', data?._id, {
                rideType: data?.vehicleType,
                pickup: data?.pickup,
                destination: data?.destination,
            });
            const captainVehicleType = user?.captain?.vehicle?.vehicleType;
            if (data?.vehicleType && captainVehicleType && data.vehicleType !== captainVehicleType) {
                console.log('[Captain] Ignoring shared ride due to vehicle type mismatch');
                return;
            }
            setRidePopUpUserData(data.user);
            setRide({ ...data, isShared: true });
            setRidePopUp(true);
        };
        socket.on('new-shared-ride', onShared);
        return () => socket.off('new-shared-ride', onShared);
    }, [socket, user]);

    // On ride end: reset to default state so map shows LiveTracking (current captain location only)
    useEffect(() => {
        if (!socket) return;
        const onEnded = (data) => {
            console.log('Captain received ride-ended:', data);
            setRide(null);
            setFinishRideData(null);
            setRidePopUp(false);
            setConfirmRidePopUp(false);
            setFinishRidePopUp(false);
        };
        socket.on('ride-ended', onEnded);
        return () => socket.off('ride-ended', onEnded);
    }, [socket]);

    // Reset on shared ride ended
    useEffect(() => {
        if (!socket) return;
        const onEnded = (data) => {
            console.log('Captain received shared-ride-ended:', data);
            setRide(null);
            setFinishRideData(null);
            setRidePopUp(false);
            setConfirmRidePopUp(false);
            setFinishRidePopUp(false);
        };
        socket.on('shared-ride-ended', onEnded);
        return () => socket.off('shared-ride-ended', onEnded);
    }, [socket]);

    async function confirmRide(){
       const isShared = !!ride?.isShared;
       const url = isShared
            ? `${import.meta.env.VITE_BASE_URL}/rides/shared/confirm`
            : `${import.meta.env.VITE_BASE_URL}/rides/confirm`;
       const response = await axios.post(url,{
            rideId : ride._id,
            captainId : user._id,
       },{
            headers:{
                Authorization : `Bearer ${localStorage.getItem("token")}`
            }
       })
       setRidePopUp(false)
       setConfirmRidePopUp(true) 
    }

    useGSAP(() => {
        if (ridePopUpPanelRef.current) {
            if (ridePopUp) {
                gsap.to(ridePopUpPanelRef.current, {
                    transform: 'translateY(0)',
                });
            } else {
                gsap.to(ridePopUpPanelRef.current, {
                    transform: 'translateY(100%)',
                });
            }
        }
    }, [ridePopUp]);

    useGSAP(() => {
        if (confirmRidePopUpPanelRef.current) {
            if (confirmRidePopUp) {
                gsap.to(confirmRidePopUpPanelRef.current, {
                    transform: 'translateY(0)',
                });
            } else {
                gsap.to(confirmRidePopUpPanelRef.current, {
                    transform: 'translateY(100%)',
                });
            }
        }
    }, [confirmRidePopUp]);

    useGSAP(() => {
        if (finishRidePopUpPanelRef.current) {
            if (finishRidePopUp) {
                gsap.to(finishRidePopUpPanelRef.current, {
                    transform: 'translateY(0)',
                });
            } else {
                gsap.to(finishRidePopUpPanelRef.current, {
                    transform: 'translateY(100%)',
                });
            }
        }
    }, [finishRidePopUp]);

    return (
        <div className="min-h-screen w-full bg-gray-50 overflow-x-hidden">
            {/* Map Area */}
            <div className='w-full h-96 md:h-146 flex flex-col'>
                <div className='h-12 px-4 flex items-center justify-between shadow-lg rounded-md'>
                    <CiLogout size={44} className="text-white" />
                </div>
                {ride ? (
                    <RouteProgressMap
                        phase={finishRideData ? 'to_destination' : 'to_pickup'}
                        pickup={ride?.pickup}
                        destination={ride?.destination}
                        fitBounds={true}
                        showMarkers={true}
                    />
                ) : (
                    <LiveTracking />
                )}
                
            </div>
            {/* Captain Details */}
            <div className="w-full px-4 my-12 md:my-24">
                <CaptainDetails />
            </div>
            {/* Ride Pop Up */}
            
            
            {ridePopUp && ride && (
                
                <div ref={ridePopUpPanelRef} className='fixed w-full z-50 bottom-0'>
                    {console.log("ride", ride)}
                    {console.log("ridePopUp", ridePopUp)}
                    <RidePopUp
                        ride={ride}
                        setRidePopUp={setRidePopUp}
                        setConfirmRidePopUp={setConfirmRidePopUp}
                        user={RidePopUpUserData}
                        confirmRide = {confirmRide}
                    />
                </div>
            )}
            {/* Confirm Ride Pop Up */}
            {confirmRidePopUp && (
                <div ref={confirmRidePopUpPanelRef} className='fixed inset-x-0 w-full h-screen z-50 bottom-0 translate-y-full px-3 sm:px-0'>
                    <ConfirmRidePopUp
                        ride={ride}
                        user={RidePopUpUserData}
                        fare={ride?.fare}
                        vehicleType={ride?.vehicleType}
                        pickup={ride?.pickup}
                        destination={ride?.destination}
                        setConfirmRidePopUp={setConfirmRidePopUp}
                        setRidePopUp={setRidePopUp}
                        setFinishRidePopUp={setFinishRidePopUp}
                        setRideData={setFinishRideData}
                        navigate={navigate}
                    />
                </div>
            )}
            {/* Finish Ride Pop Up */}
            {finishRidePopUp && (
                <div ref={finishRidePopUpPanelRef} className='fixed inset-x-0 w-full h-screen z-50 bottom-0 translate-y-full px-3 sm:px-0'>
                    <FinishRide 
                        setFinishRidePopUp={setFinishRidePopUp} 
                        navigate={navigate} 
                        rideData={finishRideData}
                    />
                </div>
            )}
           
        </div>
    
    );
};

export default CaptainHome; 