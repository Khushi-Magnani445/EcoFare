// server.js
require('dotenv').config();
const axios = require('axios');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const User = require('./models/user');
const cors = require('cors');
const MONGO_URL = "mongodb://127.0.0.1:27017/ecofare";
const authRoute = require('./routes/auth');
const statsData = require('./routes/stats');
const mapsRoute = require('./routes/maps.routes');
const ridesRoute = require('./routes/ride.routes');
const cookieParser = require('cookie-parser');
const app = express();
const { InitSocket } = require('./socket');

main()
  .then(() => {
    console.log("connected to db");
  })
  .catch((err) => {
    console.log(err);
  });
async function main() {
  await mongoose.connect(MONGO_URL);
}



app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors({
  origin:["http://localhost:5173","https://m1jw9s4k-5173.inc1.devtunnels.ms","https://eco-fare.vercel.app"],

  credentials:true
}));
app.use(cookieParser());
// app.use(session({
//   secret:"KKM",
//   saveUninitialized:false,
//   resave:false
// }))
// app.use(passport.initialize())
// app.use(passport.session())
// passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

app.use("/api/auth",authRoute.router)
app.use("/api/stats",statsData)
app.use("/api/maps",mapsRoute)
app.use("/api/rides",ridesRoute)

app.get('/', (req, res) => {
  res.send('EcoFare Backend Running ✅');
});

// Create HTTP server
const server = require('http').createServer(app);

// Initialize Socket.io with the HTTP server
InitSocket(server);

server.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
