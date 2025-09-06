const rideService = require('../services/ride.service');
const crypto = require('crypto');
const {validationResult} = require('express-validator');
const mapsService = require('../services/maps.service');
const {sendMsgToSocketId, sendMsgToUserRoom, sendMsgToCaptainRoom, sendMsgToVehicleTypeRoom} = require('../socket');
const rideModel = require('../models/ride.models');
const userModel = require('../models/user');

// Simple rewards tier multiplier helper (bronze/silver/gold)
function getTierMultiplier(tier) {
    if (!tier) return 1;
    const t = String(tier).toLowerCase();
    if (t === 'gold') return 1.2;
    if (t === 'silver') return 1.1;
    return 1; // bronze or unknown
}

// Allow the user to choose payment method before payment/finish
// POST /rides/update-payment-method { rideId, paymentMethod }
// Only when the ride is not yet paid and is in accepted/ongoing
module.exports.updatePaymentMethod = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { rideId, paymentMethod } = req.body;
    try {
        if (!rideId || !paymentMethod) {
            return res.status(400).json({ error: 'rideId and paymentMethod are required' });
        }
        const method = String(paymentMethod).toLowerCase();
        if (!['cod', 'online', 'wallet'].includes(method)) {
            return res.status(400).json({ error: 'Invalid payment method' });
        }

        // Ensure the requester is the ride user; fall back to existence check if auth model differs
        const ride = await rideModel.findOne({ _id: rideId }).populate('user').populate('captain');
        if (!ride) return res.status(404).json({ error: 'Ride not found' });

        // Optional: enforce only the user can update
        const requesterId = req.user?._id?.toString?.();
        const rideUserId = ride.user?._id?.toString?.();
        if (requesterId && rideUserId && requesterId !== rideUserId) {
            return res.status(403).json({ error: 'Only the ride owner can update payment method' });
        }

        // Cannot change after paid
        if (ride.paymentId || ride.orderId || ride.signature) {
            return res.status(400).json({ error: 'Payment already completed' });
        }

        // Only reasonable states
        if (!['accepted', 'ongoing'].includes(ride.status)) {
            return res.status(400).json({ error: 'Payment method can only be changed during accepted/ongoing ride' });
        }

        // Persist the method (normalize wallet->online for fee logic)
        const normalized = method === 'wallet' ? 'online' : method;
        await rideModel.updateOne({ _id: ride._id }, { $set: { paymentMethod: normalized } });

        // Emit to both parties so UIs update
        try {
            const uid = ride.user?._id?.toString?.();
            const cid = ride.captain?._id?.toString?.();
            const payload = { event: 'payment-method-updated', data: { rideId: ride._id.toString(), paymentMethod: normalized } };
            if (uid) sendMsgToUserRoom(uid, payload);
            if (cid) sendMsgToCaptainRoom(cid, payload);
        } catch (emitErr) {
            console.warn('Emit payment-method-updated failed:', emitErr?.message);
        }

        return res.status(200).json({ message: 'Payment method updated', paymentMethod: normalized });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
module.exports.createRide = async(req,res)=>{
    
    console.log('createRide called with body:', req.body);
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log('Validation errors:', errors.array());
        return res.status(400).json({errors:errors.array()});
    }
    const {userId,pickup,destination,vehicleType,rewardsPointsToUse} = req.body;
    try{
        const ride = await rideService.createRide({
            userId:req.user._id,
            pickup,
            destination,
            vehicleType,
            rewardsPointsToUse: typeof rewardsPointsToUse === 'number' ? rewardsPointsToUse : undefined
        });
        console.log('Ride object to be saved:', ride);
        const pickupCoordinates = await mapsService.getAddressCoordinate(pickup);
        console.log("pickupCoordinates",pickupCoordinates);
        const captainsInRadius = await mapsService.getCaptainsInTheRadius(
            pickupCoordinates.ltd,
            pickupCoordinates.lng,
            10,
            vehicleType
        );
        console.log("captainsInRadius",captainsInRadius);
        
        const rideWithUser = await rideModel.findOne({_id:ride._id}).populate('user').select('+otp');
        console.log("rideWithUser",rideWithUser);
        let emittedCount = 0;
        captainsInRadius.map(async(captain)=>{
            // Extra guard: skip captains with mismatched vehicle types
            const capType = captain?.captain?.vehicle?.vehicleType;
            if (vehicleType && capType && capType !== vehicleType) {
                return;
            }
            if (captain.socketId) {
                const payload = { ...rideWithUser.toObject?.() || rideWithUser, distanceKm: (Number(rideWithUser.distance||0)/1000) };
                console.log("Emitting to socketId:", captain.socketId, "with data:", payload);
                sendMsgToSocketId(captain.socketId, {
                    event: 'new-ride',
                    data: payload
                });
                emittedCount += 1;
            } else {
                console.log("Captain", captain.name, "is not online (no socketId)");
            }
        });
        if (emittedCount === 0 && vehicleType) {
            console.log('[createRide] No direct socket emits; falling back to vehicle type room for', vehicleType);
            const payload = { ...rideWithUser.toObject?.() || rideWithUser, distanceKm: (Number(rideWithUser.distance||0)/1000) };
            sendMsgToVehicleTypeRoom(vehicleType, { event: 'new-ride', data: payload });
        }
        // Only send the response after all the above is done
        console.log('Sending response to client:', {message:'Ride created successfully',ride});
        res.status(201).json({message:'Ride created successfully',ride});
    }catch(error){
        console.error('Error in createRide:', error);
        res.status(500).json({error:error.message});
    }
}

