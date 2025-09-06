
const axios = require('axios')
const captainModel = require('../models/user');
module.exports.getAddressCoordinate = async (address) => {
    
    try {
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API}`
        );
        const data = response.data;
        if (data.results.length > 0) {
            const location = data.results[0].geometry.location;
            return {
                ltd: location.lat,
                lng: location.lng
            };
        } else {
            throw new Error('Unable to fetch coordinates');
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }
    try {
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${process.env.GOOGLE_MAPS_API}`
        );
        if(response.data.status === 'OK'){
            if(response.data.rows[0].elements[0].status === 'ZERO_RESULTS'){
                throw new Error('No route found');
            }
            return response.data.rows[0].elements[0];
        }
        else{
            throw new Error('Failed to fetch distance and time');
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}


module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new Error('Input is required');
    }
    try {
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${process.env.GOOGLE_MAPS_API}`
        );
        return response.data.predictions;
    } catch (error) {
        console.error(error);
        throw error;
    }
}


module.exports.getCaptainsInTheRadius = async (ltd, lng, radius, vehicleType = null) => {
    // radius in km
    // Use GeoJSON [lng, lat] order
    const query = {
        role: 'captain',
        'captain.location': {
            $geoWithin: {
                $centerSphere: [ [ lng, ltd ], radius / 6371 ]
            }
        }
    };
    if (vehicleType) {
        query['captain.vehicle.vehicleType'] = vehicleType;
    }
    const captains = await captainModel.find(query);
    // Add dummy captains for testing
    // const dummyCaptains = [
    //     {
    //         _id: 'dummy1',
    //         name: 'Captain Alpha',
    //         username: 'alpha@example.com',
    //         phone: '1234567890',
    //         role: 'captain',
    //         captain: {
    //             status: 'active',
    //             experienceYears: 5,
    //             vehicle: {
    //                 vehicleType: 'ev_bike',
    //                 plateNumber: 'EV1234',
    //                 color: 'Green',
    //                 ecoFriendly: true,
    //                 capacity: 2,
    //                 model: 'EcoBike 2022'
    //             },
    //             location: { ltd: ltd, lng: lng },
    //             socketId: 'dummySocket1'
    //         }
    //     },
    //     {
    //         _id: 'dummy2',
    //         name: 'Captain Beta',
    //         username: 'beta@example.com',
    //         phone: '9876543210',
    //         role: 'captain',
    //         captain: {
    //             status: 'active',
    //             experienceYears: 3,
    //             vehicle: {
    //                 vehicleType: 'car',
    //                 plateNumber: 'CAR5678',
    //                 color: 'Blue',
    //                 ecoFriendly: false,
    //                 capacity: 4,
    //                 model: 'Sedan X'
    //             },
    //             location: { ltd: ltd, lng: lng },
    //             socketId: 'dummySocket2'
    //         }
    //     }
    // ];
    return captains;
}