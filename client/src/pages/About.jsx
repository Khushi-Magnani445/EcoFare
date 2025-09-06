import React from "react";
import aboutImage from "../assets/images/About.png";
const About = () => (
  <div className="w-screen flex items-center justify-around min-h-screen from-white to-[#ffffff] bg-gradient-to-b">
    
    <div>
    <h1 className="text-4xl md:text-5xl font-bold text-[#293D2B] mb-4 text-center">EcoFare</h1>
    <p className="text-xl md:text-2xl text-[#415D43] max-w-2xl text-center">
      EcoFare is a platform dedicated to making urban transportation greener, more affordable, and accessible for everyone. Join us in our mission to create a cleaner, more sustainable future—one ride at a time.
    </p>
    </div>
    <img
      src={aboutImage}
      alt="EcoFare - Eco-friendly Ride"
      className="w-full max-w-3xl h-130 object-cover rounded-2xl mt-50"
    />
  </div>
);

export default About;