const express = require('express');
const router = express.Router();


// GET /timetrial/:idMap
router.get('/', (req, res) => {
    res.send("GET /maps");
});

module.exports = router;