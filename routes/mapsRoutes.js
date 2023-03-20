const express = require('express');
const router = express.Router();
const {getAllMaps, postMapsWeekly, patchMapWeekly} = require('../controller/mapController');

// GET /maps
router.get('/', (req, res) => {
    getAllMaps(req, res);
});

// POST /maps/weekly
router.post('/weekly', (req, res) => {
    postMapsWeekly(req, res);
});

// PATCH /maps/weekly/:idMap
router.patch('/weekly/:idMap', (req, res) => {
    patchMapWeekly(req, res);
});

module.exports = router;