import React from 'react';
 // Use your map image here
import { FaSearchLocation, FaMapMarkerAlt } from 'react-icons/fa';
 import { IoIosArrowDown } from "react-icons/io";
 
 const RidePopUp = (props) => {
     
 
 
     return (
         <div className='w-[93%] h-2/5 bg-white flex flex-col items-center justify-center rounded-lg'>
         {/* Map Image with route overlay */}
         <h5 onClick={() => props.setRidePopUp(false)} color='red' className='top-0 right-0'>
             <IoIosArrowDown className='text-gray-400' size={24}/>
         </h5>
         {/* Floating Card */}
         
             {/* Rider Info */}
             <div className='w-[80%] h-full bg-white rounded-lg'>
             <div className="flex items-center justify-between mt-4 p-3 bg-white rounded-lg">
            <div className="flex items-center gap-3">
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Rider" className="w-10 h-10 rounded-full object-cover" />
               <div className="font-semibold text-gray-800">{props.user?.name || 'Rider'}</div>
                <span className="ml-2 bg-green-300 text-xs font-bold px-2 py-1 rounded">ApplePay</span>
                <span className="ml-1 bg-green-300 text-xs font-bold px-2 py-1 rounded">Discount</span>
                {(() => {
                  // Non-breaking passengers count: shared -> provided count; solo -> 1
                  const isShared = !!props.ride?.isShared;
                  const pax = isShared
                    ? (props.ride?.passengerCount ?? (Array.isArray(props.ride?.passengers) ? props.ride.passengers.length : 1))
                    : 1;
                  return (
                    <span className="ml-1 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                      {pax} pax
                    </span>
                  );
                })()}
            </div>
            <div className="flex flex-col items-end">
               <div className="font-bold text-3xl text-gray-800">₹{props.ride?.fare ?? '—'}</div>
               <div className="text-xl text-gray-500">
                 {props.ride?.distance != null ? ((props.ride.distance / 1000).toFixed(1)) : '—'} km
               </div>
            </div>
            </div>
             {/* Pickup & Dropoff */}
             <div className="mt-3">
             <div className="text-xl text-gray-400 font-semibold mb-1">PICK UP</div>
             <div className="flex items-center gap-2 mb-2">
                 <FaMapMarkerAlt className="text-green-500" />
                <span className="text-gray-800 font-medium">{props.ride?.pickup || '—'}</span>
                 <FaSearchLocation className="ml-2 text-gray-400" />
             </div>
             <div className="text-xl text-gray-400 font-semibold mb-1 mt-2">DROP OFF</div>
             <div className="flex items-center gap-2">
                 <FaMapMarkerAlt className="text-pink-500" />
                <span className="text-gray-800 font-medium">{props.ride?.destination || '—'}</span>
             </div>
             </div>
             {/* Buttons */}
             <div className="flex justify-center items-center mt-6 gap-4">
             <button className="w-50 py-3 rounded-lg bg-gray-400 text-white font-semibold" onClick={() => props.setRidePopUp(false)}>Ignore</button>
             <button className="w-50 py-3 rounded-lg bg-[#1f3f25] text-white font-bold shadow" onClick={() => {
                 props.setConfirmRidePopUp(true)
                 props.setRidePopUp(false)
                 props.confirmRide()
             }}>Accept</button>
             </div>
             </div>
         </div>
     );
 };
 
 export default RidePopUp;
