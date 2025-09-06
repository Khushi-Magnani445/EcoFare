// src/pages/Home.jsx
import React, { useEffect } from "react";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { useNavigate } from 'react-router-dom';
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import evBike from "../assets/images/EVbike.jpg";
import evCab from "../assets/images/EVcab.jpg";
import auto from "../assets/images/auto.jpg";
import rentalBike from "../assets/images/cycle.jpg";
import sharedRide from "../assets/images/sharedCab.jpg";
import groupCab from "../assets/images/sharedCab.jpg";
import booking from "../assets/images/book1.jpg";
import rider1 from "../assets/images/rider1.jpg";
import rider2 from "../assets/images/rider3.jpg";
import tree from "../assets/images/img2.png";
import happyUsers from "../assets/images/happyusers2.png";
import ridesCompleted from "../assets/images/rideCompleted.png";
import bike from "../assets/images/bike_transparent.png";
import complete from "../assets/images/pngegg.png";
import tree2 from "../assets/images/tree_transparent.png";
import book from "../assets/images/cabService.png";

const services = [
  { title: "Originals", subtitle: "Hooded", highlight: "Windbreaker", image: evBike, desc: "Eco-friendly electric bike rides." },
  { title: "Originals", subtitle: "EV Cab", highlight: "Sustainable", image: evCab, desc: "Sustainable cab options for city travel." },
  { title: "Originals", subtitle: "Auto", highlight: "Rickshaw", image: auto, desc: "Affordable and quick auto rides." },
  { title: "Originals", subtitle: "Rental", highlight: "Bike", image: rentalBike, desc: "Rent a bike for your daily commute." },
  { title: "Originals", subtitle: "Shared", highlight: "Ride", image: sharedRide, desc: "Share your ride, save the planet." },
  { title: "Originals", subtitle: "Group", highlight: "Cab", image: groupCab, desc: "Travel together, reduce emissions." },
];

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    co2Saved: 0,
    ridesCompleted: 0,
    happyUsers: 0,
  });
  useEffect(()=>{
    fetch('http://localhost:5000/api/stats').then(res=>res.json()).then(data => setStats(data)).catch(err=>console.log("Fetching Stats failed!"+err))
  },[]); 
  
  return (
    <div className="w-screen min-h-screen bg-[#e6e7e3] flex flex-col justify-center items-center px-2 py-8 overflow-x-hidden">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation={{
          nextEl: ".custom-swiper-next",
          prevEl: ".custom-swiper-prev",
        }}
        pagination={{ clickable: true, el: ".custom-swiper-pagination" }}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        loop
        className="w-full max-w-6xl rounded-2xl shadow-2xl bg-transparent"
      >
        {services.map((service, idx) => (
          <SwiperSlide key={idx}>
            <div className="relative flex flex-col md:flex-row items-center justify-between min-h-[500px] p-0 md:p-8">
              {/* Floating Image with Soft Background Shape */}
              <div className="relative flex-1 flex justify-center items-center min-w-[350px] min-h-[350px] md:min-w-[450px] md:min-h-[450px]">
                {/* Soft colored ellipse background */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] md:w-[420px] md:h-[420px] bg-gradient-to-br from-[#d1f1fa] via-[#f7e7c6] to-[#e6e7e3] opacity-80" />
                {/* Product Image */}
                <img
                  src={service.image}
                  alt={service.title}
                  className="relative z-10 w-[270px] h-[270px] md:w-[370px] md:h-[370px] object-contain drop-shadow-2xl rounded-lg"
                  style={{ filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.18))"}}
                />
              </div>
              {/* Text Content */}
              <div className="flex-1 flex flex-col justify-center items-start md:pl-12 mt-8 md:mt-0">
                <span className="text-base text-gray-500 mb-2">New Collection</span>
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-gray-800 mb-2 leading-tight">
                  {service.title} <br className="hidden md:block" />
                  <span className="font-light">{service.subtitle}</span> <br className="hidden md:block" />
                  <span className="font-serif font-bold">{service.highlight}</span>
                </h1>
                <p className="text-gray-600 text-lg max-w-md mb-6 mt-2">
                  {service.desc}
                </p>
              </div>
              
              <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 flex items-center gap-4 md:gap-6 z-20">
                <button className="custom-swiper-prev text-2xl text-gray-700 hover:text-black transition p-2 rounded-full border border-gray-300 bg-white/80 shadow">
                  <span>&larr;</span>
                </button>
                <div className="custom-swiper-pagination" />
                <button className="custom-swiper-next text-2xl text-gray-700 hover:text-black transition p-2 rounded-full border border-gray-300 bg-white/80 shadow">
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      {/* Services Section */}
      <section className="w-full min-h-screen flex flex-col items-center py-45 px-2 bg-gradient-to-b from-[#e6e7e3] to-[#98C39E]">
        <div className="w-full max-w-7xl">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-wide text-[#293D2B] mb-2 text-left">Our Services</h2>
          <div className="h-[2px] w-16 bg-[#709775] mb-8 rounded-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 pb-2">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition p-4 flex flex-col items-center text-center border border-[#8FB996]/30 hover:border-[#709775] group"
                style={{ minWidth: '180px' }}
              >
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-20 h-20 object-contain mb-4 rounded-lg border border-[#AFD4B3]/40 group-hover:border-[#709775]"
                />
                <h3 className="text-lg font-bold text-[#293D2B] mb-1">{service.subtitle || service.title}</h3>
                <p className="text-sm text-[#415D43]">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Book a Ride Section */}
      <section className="w-full min-h-[400px] flex flex-col md:flex-row items-center justify-between py-16 px-4 bg-gradient-to-b from-[#98C39E] to-[#c4d8c6]">
        {/* Book Ride Text */}
        <div className="flex-1 flex flex-col items-start justify-center mb-8 md:mb-0 md:pr-12 md:ml-18 md:pt-30">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1D2D1F] mb-4">Book Your Eco-Friendly Ride</h2>
          <p className="text-2xl text-[#293D2B] mb-6 max-w-lg">Experience affordable, sustainable, and reliable transport at your fingertips. Choose your ride and book instantly with EcoFare.</p>
          <button className="w-full sm:w-auto px-8 py-3 bg-[#415D43] text-white rounded-full font-semibold shadow hover:bg-[#293D2B] transition" onClick={() => navigate('/book-ride-home')}>Book Now</button>
        </div>
        {/* Book Ride Image Placeholder */}
        <div className="flex-2 flex justify-center items-center w-full">
          {/* Booking image composition with glassy bubbles */}
          <div className="relative w-full max-w-xl h-60 sm:h-72 flex items-center justify-center">
            {/* Large main image */}
            <img src={booking} alt="Booking" className="w-full h-full object-cover rounded-2xl shadow-lg" />
            {/* Glassy bubbles */}
            <div className="hidden sm:block absolute -translate-x-48 bottom-24 -translate-y-40 w-95 h-50 right-1/2 bg-white/30 rounded-full backdrop-blur-md shadow-lg" />
            <div className="hidden sm:block absolute translate-y-48 translate-x-75 w-35 h-35 bg-[#AFD4B3]/30 rounded-full backdrop-blur-md shadow-md" />
            <div className="hidden sm:block absolute translate-x-96 translate-y-48 w-16 h-16 bg-[#111D13]/20 rounded-full backdrop-blur-md shadow" />
          </div>
        </div>
      </section>
      {/* Become a Rider Section */}
      <section className="w-full flex flex-col gap-16 py-30 px-4 bg-gradient-to-b from-[#c4d8c6] to-[#fcfcfb]">
        {/* Block 1: Image Left, Text Right */}
        <div className="flex flex-col md:flex-row items-center max-w-7xl mx-auto gap-8">
          {/* Rider Image Placeholder */}
          <div className="flex-1 flex justify-center items-center order-1 md:order-none">
            {/* TODO: Import and use your rider illustration or image here */}
            <div className="relative w-94 h-94 rounded-2xl flex items-center justify-center text-[#415D43] text-xl font-bold opacity-90">
              <img src={rider1} alt="Rider 1" className="w-full h-full object-contain rounded-full shadow-lg" />
              <div className="absolute -top-10 -left-20 w-40 h-40 bg-[#111D13]/30 rounded-full backdrop-blur-md shadow-lg" />
            </div>
          </div>
          {/* Text */}
          <div className="flex-1 flex flex-col items-start justify-center">
            <h3 className="text-3xl md:text-4xl font-bold text-[#111D13] mb-3 md:ml-20">Become a Rider with EcoFare</h3>
            <p className="text-2xl text-[#222a23] mb-2">Join our community and earn while helping the planet. Flexible hours, great incentives, and a supportive team await you.</p>
          </div>
        </div>
        {/* Block 2: Text Left, Image Right */}
        <div className="flex flex-col md:flex-row items-center max-w-7xl mx-auto gap-8">
          {/* Text */}
          <div className="flex-1 flex flex-col items-start justify-center order-2 md:order-none">
            <h3 className="text-3xl md:text-4xl font-bold text-[#111D13] mb-3 md:ml-25">Drive Green, Earn More</h3>
            <p className="text-2xl text-[#222a23] mb-2">With EcoFare, you can make a difference every day. Drive eco-friendly vehicles and be part of a sustainable future.</p>
          </div>
          {/* Rider Image Placeholder */}
          <div className="flex-1 flex justify-center items-center">
            {/* TODO: Import and use your second rider illustration or image here */}
            <div className="relative w-94 h-94 rounded-2xl flex items-center justify-center text-[#415D43] text-xl font-bold opacity-90">
              <img src={rider2} alt="Rider 2" className="w-full h-full object-contain rounded-full shadow-lg" />
              <div className="absolute -bottom-20 -right-25 w-40 h-70 bg-[#111D13]/30 rounded-full backdrop-blur-md shadow-lg" />
              <div className="absolute -top-2 -left-5 w-35 h-20 bg-[#111D13]/30 rounded-full backdrop-blur-md shadow-lg" />
            </div>
          </div>
        </div>
      </section>
      {/* Environmental Impact Stats Section */}
      <section className="w-full flex flex-col items-center py-16 bg-gradient-to-b from-[#fcfcfb] to-[#e6e7e3]">
        <h1 className="text-3xl md:text-3xl font-semibold tracking-wide text-[#293D2B] mb-2">Our Environmental Impact</h1>
        <div className="h-[2px] w-96 bg-[#709775] mb-8 rounded-full mx-auto" />
        <div className="flex flex-wrap justify-around gap-12 w-full max-w-7xl">
          {/* Animated Counter Example */}
          <div className="flex flex-col items-center ">
            {/* TODO: Replace with your own SVG or icon library */}
            <img src={tree} alt="tree" className="w-70 h-70 mb-2" />
            <AnimatedCounter end={stats.co2Saved} suffix="+" className="text-3xl font-bold text-[#111D13] pt-15" />
            <span className="text-3xl text-[#415D43]">Tons CO₂ Saved</span>
          </div>
          <div className="flex flex-col items-center ">
            <img src={ridesCompleted} alt="ridesCompleted" className="w-70 h-70 mb-2 ml-10" />
            <AnimatedCounter end={stats.ridesCompleted} suffix="+" className="text-3xl font-bold text-[#111D13] pt-15 ml-10" />
            <span className="text-3xl text-[#415D43] ml-10">Eco Rides Completed</span>
          </div>
          <div className="flex flex-col items-center ">
            <img src={happyUsers} alt="happyUsers" className="w-100 h-70 mb-2" />
            <AnimatedCounter end={stats.happyUsers} suffix="+" className="text-3xl font-bold text-[#111D13] pt-15" />
            <span className="text-3xl text-[#415D43]">Happy Users</span>
          </div>
          {/* TODO: Add more stats or fetch from API */}
        </div>
      </section>
      {/* How It Works Section */}
      <section className="w-full flex flex-col items-center py-16 bg-gradient-to-b from-[#e6e7e3] to-[#c4d8c6]">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-wide text-[#293D2B] mb-2">How It Works</h1>
        <div className="h-[2px] w-56 bg-[#709775] mb-8 rounded-full mx-auto" />
        <div className="flex flex-wrap justify-between gap-10 w-full max-w-5xl">
          <div className="relative flex flex-col items-center max-w-xs md:-translate-x-20">
            <div className="w-40 h-40 bg-[#080e09] rounded-full">
              <div className="flex flex-col items-center justify-center">
              <span className="text-2xl text-[#e6f0e7] underline decoration-1 underline-offset-4 ml-10 mt-10">STEP</span>
              <span className="text-3xl text-[#e6f0e7] ml-10 font-bold">01</span>
              </div>
            </div>
            <div className="absolute w-40 h-40 rounded-full border-4 border-black -translate-y-5"></div>
            <div className="pt-10">
              <span className="text-2xl text-[#080e09] font-bold">Choose Ride</span><br />
              <img src={bike} alt="bike" className="w-45 h-45 ml-8 mt-2" />
            </div>
            
          </div>
          <div className="relative flex flex-col items-center max-w-xs md:-translate-x-15 pt-10 md:pt-30">
          <div className="w-40 h-40 bg-[#1D2D1F] rounded-full">
              <div className="flex flex-col items-center justify-center">
              <span className="text-2xl text-[#e6f0e7] underline decoration-1 underline-offset-4 ml-10 mt-10">STEP</span>
              <span className="text-3xl text-[#e6f0e7] ml-10 font-bold">02</span>
              </div>
            </div>
            <div className="absolute w-40 h-40 rounded-full border-4 border-black -translate-y-5"></div>
            
            <div className="pt-10">
              <span className="text-2xl text-[#1D2D1F] font-bold">Book Instantly</span><br />
              <img src={book} alt="Book" className="w-60 h-45 ml-8 mt-2 object-contain" />
            </div>
          </div>
          <div className="relative flex flex-col items-center max-w-xs md:-translate-x-10 pt-10 md:pt-60">
          <div className="w-40 h-40 bg-[#415D43] rounded-full">
              <div className="flex flex-col items-center justify-center">
              <span className="text-2xl text-[#e6f0e7] underline decoration-1 underline-offset-4 ml-10 mt-10">STEP</span>
              <span className="text-3xl text-[#e6f0e7] ml-10 font-bold">03</span>
              </div>
            </div>
            <div className="absolute w-40 h-40 rounded-full border-4 border-black -translate-y-5"></div>
            <div className="pt-10">
              <span className="text-2xl text-[#415D43] font-bold">Go Green</span><br />
              <img src={tree2} alt="Go Green" className="w-45 h-45 ml-8 mt-2" />
            </div>
          </div>
          <div className="relative flex flex-col items-center max-w-xs pt-10 md:pt-90">
          <div className="w-40 h-40 bg-[#405643] rounded-full ml-4">
              <div className="flex flex-col items-center justify-center">
              <span className="text-2xl text-[#e6f0e7] underline decoration-1 underline-offset-4 ml-10 mt-10">STEP</span>
              <span className="text-3xl text-[#e6f0e7] ml-10 font-bold">04</span>
              </div>
            </div>
            <div className="absolute w-40 h-40 rounded-full border-4 border-black -translate-y-5 ml-4"></div>
            <div className="pt-10">
              <span className="text-2xl text-[#405643] font-bold ml-8">Complete Ride</span><br />
              <img src={complete} alt="complete Ride" className="w-38 h-38 ml-8 mt-8" />
            </div>
          </div>
          {/* TODO: Make steps interactive or add more steps */}
        </div>
      </section>
    </div>
  );
};

// AnimatedCounter component (simple version)
const AnimatedCounter = ({ end, suffix = '', className = '' }) => {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    let start = 0;
    const duration = 1200;
    const increment = Math.ceil(end / (duration / 16));
    const step = () => {
      start += increment;
      if (start < end) {
        setCount(start);
        requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    step();
    // eslint-disable-next-line
  }, [end]);
  return <span className={className}>{count}{suffix}</span>;
};

export default Home;
