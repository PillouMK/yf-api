const express = require('express');
const router = express.Router();
const { postWeeklytt, patchWeeklytt } = require('../controller/weeklyttController');


// GET /:idMap/
router.get('/:idMap', (req, res) => {
    // getWeeklyttByMap(req, res);
});

// PATCH /weekly/:idMap/:idPlayer/:isShroomless
router.patch('/:idMap/:idPlayer/:isShroomless', (req, res) => {
    patchWeeklytt(req, res);
});

// POST /weekly
router.post('/', (req, res) => {
    postWeeklytt(req, res);
});



module.exports = router;