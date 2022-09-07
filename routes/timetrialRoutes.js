const express = require('express');
const router = express.Router();
const { getTimetrialByMap } = require('../controller/timetrialController');

// GET /timetrial/:idMap
router.get('/:idMap', (req, res) => {
    getTimetrialByMap(req, res);
});

// PUT /timetrial/:idTimetrial
router.put('/:idMap/:idPlayer/:isShroomless', (req, res) => {
    res.send("PUT /timetrial/:idTimetrial");
});

// POST /timetrial
router.post('/', (req, res) => {
    res.send("POST /timetrial");
});

module.exports = router;