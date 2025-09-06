import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios';
import { FaUserCircle, FaSearch, FaCog, FaMapMarkerAlt, FaMoon, FaClock, FaRoad, FaCar, FaDollarSign, FaStar } from 'react-icons/fa';
import AuthDataContext  from '../context/AuthDataContext';
import SocketDataContext from '../context/SocketDataContext';

import { Link } from 'react-router-dom';

function CaptainDetails() {
    const { user } = useContext(AuthDataContext);
    const { socket } = useContext(SocketDataContext);
    const [earningsToday, setEarningsToday] = useState(user?.captain?.earningsToday || 0);
    const [totalRides, setTotalRides] = useState(0);
    const [totalDistanceKm, setTotalDistanceKm] = useState(0);
    const [hoursOnline, setHoursOnline] = useState(0);
    const [efficiencyScore, setEfficiencyScore] = useState(Number(user?.captain?.efficiencyScore || 0));

    useEffect(() => {
        setEarningsToday(user?.captain?.earningsToday || 0);
    }, [user]);

    useEffect(() => {
        if (!socket) return;
        const handler = (payload) => {
            if (payload?.earningsToday != null) {
                setEarningsToday(payload.earningsToday);
            }
        };
        socket.on('earnings-updated', handler);
        return () => socket.off('earnings-updated', handler);
    }, [socket]);

    // Listen for aggregate stats pushes (total rides, distance)
    useEffect(() => {
        if (!socket) return;
        const onStats = (stats) => {
            if (stats?.totalRides != null) setTotalRides(stats.totalRides);
            if (stats?.totalDistanceKm != null) setTotalDistanceKm(Number(stats.totalDistanceKm));
            if (stats?.efficiencyScore != null) setEfficiencyScore(Number(stats.efficiencyScore));
        };
        socket.on('captain-stats-updated', onStats);
        return () => socket.off('captain-stats-updated', onStats);
    }, [socket]);

    // Fetch captain aggregate stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                if (!user || user.role !== 'captain') return;
                const token = localStorage.getItem('token');
                const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/captain/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTotalRides(res.data?.totalRides || 0);
                setTotalDistanceKm(Number(res.data?.totalDistanceKm || 0));
                if (res.data?.efficiencyScore != null) {
                    setEfficiencyScore(Number(res.data.efficiencyScore));
                }
                // Apply earnings with client-side rollover check as an extra guard
                const serverEarnings = Number(res.data?.earningsToday || 0);
                const lastReset = res.data?.earningsLastReset ? new Date(res.data.earningsLastReset) : null;
                if (lastReset) {
                    const now = new Date();
                    const sameDay = lastReset.getFullYear() === now.getFullYear() && lastReset.getMonth() === now.getMonth() && lastReset.getDate() === now.getDate();
                    setEarningsToday(sameDay ? serverEarnings : 0);
                } else {
                    setEarningsToday(serverEarnings);
                }
            } catch (e) {
                // keep defaults on error
            }
        };
        fetchStats();
    }, [user]);

    // Hours online tracker (session-based). Starts when component mounts.
    useEffect(() => {
        if (!user || user.role !== 'captain') return;
        const key = `captainOnlineStart:${user._id}`;
        let startTs = Number(localStorage.getItem(key));
        if (!startTs) {
            startTs = Date.now();
            localStorage.setItem(key, String(startTs));
        }
        const update = () => {
            const ms = Date.now() - Number(localStorage.getItem(key));
            setHoursOnline(ms / (1000 * 60 * 60));
        };
        update();
        const id = setInterval(update, 60000); // update every minute
        return () => clearInterval(id);
    }, [user]);

    // console.log(user);
    
    if(!user || user.role !== 'captain'){
        return <Link to='/login'>Login</Link>
    }
    return (
        <div>

            <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center">
            {/* Profile Row */}
            <div className="flex items-center justify-between w-full mb-4">
                <div className="flex items-center gap-3">
                <FaUserCircle size={40} className="text-gray-400" />
                <div>
                    <div className="font-semibold text-lg text-gray-800">{user.name}</div>
                    <div className="text-xs text-gray-500">
                      {user.captain?.vehicle?.vehicleType?.toUpperCase() || 'CAPTAIN'}
                    </div>
                </div>
                </div>
                <div className="text-xl font-bold text-green-700">₹{Number(earningsToday).toFixed(2)}</div>
            </div>
            
            {/* Captain Details */}
            {user.captain && (
              <div className="w-full mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2 text-2xl">Captain Details</h3>
                <div className="grid grid-cols-2 gap-4 mt-10">
                  <div>
                    <span className="text-gray-600 text-lg font-semibold">Experience:</span>
                    <span className="ml-2 font-semibold font-mono text-lg">{user.captain.experienceYears} years</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-semibold">Vehicle:</span>
                    <span className="ml-2 font-semibold font-mono">{user.captain.vehicle.model}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-semibold">Plate Number:</span>
                    <span className="ml-2 font-semibold font-mono">{user.captain.vehicle.plateNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-semibold">Capacity:</span>
                    <span className="ml-2 font-semibold font-mono">{user.captain.vehicle.capacity} seats</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-semibold">Color:</span>
                    <span className="ml-2 font-semibold font-mono">{user.captain.vehicle.color}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-semibold">Eco-friendly:</span>
                    <span className="ml-2 font-semibold font-mono">{user.captain.vehicle.ecoFriendly ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            )}
            {/* Stats Boxes */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full mt-2">
                <div className="flex flex-col items-center bg-[#98C39E] rounded-xl py-4 px-2 w-full">
                <FaClock className="text-yellow-700 mb-1" size={22} />
                <div className="font-bold text-lg text-gray-800">{hoursOnline.toFixed(1)}</div>
                <div className="text-xs text-gray-900">HOURS ONLINE</div>
                </div>
                <div className="flex flex-col items-center bg-[#98C39E] rounded-xl py-4 px-2 w-full">
                <FaRoad className="text-yellow-700 mb-1" size={22} />
                <div className="font-bold text-lg text-gray-800">{totalDistanceKm.toFixed(1)} KM</div>
                <div className="text-xs text-gray-900">TOTAL DISTANCE</div>
                </div>
                <div className="flex flex-col items-center bg-[#98C39E] rounded-xl py-4 px-2 w-full">
                <FaCar className="text-yellow-700 mb-1" size={22} />
                <div className="font-bold text-lg text-gray-800">{totalRides}</div>
                <div className="text-xs text-gray-900">TOTAL RIDES</div>
                </div>
                <div className="flex flex-col items-center bg-[#98C39E] rounded-xl py-4 px-2 w-full">
                <FaDollarSign className="text-yellow-700 mb-1" size={22} />
                <div className="font-bold text-lg text-gray-800">₹{Number(earningsToday).toFixed(0)}</div>
                <div className="text-xs text-gray-900">TODAY'S INCOME</div>
                </div>
                <div className="flex flex-col items-center bg-[#98C39E] rounded-xl py-4 px-2 w-full">
                <FaStar className="text-yellow-700 mb-1" size={22} />
                <div className="font-bold text-lg text-gray-800">{Number(efficiencyScore || 0).toFixed(1)}</div>
                <div className="text-xs text-gray-900">EFFICIENCY</div>
                </div>
            </div>
            </div>
        </div>
    )
}

export default CaptainDetails