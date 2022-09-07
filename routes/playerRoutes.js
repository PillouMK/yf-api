const express = require('express');
const { getAllPlayers, getPlayer, getTimetrialFromPlayer, postPlayer, putPlayer } = require('../controller/playerController');
const router = express.Router();
const config = require('../databaseConfig.js');
require('../controller/playerController');
// Connexion à la database
const db = config.connection;

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

// PUT /player/:idPlayer
router.put('/:idPlayer', (req, res) => {
    putPlayer(req, res);
})

// POST /player/
router.post('/', (req, res) => {
    postPlayer(req, res);
})



module.exports = router;