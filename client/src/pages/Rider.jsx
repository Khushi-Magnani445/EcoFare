import React from "react";
import { FaBicycle, FaLeaf, FaRegSmile, FaRegQuestionCircle } from "react-icons/fa";
import happyUsers from "../assets/images/happyusers.png";

const features = [
  { icon: <FaBicycle className="text-[#415D43] text-2xl" />, text: "Eco-friendly rides" },
  { icon: <FaLeaf className="text-[#415D43] text-2xl" />, text: "Reduce your carbon footprint" },
  { icon: <FaRegSmile className="text-[#415D43] text-2xl" />, text: "Seamless booking experience" },
];

const stats = [
  { label: "Rides Completed", value: "10,000+" },
  { label: "CO₂ Saved", value: "500+ tons" },
  { label: "Happy Users", value: "5,000+" },
];

const Rider = () => {
  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-[#e6f4ea] py-10 px-2">
      <div className="w-full max-w-4xl bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 flex flex-col items-center">
        <FaBicycle className="text-5xl text-[#415D43] mb-4" />
        <h2 className="text-3xl font-bold mb-2 text-[#293D2B] text-center">Become a Rider</h2>
        <p className="text-lg text-[#415D43] mb-6 text-center">
          Join EcoFare as a rider and be part of a community that values sustainability, convenience, and safety. Enjoy eco-friendly rides, seamless booking, and a greener future—one journey at a time.
        </p>
        <div className="flex flex-col gap-3 w-full mb-6">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3 bg-[#f0f7f3] rounded-lg px-4 py-2">
              {f.icon}
              <span className="text-[#415D43] font-medium">{f.text}</span>
            </div>
          ))}
        </div>
        <a
          href="/register"
          className="px-8 py-2 bg-[#415D43] text-white rounded-full font-semibold shadow hover:bg-[#293D2B] transition mb-4 text-center"
        >
          Start Riding
        </a>
        <a href="/faq" className="flex items-center gap-2 text-[#415D43] hover:underline text-sm mb-4">
          <FaRegQuestionCircle /> FAQ & Help
        </a>
        <div className="flex justify-between w-full mt-4 mb-2">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-xl font-bold text-[#293D2B]">{s.value}</span>
              <span className="text-xs text-[#415D43]">{s.label}</span>
            </div>
          ))}
        </div>
        <div className="w-full flex flex-col items-center mt-6">
          <img src={happyUsers} alt="Happy users" className="w-16 h-16 rounded-full border-2 border-[#415D43] mb-2" />
          <blockquote className="italic text-[#415D43] text-center max-w-xs">
            "EcoFare made my daily commute so much greener and easier! Highly recommend to everyone."
          </blockquote>
          <span className="text-xs text-[#293D2B] mt-1">— Priya S., EcoFare Rider</span>
        </div>
      </div>
    </div>
  );
};

export default Rider;