// GET /rides/shared/start?rideId=&otp=
// Starts a shared ride after OTP verification; notifies all passengers and the captain
module.exports.startSharedRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, otp } = req.query;
    try {
        if (!rideId || !otp) {
            return res.status(400).json({ error: 'Ride ID and OTP are required' });
        }
        const ride = await rideModel.findOne({ _id: rideId }).populate('user').populate('captain').select('+otp');
        if (!ride) return res.status(404).json({ error: 'Ride not found' });
        if (!ride.isShared) return res.status(400).json({ error: 'Ride is not shared' });
        if (ride.status !== 'accepted') return res.status(400).json({ error: 'Ride not accepted' });
        if (ride.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

        await rideModel.findOneAndUpdate({ _id: rideId }, { status: 'ongoing' });
        ride.status = 'ongoing';

        // notify passengers
        const passengerIds = (ride.passengers || []).map(p => p.user?.toString()).filter(Boolean);
        const uniquePassengerIds = Array.from(new Set(passengerIds));
        uniquePassengerIds.forEach(uid => {
            const payload = { ...ride.toObject?.() || ride, passengerCount: (ride.passengers || []).length };
            sendMsgToUserRoom(uid, { event: 'shared-ride-started', data: payload });
        });
        // notify captain
        const captainId = ride?.captain?._id?.toString?.() || ride?.captain?.toString?.();
        if (captainId) {
            const payload = { ...ride.toObject?.() || ride, passengerCount: (ride.passengers || []).length };
            sendMsgToCaptainRoom(captainId, { event: 'shared-ride-started', data: payload });
        }

        return res.status(200).json({ message: 'Shared ride started successfully', ride });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// POST /rides/shared/end { rideId }
// Completes a shared ride; computes fees and captain earnings; notifies all passengers and captain
module.exports.endSharedRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { rideId } = req.body;
    try {
        const ride = await rideModel.findOne({ _id: rideId, captain: req.user._id }).populate('user').populate('captain');
        if (!ride) return res.status(404).json({ error: 'Ride not found' });
        if (!ride.isShared) return res.status(400).json({ error: 'Ride is not shared' });
        if (ride.status !== 'ongoing') return res.status(400).json({ error: 'Ride is not in ongoing state' });

        // Block completion for online method until payment is done
        if ((ride.paymentMethod === 'online') && !(ride.paymentId || ride.orderId || ride.signature)) {
            return res.status(400).json({ error: 'Payment not completed yet. Please complete payment before finishing the ride.' });
        }

        // fees/earnings for SHARED: base on total passengers
        const passengerCount = Math.max(1, (ride.passengers || []).length);
        const perPassengerFare = Number(ride.farePerPassenger || ride.fare || 0);
        const totalFare = perPassengerFare * passengerCount;
        const isPaidOnline = Boolean(ride.paymentId || ride.orderId || ride.signature || (ride.paymentMethod && ride.paymentMethod !== 'cod'));
        const companyFee = isPaidOnline ? Math.round(totalFare * 0.02) : 0;
        const captainEarnings = Math.max(0, totalFare - companyFee);

        await rideModel.findOneAndUpdate({ _id: rideId }, {
            status: 'completed',
            companyFee,
            captainEarnings
        });
        ride.status = 'completed';
        ride.companyFee = companyFee;
        ride.captainEarnings = captainEarnings;
        console.log('[endSharedRide] Totals', { passengerCount, perPassengerFare, totalFare, companyFee, captainEarnings, isPaidOnline });

        // Credit captain earnings for COD directly upon shared ride completion (avoid double-counting for online)
        try {
            const isPaidOnlineLocal = Boolean(ride.paymentId || ride.orderId || ride.signature || (ride.paymentMethod && ride.paymentMethod !== 'cod'));
            if (!isPaidOnlineLocal) {
                const captainUserDoc = await userModel.findById(ride.captain?._id || req.user._id);
                if (captainUserDoc?.captain) {
                    const now = new Date();
                    const last = captainUserDoc.captain.earningsLastReset || new Date(0);
                    const isSameDay = last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth() && last.getDate() === now.getDate();
                    if (!isSameDay) {
                        captainUserDoc.captain.earningsToday = 0;
                        captainUserDoc.captain.earningsLastReset = now;
                        console.log('[endSharedRide] Reset earningsToday due to new day', { captainId: captainUserDoc._id.toString(), lastReset: last, now });
                    }
                    // Credit total shared fare (perPassenger * passengerCount)
                    const sharedPassengerCount = Math.max(1, (ride.passengers || []).length);
                    const perPassengerFareLocal = Number(ride.farePerPassenger || ride.fare || 0);
                    const fareToAddLocal = perPassengerFareLocal * sharedPassengerCount;
                    const before = Number(captainUserDoc.captain.earningsToday || 0);
                    captainUserDoc.captain.earningsToday = before + fareToAddLocal;
                    await captainUserDoc.save();
                    console.log('[endSharedRide] Credited COD earnings (shared)', { rideId: ride._id.toString(), sharedPassengerCount, perPassengerFareLocal, fareToAddLocal, before, after: captainUserDoc.captain.earningsToday });

                    // Notify captain client
                    if (ride.captain?.socketId) {
                        sendMsgToSocketId(ride.captain.socketId, {
                            event: 'earnings-updated',
                            data: {
                                earningsToday: captainUserDoc.captain.earningsToday,
                                earningsLastReset: captainUserDoc.captain.earningsLastReset
                            }
                        });
                    }
                    const capIdRoom = (ride.captain?._id || req.user._id)?.toString?.();
                    if (capIdRoom) {
                        sendMsgToCaptainRoom(capIdRoom, {
                            event: 'earnings-updated',
                            data: {
                                earningsToday: captainUserDoc.captain.earningsToday,
                                earningsLastReset: captainUserDoc.captain.earningsLastReset
                            }
                        });
                    }
                }
            }
        } catch (e) {
            console.warn('[endRide] Failed to credit COD earnings or emit:', e?.message);
        }

        // notify passengers
        const passengerIds = (ride.passengers || []).map(p => p.user?.toString()).filter(Boolean);
        const uniquePassengerIds = Array.from(new Set(passengerIds));
        uniquePassengerIds.forEach(uid => {
            const payload = { ...ride.toObject?.() || ride, passengerCount: (ride.passengers || []).length };
            sendMsgToUserRoom(uid, { event: 'shared-ride-ended', data: payload });
        });
        // notify captain
        const captainId = ride?.captain?._id?.toString?.() || ride?.captain?.toString?.();
        if (captainId) {
            const payload = { ...ride.toObject?.() || ride, passengerCount: (ride.passengers || []).length };
            sendMsgToCaptainRoom(captainId, { event: 'shared-ride-ended', data: payload });
        }

        // Update captain aggregate stats like in solo flow
        try {
            const stats = await computeCaptainStats(ride.captain?._id || req.user._id);
            sendMsgToCaptainRoom((ride.captain?._id || req.user._id).toString(), {
                event: 'captain-stats-updated',
                data: stats
            });
        } catch (e) {
            console.warn('Failed to emit captain-stats-updated after endSharedRide:', e?.message);
        }

        // Optional: eco gamification per passenger (phase 1: skip to avoid widening scope)
        // We keep solo eco updates in endRide. Shared-specific eco can be added next.

        return res.status(200).json({ message: 'Shared ride ended successfully', ride });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// POST /rides/shared/join { rideId }
// Adds the authenticated user as a passenger if seats are available.
module.exports.joinSharedRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { rideId } = req.body;
    try {
        const ride = await rideModel.findById(rideId).populate('user').populate('captain');
        if (!ride) return res.status(404).json({ error: 'Ride not found' });
        if (!ride.isShared) return res.status(400).json({ error: 'Ride is not shared' });
        if (['ongoing', 'completed', 'cancelled'].includes(ride.status)) {
            return res.status(400).json({ error: 'Ride is not joinable' });
        }
        if (Number(ride.availableSeats || 0) <= 0) {
            return res.status(400).json({ error: 'No seats available' });
        }
        const already = (ride.passengers || []).some(p => p.user?.toString() === req.user._id.toString());
        if (already) return res.status(400).json({ error: 'Already joined' });

        // Add passenger
        const farePerPassenger = Number(ride.farePerPassenger || ride.fare || 0);
        ride.passengers = ride.passengers || [];
        ride.passengers.push({
            user: req.user._id,
            pickup: ride.pickup,
            destination: ride.destination,
            fare: farePerPassenger,
            status: 'requested'
        });
        ride.availableSeats = Math.max(0, Number(ride.availableSeats || 0) - 1);
        await ride.save();

        // Notify creator, captain (if any), and the joiner
        try {
            const creatorId = ride.user?._id?.toString();
            if (creatorId) {
                const payload = { ...ride.toObject(), passengerCount: (ride.passengers || []).length };
                sendMsgToUserRoom(creatorId, { event: 'shared-ride-updated', data: payload });
            }
            if (ride.captain?._id) {
                const payload = { ...ride.toObject(), passengerCount: (ride.passengers || []).length };
                sendMsgToCaptainRoom(ride.captain._id.toString(), { event: 'shared-ride-updated', data: payload });
            }
            sendMsgToUserRoom(req.user._id.toString(), { event: 'shared-ride-joined', data: { ...ride.toObject(), passengerCount: (ride.passengers || []).length } });
        } catch (e) {
            console.warn('joinSharedRide emit warn:', e?.message);
        }

        return res.status(200).json({ message: 'Joined shared ride', ride });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// POST /rides/shared/leave { rideId }
// Removes the authenticated user from passengers if present and seat is released.
module.exports.leaveSharedRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { rideId } = req.body;
    try {
        const ride = await rideModel.findById(rideId).populate('user').populate('captain');
        if (!ride) return res.status(404).json({ error: 'Ride not found' });
        if (!ride.isShared) return res.status(400).json({ error: 'Ride is not shared' });
        if (['ongoing', 'completed', 'cancelled'].includes(ride.status)) {
            return res.status(400).json({ error: 'Ride cannot be modified' });
        }
        const before = (ride.passengers || []).length;
        ride.passengers = (ride.passengers || []).filter(p => p.user?.toString() !== req.user._id.toString());
        const after = ride.passengers.length;
        if (after === before) {
            return res.status(400).json({ error: 'You are not a passenger' });
        }
        ride.availableSeats = Math.min(Number(ride.maxSeats || 0), Number(ride.availableSeats || 0) + 1);
        await ride.save();

        try {
            const creatorId = ride.user?._id?.toString();
            if (creatorId) {
                const payload = { ...ride.toObject(), passengerCount: (ride.passengers || []).length };
                sendMsgToUserRoom(creatorId, { event: 'passenger-left', data: payload });
            }
            if (ride.captain?._id) {
                const payload = { ...ride.toObject(), passengerCount: (ride.passengers || []).length };
                sendMsgToCaptainRoom(ride.captain._id.toString(), { event: 'passenger-left', data: payload });
            }
            sendMsgToUserRoom(req.user._id.toString(), { event: 'shared-ride-left', data: { ...ride.toObject(), passengerCount: (ride.passengers || []).length } });
        } catch (e) {
            console.warn('leaveSharedRide emit warn:', e?.message);
        }

        return res.status(200).json({ message: 'Left shared ride', ride });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// POST /rides/shared/confirm { rideId }
// Captain accepts the shared ride (similar to confirmRide)
module.exports.confirmSharedRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { rideId } = req.body;
    try {
        const ride = await rideModel.findById(rideId).populate('user').populate('captain');
        if (!ride) return res.status(404).json({ error: 'Ride not found' });
        if (!ride.isShared) return res.status(400).json({ error: 'Ride is not shared' });

        const updated = await rideModel.findOneAndUpdate(
            { _id: rideId },
            { status: 'accepted', captain: req.user._id },
            { new: true }
        ).populate('user').populate('captain');

        // Re-fetch with OTP included for client display in WaitingForDriver
        const updatedWithOtp = await rideModel.findById(updated._id).populate('user').populate('captain').select('+otp');

        // Notify all passengers (creator and joiners)
        const passengerIds = (updatedWithOtp.passengers || []).map(p => p.user?.toString()).filter(Boolean);
        const uniquePassengerIds = Array.from(new Set(passengerIds));
        uniquePassengerIds.forEach(uid => {
            const payload = { ...updatedWithOtp.toObject(), passengerCount: (updatedWithOtp.passengers || []).length, distanceKm: (Number(updatedWithOtp.distance||0)/1000) };
            sendMsgToUserRoom(uid, { event: 'shared-ride-confirmed', data: payload });
        });

        // Also notify captain with passenger count so UI can reflect shared seats
        const captainId = updatedWithOtp?.captain?._id?.toString?.();
        if (captainId) {
            const payload = { ...updatedWithOtp.toObject(), passengerCount: (updatedWithOtp.passengers || []).length, distanceKm: (Number(updatedWithOtp.distance||0)/1000) };
            sendMsgToCaptainRoom(captainId, { event: 'shared-ride-confirmed', data: payload });
        }

        return res.status(200).json({ ride: updatedWithOtp });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// POST /rides/shared/create
// Body: { pickup, destination, vehicleType, maxSeats?, discountFactor? }
// Phase 1: Create a shared ride with discounted per-passenger fare and list the creator
// as the first passenger. Future phases may allow multiple passengers to join.
module.exports.createSharedRide = async (req, res) => {
    console.log('createSharedRide called with body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { pickup, destination, vehicleType } = req.body;
        // Disallow shared rides for single-capacity vehicle types
        const singleCapacityTypes = new Set(['ev_bike', 'bike', 'scooter']);
        if (singleCapacityTypes.has(String(vehicleType))) {
            return res.status(400).json({ error: 'Shared rides are not available for this vehicle type' });
        }
        // Optional controls with safe defaults
        const maxSeats = Math.min(Math.max(Number(req.body.maxSeats || 2), 1), 4);
        const discountFactorRaw = Number(req.body.discountFactor);
        // Default: no discount for shared rides (each passenger pays solo fare)
        const discountFactor = Number.isFinite(discountFactorRaw) && discountFactorRaw > 0 && discountFactorRaw < 1 ? discountFactorRaw : 1.0;

        // Base fare from solo pricing
        const fareMap = await rideService.getFare(pickup, destination);
        const soloFare = Number(fareMap?.[vehicleType] || 0);
        const farePerPassenger = Math.max(0, Math.round(soloFare * discountFactor));

        // Persist as a shared ride. For compatibility with existing flows, we keep ride.fare
        // equal to farePerPassenger in phase 1 (single passenger to start with).
        // Generate a 4-digit OTP similar to solo flow
        const otp = crypto.randomInt(1000, 10000).toString();

        // Also compute distance/duration so captain UI can show it
        const distanceTime = await mapsService.getDistanceTime(pickup, destination);

        const ride = new rideModel({
            user: req.user._id,
            pickup,
            destination,
            fare: farePerPassenger,
            vehicleType, // persist vehicle type for clients and filters
            isShared: true,
            maxSeats,
            availableSeats: Math.max(0, maxSeats - 1),
            farePerPassenger,
            otp,
            distance: distanceTime?.distance?.value,
            duration: Math.round((distanceTime?.duration?.value || 0) / 60),
            passengers: [
                {
                    user: req.user._id,
                    pickup,
                    destination,
                    fare: farePerPassenger,
                    status: 'requested'
                }
            ]
        });
        await ride.save();

        // Enrich with user for socket payloads
        const rideWithUser = await rideModel.findOne({ _id: ride._id }).populate('user');

        // Broadcast to nearby captains of the same vehicle type
        const pickupCoordinates = await mapsService.getAddressCoordinate(pickup);
        const captainsInRadius = await mapsService.getCaptainsInTheRadius(
            pickupCoordinates.ltd,
            pickupCoordinates.lng,
            10,
            vehicleType
        );
        console.log('[createSharedRide] captainsInRadius:', captainsInRadius.map(c => ({ id: c._id?.toString?.(), vt: c?.captain?.vehicle?.vehicleType, sid: c.socketId })));
        let emittedCount = 0;
        captainsInRadius.map((captain) => {
            const capType = captain?.captain?.vehicle?.vehicleType;
            if (vehicleType && capType && capType !== vehicleType) return;
            if (captain.socketId) {
                const payload = {
                    ...rideWithUser.toObject(),
                    passengerCount: (rideWithUser.passengers || []).length
                };
                sendMsgToSocketId(captain.socketId, {
                    event: 'new-shared-ride',
                    data: payload
                });
                emittedCount += 1;
            }
        });
        if (emittedCount === 0 && vehicleType) {
            // Fallback: emit to vehicle-type room in case socketId wasn't saved yet
            console.log('[createSharedRide] No direct socket emits; falling back to vehicle type room for', vehicleType);
            const payload = {
                ...rideWithUser.toObject(),
                passengerCount: (rideWithUser.passengers || []).length
            };
            sendMsgToVehicleTypeRoom(vehicleType, { event: 'new-shared-ride', data: payload });
        }

        return res.status(201).json({ message: 'Shared ride created', ride: rideWithUser });
    } catch (error) {
        console.error('Error in createSharedRide:', error);
        return res.status(500).json({ error: error.message });
    }
}

// POST /rides/rate { rideId, rating, comment? }
// Allows the ride user to rate the captain after ride completion.
module.exports.rateRide = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { rideId, rating, comment } = req.body;
        const ride = await rideModel.findById(rideId).populate('captain').populate('user');
        if (!ride) return res.status(404).json({ error: 'Ride not found' });
        // Only the user who took the ride can rate
        if (!ride.user || ride.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (ride.status !== 'completed') {
            return res.status(400).json({ error: 'Ride must be completed to rate' });
        }
        if (ride.rating && ride.ratedAt) {
            return res.status(400).json({ error: 'Ride already rated' });
        }
        const sanitizedRating = Number(rating);
        if (!Number.isFinite(sanitizedRating) || sanitizedRating < 1 || sanitizedRating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Save rating on ride
        ride.rating = sanitizedRating;
        if (comment && typeof comment === 'string') ride.ratingComment = comment.slice(0, 500);
        ride.ratedAt = new Date();
        await ride.save();

        // Recompute captain efficiency as avg of ratings
        const captainId = ride.captain?._id?.toString();
        let efficiencyScore = 0;
        if (captainId) {
            const ratingAgg = await rideModel.aggregate([
                { $match: { captain: ride.captain._id, rating: { $gte: 1 } } },
                { $group: { _id: null, avgRating: { $avg: '$rating' } } }
            ]);
            efficiencyScore = ratingAgg?.[0]?.avgRating || 0;
            // Persist efficiency on captain profile
            await userModel.updateOne({ _id: ride.captain._id }, { $set: { 'captain.efficiencyScore': efficiencyScore } });

            // Emit fresh stats including efficiency to captain room
            try {
                const stats = await computeCaptainStats(ride.captain._id);
                sendMsgToCaptainRoom(captainId, { event: 'captain-stats-updated', data: stats });
            } catch (e) {
                console.warn('Failed to emit captain-stats-updated after rating:', e?.message);
            }
        }

        return res.status(200).json({ message: 'Rating submitted', rating: sanitizedRating, efficiencyScore });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


// POST /rides/captain/cancel { rideId }
// Captain cancels before starting the ride (accepted stage). Re-queue the ride to pending and re-broadcast.
module.exports.cancelRideByCaptain = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { rideId } = req.body;
        if (!rideId) return res.status(400).json({ error: 'rideId is required' });

        let ride = await rideModel.findById(rideId).populate('user').populate('captain').select('+otp');
        if (!ride) return res.status(404).json({ error: 'Ride not found' });

        // Only the assigned captain can cancel at this stage
        if (!ride.captain || ride.captain._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only the assigned captain can cancel this ride' });
        }
        // Allow cancel only if not yet started
        if (ride.status !== 'accepted') {
            return res.status(400).json({ error: 'Ride cannot be canceled at this stage' });
        }

        // Reset to pending and detach captain
        await rideModel.updateOne({ _id: ride._id }, { $set: { status: 'pending' }, $unset: { captain: 1 } });
        // Re-fetch lightweight for socket payloads
        ride = await rideModel.findById(rideId).populate('user').select('+otp');

        // Notify user to revert UI to LookingForDriver
        try {
            const uid = ride.user?._id?.toString?.();
            if (uid) {
                const payload = { ...ride.toObject?.() || ride, distanceKm: (Number(ride.distance||0)/1000) };
                sendMsgToUserRoom(uid, { event: 'ride-status-updated', data: payload });
                sendMsgToUserRoom(uid, { event: 'ride-requeued', data: payload });
            }
        } catch (emitErr) {
            console.warn('[cancelRideByCaptain] user emit failed:', emitErr?.message);
        }

        // Re-broadcast to nearby captains based on vehicleType
        try {
            const pickupCoordinates = await mapsService.getAddressCoordinate(ride.pickup);
            const captainsInRadius = await mapsService.getCaptainsInTheRadius(
                pickupCoordinates.ltd,
                pickupCoordinates.lng,
                10,
                ride.vehicleType
            );
            const payload = { ...ride.toObject?.() || ride, distanceKm: (Number(ride.distance||0)/1000) };
            let emitted = 0;
            captainsInRadius.forEach((cap) => {
                const capType = cap?.captain?.vehicle?.vehicleType;
                if (ride.vehicleType && capType && capType !== ride.vehicleType) return;
                if (cap.socketId) {
                    sendMsgToSocketId(cap.socketId, { event: ride.isShared ? 'new-shared-ride' : 'new-ride', data: payload });
                    emitted += 1;
                }
            });
            if (emitted === 0 && ride.vehicleType) {
                sendMsgToVehicleTypeRoom(ride.vehicleType, { event: ride.isShared ? 'new-shared-ride' : 'new-ride', data: payload });
            }
        } catch (emitErr) {
            console.warn('[cancelRideByCaptain] captain rebroadcast failed:', emitErr?.message);
        }

        return res.status(200).json({ message: 'Ride re-queued', ride });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// GET /rides/captain/stats
// Returns aggregate stats for the authenticated captain
// Helper to compute captain aggregate stats
async function computeCaptainStats(captainId) {
    const totalRides = await rideModel.countDocuments({ captain: captainId });
    const agg = await rideModel.aggregate([
        { $match: { captain: captainId } },
        { $group: { _id: null, totalDistance: { $sum: { $ifNull: [ '$distance', 0 ] } } } }
    ]);
    const ratingAgg = await rideModel.aggregate([
        { $match: { captain: captainId, rating: { $gte: 1 } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    const totalDistanceMeters = agg?.[0]?.totalDistance || 0;
    const totalDistanceKm = totalDistanceMeters / 1000;
    const efficiencyScore = ratingAgg?.[0]?.avgRating || 0; // keep 0-5 scale
    const ratingsCount = ratingAgg?.[0]?.count || 0;
    return { totalRides, totalDistanceMeters, totalDistanceKm, efficiencyScore, ratingsCount };
}

module.exports.captainStats = async (req, res) => {
    try {
        const captainId = req.user?._id;
        if (!captainId) return res.status(401).json({ error: 'Unauthorized' });
        const stats = await computeCaptainStats(captainId);
        // Also include earningsToday with a same-day check and reset if needed
        const captainUser = await userModel.findById(captainId);
        let earningsToday = 0;
        let earningsLastReset = null;
        if (captainUser?.captain) {
            const now = new Date();
            const last = captainUser.captain.earningsLastReset || new Date(0);
            const isSameDay = last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth() && last.getDate() === now.getDate();
            if (!isSameDay) {
                // Reset earnings and persist the reset
                captainUser.captain.earningsToday = 0;
                captainUser.captain.earningsLastReset = now;
                await captainUser.save();
            }
            earningsToday = Number(captainUser.captain.earningsToday || 0);
            earningsLastReset = captainUser.captain.earningsLastReset || now;
        }

        return res.status(200).json({ ...stats, earningsToday, earningsLastReset });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// Body: { rideId }
// Effects:
// - Resets captain earnings today if date changed, then adds ride.fare to earningsToday
// - If captain vehicle is eco-friendly, add small reward points (1-5) to user
// - Emits 'earnings-updated' to captain socket for real-time UI update
module.exports.completePayment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { rideId } = req.body;
    try {
        const ride = await rideModel.findOne({ _id: rideId }).populate('user').populate('captain');
        if (!ride) return res.status(404).json({ error: 'Ride not found' });

        // If this ride was created as COD, do not allow completing online payment accidentally
        if (ride.paymentMethod === 'cod') {
            return res.status(400).json({ error: 'Ride is COD. completePayment must not be called for COD rides.' });
        }

        // Idempotency: if already marked paid, exit early with 200
        if (ride.paymentId || ride.orderId || ride.signature) {
            return res.status(200).json({ message: 'Payment already completed' });
        }

        // Mark as paid FIRST to avoid double-credit on retries
        const paymentId = crypto.randomBytes(12).toString('hex');
        await rideModel.updateOne({ _id: ride._id }, {
            $set: { paymentMethod: 'online', paymentId }
        });
        console.log('[completePayment] Marked paid', { rideId: ride._id.toString(), paymentId });

        // Post-payment side effects (best-effort)
        let userPointsAdded = 0;
        let captainPointsAdded = 0;
        let isEco = false;
        try {
            // Credit captain earnings using atomic update to avoid unrelated validation failures (e.g., vehicle schema)
            const captainUser = await userModel.findById(ride.captain?._id);
            if (captainUser?.captain) {
                const now = new Date();
                const last = captainUser.captain.earningsLastReset || new Date(0);
                const isSameDay = last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth() && last.getDate() === now.getDate();
                // For shared rides, credit total fare across all passengers
                const passengerCountCP = ride.isShared ? Math.max(1, (ride.passengers || []).length) : 1;
                const perPassengerFareCP = ride.isShared ? Number(ride.farePerPassenger || ride.fare || 0) : Number(ride.fare || 0);
                const fareToAdd = perPassengerFareCP * passengerCountCP;
                const before = Number(captainUser.captain.earningsToday || 0);

                const update = {
                    $inc: { 'captain.earningsToday': fareToAdd },
                };
                if (!isSameDay) {
                    update.$set = { 'captain.earningsLastReset': now, 'captain.earningsToday': fareToAdd };
                    // Note: setting earningsToday directly when resetting day to avoid relying on previous value
                    delete update.$inc;
                }
                await userModel.updateOne({ _id: captainUser._id }, update, { runValidators: false });
                const after = isSameDay ? before + fareToAdd : fareToAdd;
                console.log('[completePayment] Credited ONLINE earnings (atomic)', { rideId: ride._id.toString(), fareToAdd, before, after, resetDay: !isSameDay, isShared: !!ride.isShared, passengerCount: passengerCountCP, perPassengerFare: perPassengerFareCP });

                // Rewards accrual for user and captain with eco and tier multipliers
                isEco = Boolean(captainUser.captain?.vehicle?.ecoFriendly);
                const user = await userModel.findById(ride.user?._id);
                const userTierMult = getTierMultiplier(user?.rewardsTier);
                const userEarnRate = isEco ? 0.10 : 0.03; // 10% eco, 3% non-eco
                const captainEarnRate = isEco ? 0.05 : 0.02; // captain points share

                userPointsAdded = Math.max(0, Math.floor(fareToAdd * userEarnRate * userTierMult));
                captainPointsAdded = Math.max(0, Math.floor(fareToAdd * captainEarnRate));

                if (userPointsAdded > 0 && user?._id) {
                    await userModel.updateOne({ _id: user._id }, { $inc: { rewardsPoints: userPointsAdded } });
                }
                if (captainPointsAdded > 0) {
                    await userModel.updateOne({ _id: captainUser._id }, { $inc: { 'captain.rewardsPoints': captainPointsAdded } });
                }

                // Notify captain to update earnings
                if (ride.captain?.socketId) {
                    sendMsgToSocketId(ride.captain.socketId, {
                        event: 'earnings-updated',
                        data: {
                            earningsToday: captainUser.captain.earningsToday,
                            earningsLastReset: captainUser.captain.earningsLastReset
                        }
                    });
                }

                // Also push refreshed aggregate stats to the captain room
                try {
                    const stats = await computeCaptainStats(ride.captain?._id || captainUser._id);
                    sendMsgToCaptainRoom((ride.captain?._id || captainUser._id).toString(), {
                        event: 'captain-stats-updated',
                        data: stats
                    });
                } catch (e) {
                    console.warn('Failed to emit captain-stats-updated after completePayment:', e?.message);
                }
            }
        } catch (sideEffectErr) {
            console.warn('completePayment side-effects failed:', sideEffectErr?.message);
        }

        // Emit payment-completed
        try {
            const uid = ride.user?._id?.toString?.();
            const cid = ride.captain?._id?.toString?.();
            if (uid) sendMsgToUserRoom(uid, { event: 'payment-completed', data: { rideId: ride._id.toString(), paymentId } });
            if (cid) sendMsgToCaptainRoom(cid, { event: 'payment-completed', data: { rideId: ride._id.toString(), paymentId } });
        } catch (emitErr) {
            console.warn('Emit payment-completed failed:', emitErr?.message);
        }

        return res.status(200).json({
            message: 'Payment completed',
            userPointsAdded,
            captainPointsAdded,
            isEco
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// POST /rewards/quote { rideId }
// Returns suggested discount based on user points and tier caps
module.exports.rewardsQuote = async (req, res) => {
    try {
        const { rideId } = req.body;
        const ride = await rideModel.findById(rideId).populate('user');
        if (!ride) return res.status(404).json({ error: 'Ride not found' });
        const user = await userModel.findById(ride.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const fare = Number(ride.fare || 0);
        const tier = (user.rewardsTier || 'bronze').toLowerCase();
        const maxPercent = tier === 'gold' ? 0.10 : tier === 'silver' ? 0.07 : 0.05;
        const perRideCap = 50; // INR cap per ride
        const maxByPercent = Math.floor(fare * maxPercent);
        const discountAmount = Math.max(0, Math.min(maxByPercent, perRideCap, user.rewardsPoints));
        return res.status(200).json({
            fare,
            tier,
            maxPercent,
            perRideCap,
            availablePoints: user.rewardsPoints,
            discountAmount,
            pointsToUse: discountAmount // 1 point == Rs 1
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// POST /rewards/redeem { rideId, points }
// Deduct points to be applied to the current ride (lock-in); business can later
// associate this with a payment record if needed.
module.exports.rewardsRedeem = async (req, res) => {
    try {
        const { rideId, points } = req.body;
        if (!rideId || typeof points !== 'number' || points <= 0) {
            return res.status(400).json({ error: 'Invalid payload' });
        }
        const ride = await rideModel.findById(rideId).populate('user');
        if (!ride) return res.status(404).json({ error: 'Ride not found' });
        const user = await userModel.findById(ride.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.rewardsPoints < points) {
            return res.status(400).json({ error: 'Insufficient points' });
        }
        await userModel.updateOne({ _id: user._id }, { $inc: { rewardsPoints: -points } });
        return res.status(200).json({ message: 'Points redeemed', points });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

module.exports.getFare = async(req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    const {pickup,destination} = req.query;
    try{
        const fare = await rideService.getFare(pickup,destination);
        res.status(200).json(fare);
    }catch(error){
        res.status(500).json({error:error.message});
    }
}


module.exports.confirmRide = async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }

    const {rideId} = req.body;

    try{
        const ride = await rideService.confirmRide({rideId,captain:req.user}) // here user points out to be a captain as db is same for both
        const userId = ride?.user?._id?.toString?.() || ride?.user?.toString?.();
        const userSocketId = ride?.user?.socketId;
        console.log('[confirmRide] Emitting ride-confirmed:', { rideId: ride?._id?.toString?.(), userId, userSocketId, vehicleType: ride?.vehicleType });
        if (userSocketId) {
            sendMsgToSocketId(userSocketId,{
                event:'ride-confirmed',
                data:ride
            })
        } else if (userId) {
            // Fallback to user room if socketId missing (reconnect race)
            sendMsgToUserRoom(userId, {
                event: 'ride-confirmed',
                data: ride
            });
        } else {
            console.warn('[confirmRide] Missing user info on ride, cannot emit ride-confirmed');
        }

        // Also notify captain with full payload so captain UI has distance and OTP
        try {
            const captainId = (req.user?._id || ride?.captain?._id || ride?.captain)?.toString?.();
            if (captainId) {
                const payload = { ...ride.toObject?.() || ride, passengerCount: (ride.passengers || []).length, distanceKm: (Number(ride.distance||0)/1000) };
                sendMsgToCaptainRoom(captainId, { event: 'ride-confirmed', data: payload });
            }
        } catch (emitErr) {
            console.warn('[confirmRide] captain emit failed:', emitErr?.message);
        }
        return res.status(200).json({ride})
    }catch(err){
        return res.status(500).json({message:err.message})
    }
}

module.exports.startRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, otp } = req.query;

    try {
        if (!rideId || !otp) {
            return res.status(400).json({ error: "Ride ID and OTP are required" });
        }

        const ride = await rideModel.findOne({
            _id: rideId
        }).populate('user').populate('captain').select('+otp');

        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        if (ride.status !== 'accepted') {
            return res.status(400).json({ error: 'Ride not accepted' });
        }

        if (ride.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        await rideModel.findOneAndUpdate({
            _id: rideId
        }, {
            status: 'ongoing'
        });

        // Notify user that ride has started (with fallback to user room)
        const userId = ride?.user?._id?.toString?.() || ride?.user?.toString?.();
        const userSocketId = ride?.user?.socketId;
        console.log('[startRide] Emitting ride-started:', { rideId, userId, userSocketId });
        if (userSocketId) {
            sendMsgToSocketId(ride.user.socketId, {
                event: 'ride-started',
                data: ride
            });
        } else if (userId) {
            sendMsgToUserRoom(userId, {
                event: 'ride-started',
                data: ride
            });
        } else {
            console.warn('[startRide] Missing user info on ride, cannot emit ride-started');
        }

        return res.status(200).json({ 
            message: 'Ride started successfully', 
            ride: ride 
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


module.exports.endRide = async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }
    const {rideId} = req.body;
    try{
        // First find the ride to check its current status
        const ride = await rideModel.findOne({
            _id: rideId,
            captain: req.user._id
        }).populate('user').populate('captain');
        
        if(!ride){
            return res.status(404).json({error: "Ride not found"})
        }
        if(ride.status !== 'ongoing'){
            return res.status(400).json({error: "Ride is not in ongoing state"})
        }

        // If payment method is online but no payment record, do not allow finishing the ride yet
        const hasPaymentRecord = Boolean(ride.paymentId || ride.orderId || ride.signature);
        if ((ride.paymentMethod === 'online') && !hasPaymentRecord) {
            return res.status(400).json({ error: 'Payment not completed yet. Please complete payment before finishing the ride.' });
        }

        // Compute company fee and captain earnings (UI requested 2% on online/wallet)
        const fareNum = Number(ride.fare || 0);
        const isPaidOnline = Boolean(ride.paymentId || ride.orderId || ride.signature || (ride.paymentMethod && ride.paymentMethod !== 'cod'));
        const companyFee = isPaidOnline ? Math.round(fareNum * 0.02) : 0;
        const captainEarnings = Math.max(0, fareNum - companyFee);

        // Now update the ride status and computed amounts
        await rideModel.findOneAndUpdate({
            _id: rideId
        }, {
            status: 'completed',
            companyFee,
            captainEarnings
        });
        // Mutate local object so sockets/response include the new fields
        ride.status = 'completed';
        ride.companyFee = companyFee;
        ride.captainEarnings = captainEarnings;
        // Credit captain earnings for COD directly upon ride completion (avoid double-counting for online payments)
        try {
            const isPaidOnlineLocal = Boolean(ride.paymentId || ride.orderId || ride.signature || (ride.paymentMethod && ride.paymentMethod !== 'cod'));
            if (!isPaidOnlineLocal) {
                const captainUserDoc = await userModel.findById(ride.captain?._id || req.user._id);
                if (captainUserDoc?.captain) {
                    const now = new Date();
                    const last = captainUserDoc.captain.earningsLastReset || new Date(0);
                    const isSameDay = last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth() && last.getDate() === now.getDate();
                    if (!isSameDay) {
                        captainUserDoc.captain.earningsToday = 0;
                        captainUserDoc.captain.earningsLastReset = now;
                        console.log('[endRide] Reset earningsToday due to new day', { captainId: captainUserDoc._id.toString(), lastReset: last, now });
                    }
                    // Match completePayment behavior: credit full fare
                    const fareToAddLocal = Number(ride.fare || 0);
                    const before = Number(captainUserDoc.captain.earningsToday || 0);
                    captainUserDoc.captain.earningsToday = before + fareToAddLocal;
                    await captainUserDoc.save();
                    console.log('[endRide] Credited COD earnings', { rideId: ride._id.toString(), fareToAddLocal, before, after: captainUserDoc.captain.earningsToday });

                    // Rewards accrual for COD as well (so users benefit immediately)
                    try {
                        const isEcoLocal = Boolean(captainUserDoc.captain?.vehicle?.ecoFriendly);
                        const userDoc = await userModel.findById(ride.user?._id);
                        const userTierMult = getTierMultiplier(userDoc?.rewardsTier);
                        const userEarnRate = isEcoLocal ? 0.10 : 0.03;
                        const captainEarnRate = isEcoLocal ? 0.05 : 0.02;
                        const userPointsToAdd = Math.max(0, Math.floor(fareToAddLocal * userEarnRate * userTierMult));
                        const captainPointsToAdd = Math.max(0, Math.floor(fareToAddLocal * captainEarnRate));
                        if (userPointsToAdd > 0 && userDoc?._id) {
                            await userModel.updateOne({ _id: userDoc._id }, { $inc: { rewardsPoints: userPointsToAdd } });
                        }
                        if (captainPointsToAdd > 0) {
                            await userModel.updateOne({ _id: captainUserDoc._id }, { $inc: { 'captain.rewardsPoints': captainPointsToAdd } });
                        }
                    } catch (rewErr) {
                        console.warn('[endRide] COD rewards accrual failed:', rewErr?.message);
                    }

                    // Notify captain client and fallback to room
                    if (ride.captain?.socketId) {
                        sendMsgToSocketId(ride.captain.socketId, {
                            event: 'earnings-updated',
                            data: {
                                earningsToday: captainUserDoc.captain.earningsToday,
                                earningsLastReset: captainUserDoc.captain.earningsLastReset
                            }
                        });
                    }
                    const capRoomId = (ride.captain?._id || req.user._id)?.toString?.();
                    if (capRoomId) {
                        sendMsgToCaptainRoom(capRoomId, {
                            event: 'earnings-updated',
                            data: {
                                earningsToday: captainUserDoc.captain.earningsToday,
                                earningsLastReset: captainUserDoc.captain.earningsLastReset
                            }
                        });
                    }
                }
            }
        } catch (e) {
            console.warn('[endRide] COD earnings credit/emit failed:', e?.message);
        }

        const userId = ride?.user?._id?.toString?.() || ride?.user?.toString?.();
        const captainId = ride?.captain?._id?.toString?.() || ride?.captain?.toString?.();
        const userSocketId = ride?.user?.socketId;
        const captainSocketId = ride?.captain?.socketId;
        console.log('[endRide] Emitting ride-ended', { userSocketId, captainSocketId, userId, captainId });

        // Notify user (prefer direct socket, fallback to room)
        if (userSocketId) {
            sendMsgToSocketId(userSocketId, { event: 'ride-ended', data: ride });
        } else if (userId) {
            sendMsgToUserRoom(userId, { event: 'ride-ended', data: ride });
        }

        // Notify captain (prefer direct socket, fallback to captain room)
        if (captainSocketId) {
            sendMsgToSocketId(captainSocketId, { event: 'ride-ended', data: ride });
        }
        if (captainId) {
            // captain rooms are namespaced in socket.js; helper takes captain userId
            sendMsgToCaptainRoom(captainId, { event: 'ride-ended', data: ride });
        }

        // Emit updated aggregate stats so captain dashboard refreshes in real-time
        try {
            const stats = await computeCaptainStats(ride.captain?._id || req.user._id);
            sendMsgToCaptainRoom((ride.captain?._id || req.user._id).toString(), {
                event: 'captain-stats-updated',
                data: stats
            });
        } catch (e) {
            console.warn('Failed to emit captain-stats-updated after endRide:', e?.message);
        }

        // Eco gamification updates for the user (if captain's vehicle is eco-friendly)
        try {
            const isEcoRide = Boolean(ride?.captain?.captain?.vehicle?.ecoFriendly);
            if (isEcoRide && userId) {
                const userDoc = await userModel.findById(userId);
                if (userDoc) {
                    const now = new Date();
                    const last = userDoc.lastEcoRideAt ? new Date(userDoc.lastEcoRideAt) : null;
                    let newStreak = Number(userDoc.ecoStreak || 0);
                    if (!last) {
                        newStreak = 1;
                    } else {
                        const d0 = new Date(last.getFullYear(), last.getMonth(), last.getDate());
                        const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        const diffDays = Math.round((d1 - d0) / (1000 * 60 * 60 * 24));
                        if (diffDays === 0) {
                            // same day eco ride; keep current streak
                            newStreak = Math.max(1, newStreak);
                        } else if (diffDays === 1) {
                            newStreak = newStreak + 1;
                        } else {
                            newStreak = 1;
                        }
                    }

                    // Estimate CO2 saved: 0.12 kg per km (simple heuristic)
                    const km = Math.max(0, Number(ride?.distance || 0) / 1000);
                    const co2Delta = Math.max(0, Math.round(km * 0.12 * 100) / 100); // keep 2 decimals

                    // Update totals
                    userDoc.ecoStreak = newStreak;
                    userDoc.lastEcoRideAt = now;
                    userDoc.totalEcoRides = Number(userDoc.totalEcoRides || 0) + 1;
                    userDoc.co2SavedKg = Number(userDoc.co2SavedKg || 0) + co2Delta;

                    // Badges
                    const badges = new Set(userDoc.badges || []);
                    const ter = userDoc.totalEcoRides;
                    if (ter >= 5) badges.add('Leaf-1');
                    if (ter >= 20) badges.add('Leaf-2');
                    if (ter >= 50) badges.add('Leaf-3');
                    if (newStreak >= 7) badges.add('Streak-7');
                    if (newStreak >= 30) badges.add('Streak-30');
                    userDoc.badges = Array.from(badges);

                    await userDoc.save();

                    // Notify user client to refresh eco stats
                    sendMsgToUserRoom(userId, {
                        event: 'eco-stats-updated',
                        data: {
                            ecoStreak: userDoc.ecoStreak,
                            lastEcoRideAt: userDoc.lastEcoRideAt,
                            totalEcoRides: userDoc.totalEcoRides,
                            co2SavedKg: userDoc.co2SavedKg,
                            badges: userDoc.badges
                        }
                    });
                }
            }
        } catch (e) {
            console.warn('Eco gamification update failed:', e?.message);
        }
        return res.status(200).json({
            message: 'Ride ended successfully',
            ride: ride
        });
    }catch(error){
        return res.status(500).json({error:error.message})
    }
}
