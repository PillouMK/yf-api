const express = require('express');
const router = express.Router();
const config = require('../databaseConfig.js');
const Player = require('../models/playerModel');
const Timetrial = require('../models/timetrialModel.js');

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
        if(Array.isArray(result) && result.length) {
            let player = new Player();
            player = player.fromJSON(result[0]);
            res.send(player);
        } else {
            res.send({
                response : "idPlayer n'existe pas"
            });
        }
        
        
     });
}

function getTimetrialFromPlayer(req, res) {
    const arrayTimetrial = [];
    const arrayShroom = [];
    const arrayNoShroom = [];
    db.query(`SELECT * FROM player where player.idPlayer = ${req.params.idPlayer};SELECT *, m.nameMap FROM timetrial as tm JOIN map as m on m.id=tm.idMap WHERE tm.idPlayer = ${req.params.idPlayer};`, (err, result) => {

        // player exist
        if(Array.isArray(result[0]) && result[0].length) {

            // create player variable
            let player = new Player();
            player = player.fromJSON(result[0][0]);
            console.log("player", player);
            
            // player have timetrials
            if(Array.isArray(result[1]) && result[1].length) {
                result[1].forEach(element => {
                    let timetrial = new Timetrial();
                    timetrial = timetrial.fromJSON(element);
                    delete timetrial.idPlayer;
                    timetrial.nameMap = element.nameMap;
                    if(element.isShroomless == "0") {
                        arrayShroom.push(timetrial)
                    } else {
                        arrayNoShroom.push(timetrial);
                    }
                });
                arrayTimetrial.push({"arrayShroom" : arrayShroom});
                arrayTimetrial.push({"arrayNoShroom" : arrayNoShroom});
                res.send({
                    responseCode : 1,
                    response : {
                        playerInfos : player,
                        timetrials : arrayTimetrial
                    }
                });
            } else {
                res.send({
                    responseCode : 0,
                    response : `${req.params.idPlayer} ne possède aucun temps`
                });
            }
        } else {
            res.send({
                responseCode : 0,
                response : `${req.params.idPlayer} n'existe pas`
            });
        }
    }); 
}

module.exports = {getAllPlayers, getPlayer, getTimetrialFromPlayer}