const express = require('express');
const router = express.Router();
const {body} = require('express-validator');
// const User = require('../models/user');
const userController = require('../controllers/user.controller');
const {isAuthenticated} = require('../middlewares/auth.middleware');


router.post('/register',
[
  body('name').notEmpty().withMessage('Name is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('role').notEmpty().withMessage('Role is required'),
  // Only validate captain fields if role is captain
  body('captain.experienceYears').if(body('role').equals('captain')).notEmpty().withMessage('Experience Years is required'),
  body('captain.vehicle.vehicleType').if(body('role').equals('captain')).notEmpty().withMessage('Vehicle Type is required'),
  body('captain.vehicle.plateNumber').if(body('role').equals('captain')).notEmpty().withMessage('Vehicle Number is required'),
  body('captain.vehicle.ecoFriendly').if(body('role').equals('captain')).notEmpty().withMessage('Eco Friendly is required'),
  body('captain.vehicle.color').if(body('role').equals('captain')).notEmpty().withMessage('Color is required'),
  body('captain.vehicle.capacity').if(body('role').equals('captain')).notEmpty().withMessage('Capacity is required'),
  body('captain.vehicle.model').if(body('role').equals('captain')).notEmpty().withMessage('Model is required')
],
    userController.registerUser
);

  

router.post('/login',[
  body('username').notEmpty().withMessage('Email is required'),
  body('password').notEmpty().withMessage('Password is required'),
],userController.loginUser);


router.get('/profile',isAuthenticated,userController.getProfile);

router.get('/logout',isAuthenticated,userController.logoutUser);

module.exports = {router,isAuthenticated};