const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


const vehicleSchema = new mongoose.Schema({
  vehicleType: {
    type:String,
    required:true,
    enum:['ev_bike', 'car', 'auto','bike','ev_car','scooter']
  },
  plateNumber: {
    type:String,
    required:true,
    unique:true,
    sparse:true,
    set: function(v){
      if (typeof v !== 'string') return v;
      // normalize: remove spaces/hyphens, uppercase
      return v.replace(/[\s-]/g, '').toUpperCase();
    },
    validate: {
      validator: function(v){
        if (typeof v !== 'string') return false;
        // After set(), v is normalized. Pattern: 2 letters (state), 2 digits (RTO), then 3-6 alphanumeric chars
        // Examples: MH12AB1234, DL01C0001, GJ05EV1
        const re = /^[A-Z]{2}\d{2}[A-Z0-9]{3,6}$/;
        return re.test(v);
      },
      message: props => `${props.value} is not a valid vehicle number. Expected: 2 letters state + 2 digits RTO + alphanumeric series (e.g., MH12AB1234)`
    }
  },
  color: {
    type:String,
    required:true
  },
  ecoFriendly: {
    type:Boolean,
    required:true
  },
  capacity:{
    type:Number,
    required:true,
    min:[1,'Capacity must be at least 1'],
    max:[5,'Capacity must be at most 5']
  },
  model: {
    type:String,
    required:true
  }
  
  
}, { _id: false });

const captainSchema = new mongoose.Schema({
  status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
  experienceYears: Number,
  // GeoJSON location: { type: 'Point', coordinates: [lng, lat] }
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      default: [0, 0]
    }
  },
  vehicle: vehicleSchema,
  // earnings for the current day
  earningsToday: { type: Number, default: 0 },
  earningsLastReset: { type: Date, default: () => new Date() },
  // captain rewards and efficiency
  rewardsPoints: { type: Number, default: 0 },
  efficiencyScore: { type: Number, default: 0 },
  socPercent: { type: Number, default: null }
}, { _id: false });

// Migration note: You must update existing captain.location fields in the database to GeoJSON format and create a 2dsphere index on 'captain.location'.

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  username: {               // this acts as emailID
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  phone: { type: String, required: true },
  socketId: { type: String },
  role: { type: String, enum: ["user", "captain"], required: true },
  captain: captainSchema,
  // simple rewards balance for eco-friendly rides
  rewardsPoints: { type: Number, default: 0 },
  // rewards tier for multipliers: bronze, silver, gold
  rewardsTier: { type: String, enum: ['bronze','silver','gold'], default: 'bronze' },
  // eco gamification
  ecoStreak: { type: Number, default: 0 },
  lastEcoRideAt: { type: Date, default: null },
  totalEcoRides: { type: Number, default: 0 },
  co2SavedKg: { type: Number, default: 0 },
  badges: { type: [String], default: [] }
});

userSchema.index({ 'captain.location': '2dsphere' });

userSchema.methods.generateAuthToken = function(){
  const token = jwt.sign({_id:this._id},process.env.JWT_SECRET,{expiresIn:"24h"});
  return token;
}

userSchema.methods.comparePassword = async function(password){
  return await bcrypt.compare(password,this.password);
}

userSchema.statics.hashPassword = async function(password){
  return await bcrypt.hash(password,10);
}
module.exports = mongoose.model('User',userSchema);
