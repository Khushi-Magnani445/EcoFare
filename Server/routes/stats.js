const express = require('express');
const router = express.Router();

router.get('/',(req,res)=>{
    res.json({
        co2Saved:100,
        ridesCompleted:1000,
        happyUsers:500
    })
})

module.exports = router;