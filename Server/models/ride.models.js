const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    captain:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    pickup:{
        type:String,
        required:true
    },
    destination:{
        type:String,
        required:true
    },
    fare:{
        type:Number,
        required:true
    },
    // Discount metadata (fare reflects FINAL amount after discount)
    discountAmount: {
        type: Number,
        default: 0
    },
    discountPointsUsed: {
        type: Number,
        default: 0
    },
    discountSource: {
        type: String, // e.g., 'rewards'
        default: undefined
    },
    // Ride sharing (pooled) additive fields
    isShared: {
        type: Boolean,
        default: false
    },
    // Maximum seats the captain allows for a pooled ride (including driver seat is NOT counted)
    maxSeats: {
        type: Number,
        default: 2,
        min: 1,
        max: 4
    },
    // Seats currently available for additional passengers to join
    availableSeats: {
        type: Number,
        default: 1,
        min: 0,
        max: 4
    },
    // Price per passenger for pooled rides (kept separate from total fare for clarity)
    farePerPassenger: {
        type: Number,
        default: 0
    },
    // List of passengers in a pooled ride (first entry is usually the creator)
    passengers: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            pickup: { type: String },
            destination: { type: String },
            fare: { type: Number, default: 0 },
            status: { type: String, enum: ['requested', 'confirmed', 'onboard', 'completed', 'cancelled'], default: 'requested' }
        }
    ],
    // Payment method used by the user: wallet/online/cod
    paymentMethod:{
        type:String,
        enum:['wallet','online','cod'],
        default:'cod'
    },
    status:{
        type:String,
        enum:['pending','accepted','ongoing','completed','cancelled'],
        default:'pending'
    },
    duration:{
        type:Number,
        //in minutes
    },
    distance:{
        type:Number,
        //in meters
    },
    paymentId:{
        type:String,
    },
    orderId:{
        type:String,
    },
    signature:{
        type:String,
    },
    // Computed fields at ride completion
    companyFee:{
        type:Number,
        default:0
    },
    captainEarnings:{
        type:Number,
        default:0
    },
    // Rating provided by the user for the captain (1-5), optional comment
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    ratingComment: {
        type: String,
        maxlength: 500
    },
    ratedAt: {
        type: Date
    },
    otp:{
        type:String,
        required:true,
        select:false
    }
})

module.exports = mongoose.model('Ride',rideSchema);