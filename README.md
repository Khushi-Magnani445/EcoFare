🌍 EcoFare – Eco-Friendly Ride-Sharing Platform

EcoFare is a full-stack MERN application designed to promote sustainable commuting. It enables users to book eco-friendly rides, track them in real time, and earn rewards for choosing green transportation options. The platform supports solo and shared rides, integrates with Google Maps, and offers gamified eco-incentives to encourage sustainability.

🚀 Features
🔹 Ride Management

Solo and pooled rides with dynamic pricing

Real-time driver matching using GeoJSON and location radius queries

Secure OTP verification for ride confirmation

Multi-vehicle support (eco bikes, cars, scooters)

🔹 Payment & Rewards

Multiple payment options: Cash on Delivery, online payments, wallet

Tiered rewards system (Bronze/Silver/Gold) with points multipliers

Eco-gamification: CO₂ savings tracking, eco-streaks, badges

Dynamic discounts with tier-based redemption limits

🔹 Google Maps Integration

Geocoding, distance matrix, and autocomplete for locations

Live ride tracking with interactive maps

Route optimization for better fare estimation

Marker-based location display and real-time updates

🔹 Real-Time Communication

Socket.io-powered updates for ride status, driver location, and notifications

Event-driven architecture for confirmations, cancellations, and completions

Room-based communication channels for users and captains

🔹 User Experience

Responsive UI with Tailwind CSS (mobile-first design)

Smooth GSAP animations for panels and transitions

React Context for global state management

Protected routes with role-based access

🛠️ Tech Stack

Frontend: React 19, React Router, Context API, Tailwind CSS, GSAP

Backend: Node.js, Express.js, MongoDB, Mongoose

Real-time: Socket.io, WebSocket communication

APIs: Google Maps (Geocoding, Distance Matrix, Places)

Auth & Security: JWT authentication, role-based access

Tools: Vite, ESLint, Git, Postman

📊 Key Business Logic

Dynamic pricing based on distance and vehicle type multipliers

Eco incentives with bonus rewards for electric vehicles

Captain earnings tracking with daily reset functionality

Ride analytics: distance, duration, efficiency reports



⚡ Getting Started
1️⃣ Clone the repository
git clone https://github.com/Khushi-Magnani445/EcoFare
cd EcoFare

2️⃣ Backend Setup
cd server
npm install


Create a .env file inside server/:

MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GOOGLE_MAPS_API_KEY=your_google_maps_key


Run the server:

nodemon server.js OR node server.js

3️⃣ Frontend Setup
cd ../client
npm install
npm run dev
