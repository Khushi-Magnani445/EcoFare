const jwt = require("jsonwebtoken");
const userModel = require("../models/user");
const BlacklistToken = require("../models/blacklistToken.models");
const bcrypt = require("bcrypt");

module.exports.isAuthenticated = async (req,res,next)=>{
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if(!token){
        console.warn('[auth] No token provided');
        return res.status(401).json({message:"Unauthorized"});
    }
    try {
        const blacklisted = await BlacklistToken.findOne({ token });
        if (blacklisted) {
            console.warn('[auth] Token is blacklisted');
            return res.status(401).json({message:"Unauthorized"});
        }
    } catch (e) {
        console.error('[auth] Blacklist check failed', e);
        // Do not block on blacklist check failure, continue to verify token
    }

    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        const user = await userModel.findById(decoded._id);
        if(!user){
            console.warn('[auth] Token decoded but user not found');
            return res.status(401).json({message:"Unauthorized"});
        }
        req.user = user;
        // persist the verified token for downstream handlers (e.g., logout)
        req.token = token;
        return next();
    }catch(err){
        console.warn('[auth] JWT verify failed');
        return res.status(401).json({message:"Unauthorized"});
    }
}

module.exports.isCaptain = (req, res, next) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        if (req.user.role !== 'captain') return res.status(403).json({ message: 'Forbidden: captain only' });
        return next();
    } catch (e) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}