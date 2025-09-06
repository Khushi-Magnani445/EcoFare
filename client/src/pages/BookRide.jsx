import React, { useState } from "react";
import LocationSearch from "../components/LocationSearch";
import booking from "../assets/images/tree_transparent.png";
export default function BookRide() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);

  return (
    <div className="flex  justify-center items-center min-h-screen w-screen overflow-hidden from-white to-[#f7e7c6] bg-gradient-to-br">
      <img
        src={booking}
        alt="Books"
        className="w-full h-full object-contain opacity-70"
      />
      
      <div className="w-full h-115 max-w-lg p-6  bg-[#111D1B]/20 backdrop-blur-md border border-white/40 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Book a Ride</h2>
        <div className="">
          <span className="mr-95 text-2xl text-[#0c1312] font-bold my-3">
            From :{" "}
          </span>
          <LocationSearch 
            label="From" 
            value={from} 
            onChange={setFrom} 
            suggestions={fromSuggestions}
            setSuggestions={setFromSuggestions}
          />
        </div>
        <div className="mt-10">
          <span className="mr-95 text-2xl text-[#0c1312] font-bold my-3">
            To :{" "}
          </span>
          <LocationSearch 
            label="To" 
            value={to} 
            onChange={setTo} 
            suggestions={toSuggestions}
            setSuggestions={setToSuggestions}
          />
        </div>
        <button className="bg-[#293D2B] text-white px-4 my-15 rounded-md w-2xs h-10 cursor-pointer">
          Book
        </button>
      </div>
    </div>
  );
}
