const express = require('express')
const router = express.Router();


// GET /player
router.get('/', (req, res) => {
    getAllPlayers(req, res);
})

// GET /player/:idPlayer
router.get('/:idPlayer', (req, res) => {
    getPlayer(req, res);
})

// GET /player/:idPlayer/timetrial
router.get('/:idPlayer/timetrial', (req, res) => {
    getTimetrialFromPlayer(req, res);
})


// PATCH /player/:idPlayer
router.patch('/:idPlayer', (req, res) => {
    patchPlayer(req, res);
})

// POST /player/
router.post('/', (req, res) => {
    postPlayer(req, res);
})



module.exports = router;