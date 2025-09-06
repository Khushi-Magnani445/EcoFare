const mapsService = require('../services/maps.service');
// const validationResult = require('express-validator')

module.exports.getCoordinates = async (req, res) => {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //     return res.status(400).json({ errors: errors.array() });
    // }
    console.log("getCoordinates");
    try {
        const { address } = req.query;
        console.log(address);
        const coordinates = await mapsService.getAddressCoordinate(address);
        console.log(coordinates);
        res.status(200).json(coordinates);
    } catch (error) {
        res.status(404).json({ error: 'Failed to fetch coordinates' });
    }
}


module.exports.getDistanceTime = async (req, res) => {
    try {
        const { origin, destination } = req.query;
        if (!origin || !destination) {
            return res.status(400).json({ error: 'Origin and destination are required' });
        }
        console.log(origin, destination);
        const distanceTime = await mapsService.getDistanceTime(origin, destination);
        res.status(200).json(distanceTime);
    } catch (error) {
        res.status(404).json({ error: 'Failed to fetch distance and time' });
    }
}

module.exports.getAutoCompleteSuggestions = async (req, res) => {
    try {
        const  input  = req.query.query;
        console.log(input);
        console.log(req.query);
        if(!input){
            return res.status(400).json({ error: 'Input is required' });
        }
        //const suggestions = await mapsService.getAutoCompleteSuggestions(input);
        const predictions = await mapsService.getAutoCompleteSuggestions(input);
        const suggestions = predictions.map(p => p.description);
        console.log(suggestions);
        res.status(200).json({suggestions});
    } catch (error) {
        res.status(404).json({ error: 'Failed to fetch auto complete suggestions' });
    }
}