import React from 'react';
import cabImage from '../assets/images/cabService.png';
import {Link} from 'react-router-dom';
import { FaHome } from 'react-icons/fa';

function RiderPayment() {
    return (
        <>
        <div className='w-full h-10 flex justify-center items-center relative pt-40'>
            <FaHome size={50} color="#111D1B" className='  h-12 left-4 absolute'/>
        </div>
        <div className="flex min-h-screen w-full  items-center justify-center">
            
            {/* Left: Map/Vehicle Image */}
            <div className="w-1/2 h-full flex items-center justify-center bg-white rounded-l-2xl">
                <img src={cabImage} alt="Cab" className="object-contain h-4/5 w-4/5 rounded-xl" />
            </div>
            {/* Right: Payment Info Panel */}
            <div className="w-1/2 h-full flex flex-col justify-center bg-white rounded-r-2xl border-2 border-gray-200 p-20">
                {/* Arrival Info */}
                <div className="flex items-center mb-6">
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold text-lg mr-4">Arrival 7 min</div>
                </div>
                {/* Vehicle & Driver Info */}
                <div className="flex items-center mb-6">
                    <img src={cabImage} alt="Cab" className="h-16 w-20 object-contain rounded-md mr-4 border" />
                    <div>
                        <div className="font-bold text-xl">Sarthak</div>
                        <div className="font-semibold text-lg tracking-wider">MP04 AB 1234</div>
                        <div className="text-gray-500 text-sm">Maruti Suzuki Alto</div>
                    </div>
                </div>
                {/* Address */}
                <div className="flex items-center gap-3 border-b-2 pb-4 mb-4">
                    <i className="ri-map-pin-2-fill text-2xl text-green-700"></i>
                    <div>
                        <h3 className="text-lg font-medium">562/11-A</h3>
                        <p className="text-sm text-gray-600 mt-1">Kankariya Talab, Bhopal</p>
                    </div>
                </div>
                {/* Payment Info */}
                <div className="flex items-center gap-3 mb-4">
                    <i className="ri-currency-line text-2xl text-green-700"></i>
                    <div>
                        <h3 className="text-lg font-medium">₹193.20</h3>
                        <p className="text-sm text-gray-600 mt-1">Cash Cash</p>
                    </div>
                </div>
                {/* Payment Button */}
                <button className="mt-8 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg text-lg transition">Make a Payment</button>
            </div>
        </div>
        </>
    );
}

export default RiderPayment;