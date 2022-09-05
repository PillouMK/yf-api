const express = require('express');
const router = express.Router();
const config = require('../databaseConfig.js');

// Connexion à la database
const db = config.connection;


function getAllPlayers(res) {
    db.query("SELECT *, r.rosterName FROM player p join roster r on p.idRoster = r.idRoster", function(err, result) {
        
        if(Array.isArray(result) && result.length) {
            // sort array (usefull for timetrial ranking, no impact for the rest)
            result.sort((a, b) => {
                if(b.tt_points > a.tt_points) {
                    return 1;
                }
                if(b.tt_points < a.tt_points) {
                    return -1
                }
                if(b.tt_top1 > a.tt_top1) {
                    return 1;
                }
                if(b.tt_top1 < a.tt_top1) {
                    return -1
                }
                if(b.tt_top3 > a.tt_top3) {
                    return 1;
                }
                else {
                    return -1
                }

            });

            // send the response
            res.send({
                responseCode : 1,
                response : result
            });
        } else {
            // send the response
            res.send({
                responseCode : 0,
                response : "There is no players"
            });
        }
    });
}


function getPlayer(req, res) {
    db.query("SELECT p.*, r.rosterName FROM player p join roster r on p.idRoster = r.idRoster WHERE p.idPlayer = "+req.params.idPlayer, function(err, result) {
        // check if player exist
        if(Array.isArray(result) && result.length) {
                // send the response
                res.send({
                    responseCode : 1,
                    response : {
                        player : result[0]
                    }
                });
        } else {
            // if no data player don't exist
            res.send({
                responseCode : 0,
                response : `${req.params.idPlayer} n'existe pas`
            });
        }
        
        
     });
}

function getTimetrialFromPlayer(req, res) {
    const arrayTimetrial = [];
    const arrayShroom = [];
    const arrayNoShroom = [];
    db.query(`SELECT * FROM player where player.idPlayer = ${req.params.idPlayer};SELECT tm.idMap, m.nameMap, tm.time, tm.date FROM timetrial as tm JOIN map as m on m.id=tm.idMap WHERE tm.idPlayer = ${req.params.idPlayer};`, (err, result) => {

        // player exist
        if(Array.isArray(result[0]) && result[0].length) {

            // player variable  
            const player = result[0][0];
           

            // player have timetrials
            if(Array.isArray(result[1]) && result[1].length) {
                result[1].forEach(element => {
                    let timetrial = element;
                    

                    // Sort timetrials by isShroomless
                    if(!timetrial.isShroomless) {
                        arrayShroom.push(timetrial)
                    } else {
                        arrayNoShroom.push(timetrial);
                    }
                    delete timetrial.isShroomless
                });
                arrayTimetrial.push({"arrayShroom" : arrayShroom.length ? arrayShroom : null});
                arrayTimetrial.push({"arrayShroomless" : arrayNoShroom.length ? arrayNoShroom : null});
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