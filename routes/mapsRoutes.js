const express = require('express');
const router = express.Router();
const {getAllMaps} = require('../controller/mapController');

// GET /maps
router.get('/', (req, res) => {
    getAllMaps(req, res);
});

module.exports = router;