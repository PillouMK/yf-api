const express = require('express');
const router = express.Router();
const {getAllprojectMap, postProjectMap} = require('../controller/projectMapController');

// GET /projectmap/
router.get('/:idRoster', (req, res) => {
    getAllprojectMap(req, res);
});


// POST /projectmap
router.post('/', (req, res) => {
    postProjectMap(req, res);
});

module.exports = router;