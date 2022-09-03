const express = require('express');
const { getAllPlayers, getPlayer, getTimetrialFromPlayer } = require('../controller/playerController');
const router = express.Router();
const config = require('../databaseConfig.js');
const Player = require('../models/playerModel');
require('../controller/playerController');
// Connexion à la database
const db = config.connection;

// GET /player
router.get('/', function(req, res) {
    getAllPlayers(res);
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
    res.send("PUT player here")
})

// POST /player/
router.put('/', (req, res) => {
    res.send("POST player here")
})

module.exports = router;