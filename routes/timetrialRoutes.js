const express = require('express');
const router = express.Router();
const { getTimetrialsByMap, postTimetrial, patchTimetrial} = require('../controller/timetrialController');

// GET /timetrial/:idMap
router.get('/:idMap', (req, res) => {
    getTimetrialsByMap(req, res);
});

// PUT /timetrial/:idTimetrial
router.patch('/:idMap/:idPlayer/:isShroomless', (req, res) => {
    patchTimetrial(req, res);
});

// POST /timetrial
router.post('/', (req, res) => {
    postTimetrial(req, res);
});

module.exports = router;