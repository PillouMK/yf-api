const express = require('express');
const router = express.Router();


// GET /timetrial/:idMap
router.get('/:idMap', (req, res) => {
    res.send("GET /timetrial/:idMap");
});

// PUT /timetrial/:idTimetrial
router.put('/:idTimetrial', (req, res) => {
    res.send("PUT /timetrial/:idTimetrial");
});

// POST /timetrial
router.post('/', (req, res) => {
    res.send("POST /timetrial");
});

module.exports = router;