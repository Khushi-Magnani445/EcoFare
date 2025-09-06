const express = require('express');
const router = express.Router();
const {body, query} = require('express-validator')
const rideController = require('../controllers/ride.controller');
const passport = require('passport');
const {isAuthenticated, isCaptain} = require('../middlewares/auth.middleware');

router.post('/create',
    isAuthenticated,
    body('pickup').notEmpty().withMessage('Pickup is required'),
    body('destination').notEmpty().withMessage('Destination is required'),
    body('vehicleType').notEmpty().isString().isIn(['ev_bike','ev_car','bike','car','auto']).withMessage('Invalid vehicle type')
    ,rideController.createRide
)

// Shared ride create (additive, does not affect solo rides)
router.post('/shared/create',
    isAuthenticated,
    body('pickup').notEmpty().withMessage('Pickup is required'),
    body('destination').notEmpty().withMessage('Destination is required'),
    body('vehicleType').notEmpty().isString().isIn(['ev_bike','ev_car','bike','car','auto']).withMessage('Invalid vehicle type'),
    body('maxSeats').optional().isInt({ min: 1, max: 4 }).withMessage('maxSeats must be 1-4'),
    body('discountFactor').optional().isFloat({ gt: 0, lt: 1 }).withMessage('discountFactor must be between 0 and 1'),
    rideController.createSharedRide
)

// Shared ride join
router.post('/shared/join',
    isAuthenticated,
    body('rideId').isMongoId().withMessage('Invalid Ride Id'),
    rideController.joinSharedRide
)

// Shared ride leave
router.post('/shared/leave',
    isAuthenticated,
    body('rideId').isMongoId().withMessage('Invalid Ride Id'),
    rideController.leaveSharedRide
)

// Shared ride confirm (captain)
router.post('/shared/confirm',
    isAuthenticated,
    isCaptain,
    body('rideId').isMongoId().withMessage('Invalid Ride Id'),
    rideController.confirmSharedRide
)

// Shared ride start (captain, OTP)
router.get('/shared/start',
    isAuthenticated,
    isCaptain,
    query('rideId').isMongoId().withMessage('Invalid Ride Id'),
    query('otp').isString().isLength({ min: 4, max: 6 }).withMessage('Invalid OTP'),
    rideController.startSharedRide
)

// Shared ride end (captain)
router.post('/shared/end',
    isAuthenticated,
    isCaptain,
    body('rideId').isMongoId().withMessage('Invalid Ride Id'),
    rideController.endSharedRide
)

router.get('/get-fare',isAuthenticated,
    query('pickup').notEmpty().withMessage('Pickup is required'),
    query('destination').notEmpty().withMessage('Destination is required'),
    rideController.getFare);

router.post('/confirm',isAuthenticated,
    body('rideId').isMongoId().withMessage('Invalid Ride Id'),
    //body('otp').isString().isLength({min:4,max:4}).withMessage('Invalid OTP'),
    rideController.confirmRide
);

// Captain cancels an accepted ride -> re-queue
router.post('/captain/cancel',
    isAuthenticated,
    isCaptain,
    body('rideId').isMongoId().withMessage('Invalid Ride Id'),
    rideController.cancelRideByCaptain
)


router.get('/start-ride',isAuthenticated,
    query('rideId').isMongoId().withMessage("Invalid Ride Id"),
    query('otp').isString().isLength({min:4,max:4}).withMessage('Invalid OTP'),
    rideController.startRide
)

router.post('/end-ride',isAuthenticated,
    body('rideId').isMongoId().withMessage("Invalid Ride Id"),
    rideController.endRide
)

// User sets payment method before paying/finishing
router.post('/update-payment-method', isAuthenticated,
    body('rideId').isMongoId().withMessage('Invalid Ride Id'),
    body('paymentMethod').isString().isIn(['cod', 'online', 'wallet']).withMessage('Invalid payment method'),
    rideController.updatePaymentMethod
)

// Captain stats endpoint
router.get('/captain/stats', isAuthenticated, rideController.captainStats)

// Complete payment: credits captain earnings and user rewards
router.post('/complete-payment', isAuthenticated,
    body('rideId').isMongoId().withMessage('Invalid Ride Id'),
    rideController.completePayment
)

// Rewards endpoints
router.post('/rewards/quote', isAuthenticated,
    body('rideId').isMongoId().withMessage('Invalid Ride Id'),
    rideController.rewardsQuote
)

router.post('/rewards/redeem', isAuthenticated,
    body('rideId').isMongoId().withMessage('Invalid Ride Id'),
    body('points').isInt({ min: 1 }).withMessage('Points must be a positive integer'),
    rideController.rewardsRedeem
)

// Rating endpoint
router.post('/rate', isAuthenticated,
    body('rideId').isMongoId().withMessage('Invalid Ride Id'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('comment').optional().isString().isLength({ max: 500 }),
    rideController.rateRide
)


module.exports = router;