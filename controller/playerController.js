const express = require('express');
const router = express.Router();
const config = require('../databaseConfig.js');
const Player = require('../models/playerModel');

// Connexion à la database
const db = config.connection;


function getAllPlayers(res) {
    const arrayPlayer = [];
    db.query("SELECT * FROM player", function(err, result) {
        
        result.forEach(element => {
            let player = new Player();
            player = player.fromJSON(element);
            arrayPlayer.push(player);
        });

        // tri du tableau
        // arrayPlayer.sort((a, b) => b.tt_points - a.tt_points);
        res.send(arrayPlayer)  
    });
}


function getPlayer(req, res) {
    db.query("SELECT * FROM player WHERE player.idPlayer = "+req.params.idPlayer, function(err, result) {
        let player = new Player();
        player = player.fromJSON(result[0]);
        res.send(player);
     });
}

function getTimetrialFromPlayer(req, res) {
    db.query("SELECT * FROM timetrial WHERE timetrial.idPlayer = "+req.params.idPlayer, function(err, result) {
        res.send(result);
    });
}

module.exports = {getAllPlayers, getPlayer, getTimetrialFromPlayer}