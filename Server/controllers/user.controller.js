const userModel = require("../models/user");
const {validationResult} = require("express-validator");
const BlacklistToken = require("../models/blacklistToken.models");
const updateCaptainLocationByAddress = require("../services/user.service");




const registerUser = async (req,res,next)=>{
    const {
        name,
        username,
        password,
        phone,
        role,
        captain
    } = req.body;
    
    const userData = {
        name,
        username,
        password,
        phone,
        role 
    };
    
    
    if (role === 'captain' && captain && captain.vehicle) {
        
        userData.captain = {
            status: captain.status || 'inactive',
            experienceYears: captain.experienceYears,
            location: captain.location,
            vehicle: {
                vehicleType: captain.vehicle.vehicleType,
                plateNumber: captain.vehicle.plateNumber,
                color: captain.vehicle.color,
                ecoFriendly: captain.vehicle.ecoFriendly,
                capacity: captain.vehicle.capacity,
                model: captain.vehicle.model
            }
        };
    } else if (role === 'captain') {
        
        return res.status(400).json({ error: "Vehicle details are required for captains." });
    }
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    const hashedPassword = await userModel.hashPassword(password);
    userData.password = hashedPassword;

    const newUser = new userModel(userData);
    await newUser.save();
    const token = newUser.generateAuthToken();
    res.status(201).json({message:"User registered successfully",token,user:newUser});
}

const loginUser = async (req,res,next)=>{
    const {username,password} = req.body;
    const user = await userModel.findOne({username}).select('+password');
    if(!user){
        return res.status(401).json({message:"Invalid Email or Password"});
    }
    const isMatch = await user.comparePassword(password);
    if(!isMatch){
        return res.status(401).json({message:"Invalid Email or Password"});
    }
    const token = user.generateAuthToken();
    res.cookie("token",token);
    res.status(200).json({message:"Login Successfully",token,user});
}

const getProfile = async (req,res,next)=>{
    res.status(200).json({user:req.user});
}

const logoutUser = async (req,res)=>{
    // Clear auth cookie for browser clients
    res.clearCookie("token");
    // Prefer token verified by middleware; fallback to cookie/header
    const token = req.token || req.cookies.token || req.headers.authorization?.split(" ")[1];
    if(!token){
        return res.status(400).json({message:"No token provided to logout"});
    }
    try{
        // Upsert so repeated logouts with same token don't throw duplicate key errors
        await BlacklistToken.updateOne(
            { token },
            { $setOnInsert: { token } },
            { upsert: true }
        );
        return res.status(200).json({message:"Logout Successfully"});
    }catch(err){
        console.error('[logout] Failed to blacklist token', err);
        return res.status(500).json({message:"Failed to logout"});
    }
}

module.exports = {
    registerUser,loginUser,getProfile,logoutUser
}