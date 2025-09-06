const axios = require('axios');
const rideModel = require('../models/ride.models');
const mapsService = require('./maps.service');
const crypto = require('crypto');
const userModel = require('../models/user');
async function getFare(pickup,destination){
    if(!pickup || !destination){
        throw new Error('Pickup and destination are required');
    }
    const distanceTime = await mapsService.getDistanceTime(pickup,destination);
    
    const baseFare = {
        'ev_bike':15,
        'ev_car':30,
        'bike':20,
        'car':35,
        'auto':15,
    }
    const perKmRate={
        'ev_bike':4,
        'ev_car':7,
        'bike':5,
        'car':9,
        'auto':6
    }
    const perMinuteRate={
        'ev_bike':1,
        'ev_car':2,
        'bike':3,
        'car':4,
        'auto':3
    }

    const fare ={
        'ev_bike':Math.round(baseFare['ev_bike']+(distanceTime.distance.value /1000)*perKmRate['ev_bike']+((distanceTime.duration.value/60)*perMinuteRate['ev_bike'])),
        'ev_car':Math.round(baseFare['ev_car']+(distanceTime.distance.value /1000)*perKmRate['ev_car']+((distanceTime.duration.value/60)*perMinuteRate['ev_car'])),
        'bike':Math.round(baseFare['bike']+(distanceTime.distance.value /1000)*perKmRate['bike']+((distanceTime.duration.value/60)*perMinuteRate['bike'])),
        'car':Math.round(baseFare['car']+(distanceTime.distance.value /1000)*perKmRate['car']+((distanceTime.duration.value/60)*perMinuteRate['car'])),
        'auto':Math.round(baseFare['auto']+(distanceTime.distance.value /1000)*perKmRate['auto']+((distanceTime.duration.value/60)*perMinuteRate['auto']))
    }
    
    return fare;
}

module.exports.getFare = getFare;

function getOTP(num){
    function generateOTP(num){
        const otp = crypto.randomInt(10**(num-1),10**num-1).toString();
        return otp;
    }
    const otp = generateOTP(num);
    return otp;
}

module.exports.createRide = async({
    userId,
    vehicleType,
    pickup,
    destination,
    rewardsPointsToUse // optional number of points the user wants to redeem now
})=>{
    console.log(userId,vehicleType,pickup,destination);
    if(!userId || !vehicleType || !pickup || !destination){
        throw new Error('All fields are required');
    }
    
    
    const fare = await getFare(pickup,destination);
    console.log(fare);

    // Also compute and persist distance (meters) and duration (minutes)
    // This enables richer UI (distance display, profitability scoring) without changing pricing.
    const distanceTime = await mapsService.getDistanceTime(pickup, destination);

    const originalFare = Number(fare[vehicleType] || 0);

    // Compute discount if requested
    let discountAmount = 0;
    let pointsUsed = 0;
    if (typeof rewardsPointsToUse === 'number' && rewardsPointsToUse > 0) {
        const user = await userModel.findById(userId);
        if (user) {
            const tier = (user.rewardsTier || 'bronze').toLowerCase();
            const maxPercent = tier === 'gold' ? 0.10 : tier === 'silver' ? 0.07 : 0.05;
            const perRideCap = 50; // currency cap
            const maxByPercent = Math.floor(originalFare * maxPercent);
            const available = Number(user.rewardsPoints || 0);
            pointsUsed = Math.max(0, Math.min(rewardsPointsToUse, available, perRideCap, maxByPercent));
            discountAmount = pointsUsed; // 1 point == 1 currency unit
            if (pointsUsed > 0) {
                await userModel.updateOne({ _id: user._id }, { $inc: { rewardsPoints: -pointsUsed } });
            }
        }
    }

    const finalFare = Math.max(0, originalFare - discountAmount);

    const ride = new rideModel({
        user:userId,
        pickup:pickup,
        destination:destination,
        otp:getOTP(4),
        fare: finalFare,
        discountAmount: discountAmount,
        discountPointsUsed: pointsUsed,
        discountSource: pointsUsed > 0 ? 'rewards' : undefined,
        distance: distanceTime?.distance?.value, // in meters
        duration: Math.round((distanceTime?.duration?.value || 0) / 60) // in minutes
        
    })
    await ride.save();
    console.log(ride);
    return ride;
}


module.exports.confirmRide = async({
    rideId,captain
})=>{
    if(!rideId){
        throw new Error('Ride Id is required');
    }

    const updateResult = await rideModel.findOneAndUpdate({
        _id:rideId
    },{
        status:'accepted',
        captain:captain._id
    })
    console.log(updateResult)
    const ride = await rideModel.findOne({
        _id:rideId
    }).populate('user').select('+otp')

    if(!ride){
        throw new Error('Ride not Found')
    }
    console.log("Ride Confirmedddddddddddddd!",ride)
    return ride;
}