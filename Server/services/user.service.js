const userModel = require('../models/user');
const mapsService = require('./maps.service');

const updateCaptainLocationByAddress = async (userId,address)=>{
    const coordinates = await mapsService.getAddressCoordinate(address);
    await userModel.findByIdAndUpdate(userId,{"captain.location":{ltd:coordinates.ltd,lng:coordinates.lng}});
    return coordinates;
}

module.exports = {
    updateCaptainLocationByAddress
}