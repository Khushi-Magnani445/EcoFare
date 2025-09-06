const express = require('express');
const passport = require('passport');
const router = express.Router();
const mapController = require('../controllers/map.controller');

// Middleware to check if user is authenticated


router.get('/get-coordinates',mapController.getCoordinates);

router.get('/get-distance-time',mapController.getDistanceTime);

router.get('/get-suggestions',mapController.getAutoCompleteSuggestions);

module.exports = router;