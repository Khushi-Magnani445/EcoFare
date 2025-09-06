import React from 'react';
import { FaUser } from 'react-icons/fa';

const VehiclePanel = ({ pickup, destination, onClose, fare, onSelectVehicle }) => {
  return (
    <div className="w-full h-full flex flex-col">
      {/* Close button */}
      <button onClick={onClose} className="absolute top-4 right-6 text-2xl font-bold text-gray-500 hover:text-gray-800">✕</button>
      {/* Pickup/Destination */}
      {/* <div className="px-8 pt-8 pb-4">
        <div className="text-lg font-semibold">Pickup: <span className="font-normal">{pickup}</span></div>
        <div className="text-lg font-semibold">Destination: <span className="font-normal">{destination}</span></div>
      </div> */}
      <h2 className="text-2xl font-bold mb-4 sm:mb-6 text-center mt-4 sm:mt-6">Choose Your Ride</h2>
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-6 sm:pb-8">
        
        {/* Vehicle options */}
        {/* EV Cab */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-gray-300 rounded-xl w-full mb-3 hover:border-green-700 transition" onClick={()=>onSelectVehicle("ev_car")}>
          <img src="https://static.toiimg.com/thumb/msid-100475619,width-1280,height-720,imgsize-178546,resizemode-6,overlay-toi_sw,pt-32,y_pad-40/photo.jpg" alt="" className="h-16 sm:h-20 object-cover rounded" />
          <div className="flex-1 min-w-0 ml-1 sm:ml-2">
            <h4 className="font-medium text-base flex items-center gap-2">EV Cab <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">EV Discount</span> <FaUser size={14} color="#00FF00"/>4</h4>
            <h5 className="font-medium text-sm">2 min away</h5>
            <p className="font-medium text-xs">Affordable Rides</p>
          </div>
          <h2 className="font-semibold text-lg sm:text-xl whitespace-nowrap">₹ {fare.ev_car}</h2>
        </div>
        {/* EV Bike */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-gray-300 rounded-xl w-full mb-3 hover:border-green-700 transition" onClick={()=>onSelectVehicle("ev_bike")}>
          <img src="https://www.shutterstock.com/image-vector/motocycle-road-motor-transport-ecofriendly-600w-2445816629.jpg" className='h-16 sm:h-20 pl-2 sm:pl-3 object-contain' alt="" />
          <div className="flex-1 min-w-0 ml-1 sm:ml-2">
            <h4 className="font-medium text-base flex items-center gap-2">EV Bike <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">EV Discount</span> <FaUser size={14} color="#00FF00"/>1</h4>
            <h5 className="font-medium text-sm">5 min away</h5>
            <p className="font-medium text-xs">Affordable Rides</p>
          </div>
          <h2 className="font-semibold text-lg sm:text-xl whitespace-nowrap">₹ {fare.ev_bike}</h2>
        </div>
        {/* Auto (non-EV) */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-gray-300 rounded-xl w-full mb-3 hover:border-green-700 transition" onClick={()=>onSelectVehicle("auto")}>
          <img src="https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_368,w_552/v1648431773/assets/1d/db8c56-0204-4ce4-81ce-56a11a07fe98/original/Uber_Auto_558x372_pixels_Desktop.png" className='h-16 sm:h-20 pl-2 sm:pl-3 object-contain' alt="" />
          <div className="flex-1 min-w-0 ml-1 sm:ml-2">
            <h4 className="font-medium text-base">Auto <FaUser size={14} color="#00FF00"/>1</h4>
            <h5 className="font-medium text-sm">5 min away</h5>
            <p className="font-medium text-xs">Affordable Rides</p>
          </div>
          <h2 className="font-semibold text-lg sm:text-xl whitespace-nowrap">₹ {fare.auto}</h2>
        </div>
        {/* Bike (non-EV) */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-gray-300 rounded-xl w-full mb-3 hover:border-green-700 transition" onClick={()=>onSelectVehicle("bike")}>
          <img src="https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_368,w_552/v1649231091/assets/2c/7fa194-c954-49b2-9c6d-a3b8601370f5/original/Uber_Moto_Orange_312x208_pixels_Mobile.png" className='h-16 sm:h-20 pl-2 sm:pl-3 object-contain' alt="" />
          <div className="flex-1 min-w-0 ml-1 sm:ml-2">
            <h4 className="font-medium text-base">Bike <FaUser size={14} color="#00FF00"/>1</h4>
            <h5 className="font-medium text-sm">5 min away</h5>
            <p className="font-medium text-xs">Affordable Rides</p>
          </div>
          <h2 className="font-semibold text-lg sm:text-xl whitespace-nowrap">₹ {fare.bike}</h2>
        </div>
        {/* Cab (non-EV) */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-gray-300 rounded-xl w-full mb-3 hover:border-green-700 transition" onClick={()=>onSelectVehicle("car")}>
          <img src="https://img.freepik.com/premium-vector/bright-yellow-taxi-cab-cartoon-illustration-side-view-cartoon-style-city-transportation-yellow_101903-4249.jpg" className='h-16 sm:h-20 pl-2 sm:pl-3 object-contain' alt="" />
          <div className="flex-1 min-w-0 ml-1 sm:ml-2">
            <h4 className="font-medium text-base">Cab <FaUser size={14} color="#00FF00"/>4</h4>
            <h5 className="font-medium text-sm">5 min away</h5>
            <p className="font-medium text-xs">Affordable Rides</p>
          </div>
          <h2 className="font-semibold text-lg sm:text-xl whitespace-nowrap">₹ {fare.car}</h2>
        </div>
        {/** Removed unsupported 'cycle' option to avoid vehicleType mismatch */}
        
      </div>
    </div>
  );
};

export default VehiclePanel;