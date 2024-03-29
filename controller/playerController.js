const config = require('../databaseConfig.js');
const {
    STATUS_CODE_OK, 
    STATUS_CODE_CREATED, 
    STATUS_CODE_BAD_REQUEST, 
    STATUS_CODE_NOT_FOUND
} = require('./variable');
const {
    msToTime
} = require('./functions.js')
// Connexion à la database
const db = config.connection;


function getAllPlayers(req, res) {
    const SQL_REQUEST = "SELECT *, r.rosterName FROM player p join roster r on p.idRoster = r.idRoster";

    db.query(SQL_REQUEST, (err, result) => {
        if(err) {
            res.status(STATUS_CODE_BAD_REQUEST).send(err);
            return;
        } 
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
            res.status(STATUS_CODE_OK).send(result);
        } else {
            // send the response
            res.status(STATUS_CODE_NOT_FOUND).send({
                    error : "There is no players"
                });
        }
    });
}


function getPlayer(req, res) {
    const SQL_REQUEST = "SELECT p.*, r.rosterName FROM player p join roster r on p.idRoster = r.idRoster WHERE p.idPlayer = "+req.params.idPlayer;
    db.query(SQL_REQUEST, (err, result) => {
        if(err) {
            res.status(STATUS_CODE_BAD_REQUEST).send(err);
            return;
        }
        // check if player exist
        if(Array.isArray(result) && result.length) {
                // send the response
                res.status(STATUS_CODE_OK).send({   
                        player : result[0]     
                });
        } else {
            // if no data player
            res.status(STATUS_CODE_NOT_FOUND).send({     
                    error : `${req.params.idPlayer} n'existe pas`       
            });
        }
     });
}

function getTimetrialFromPlayer(req, res) {
    const SQL_REQUEST_PLAYER = `SELECT * FROM player where player.idPlayer = ${req.params.idPlayer};`;
    const SQL_REQUEST_TIMETRIALS = `SELECT tm.idMap, m.nameMap, tm.time, tm.date 
                                    FROM timetrial as tm 
                                    JOIN map as m on m.idMap=tm.idMap 
                                    WHERE tm.idPlayer = ${req.params.idPlayer};`;
    db.query(SQL_REQUEST_PLAYER + SQL_REQUEST_TIMETRIALS, (err, result) => {
        if(err) {
            res.status(STATUS_CODE_BAD_REQUEST).send(err);
            return;
        }
        // player exist
        if(!Array.isArray(result[0]) || !result[0].length) {
            res.status(STATUS_CODE_NOT_FOUND).send({     
                    error : `${req.params.idPlayer} n'existe pas`              
            });
            return;
        }
        // player have timetrials
        if(!Array.isArray(result[1]) || !result[1].length) {
            res.status(STATUS_CODE_NOT_FOUND).send({        
                    error : `${req.params.idPlayer} ne possède aucun temps`             
            });
            return;
        }
        // player variable  
        const player = result[0][0];
        const arrayTimetrial = {};
        const arrayShroom = [];
        const arrayNoShroom = [];
        result[1].forEach(element => {
            let timetrial = element;
            element.time = msToTime(element.time);

            // Sort timetrials by isShroomless
            if(!timetrial.isShroomless) {
                arrayShroom.push(timetrial)
            } else {
                arrayNoShroom.push(timetrial);
            }
            delete timetrial.isShroomless
        });
        arrayTimetrial.arrayShroom = arrayShroom.length ? arrayShroom : null;
        arrayTimetrial.arrayShroomless = arrayNoShroom.length ? arrayNoShroom : null;
        res.status(STATUS_CODE_OK).send({
                playerInfos : player,
                timetrials : arrayTimetrial
            }
        );                  
    }); 

}

function postPlayer(req, res) {
    const SQL_REQUEST = "INSERT INTO player (`idPlayer`, `idRoster`, `name`, `tt_points`, `tt_top1`, `tt_top3`)"
                           + `VALUES ('${req.body.idPlayer}','${req.body.idRoster}','${req.body.name}',0,0,0);`;
    db.query(SQL_REQUEST, (err, result) => {
        if(err) {
            res.status(STATUS_CODE_BAD_REQUEST).send(err);
        } else {
            res.status(STATUS_CODE_CREATED).send({
                player: {
                    idPlayer: req.body.idPlayer,
                    playerName: req.body.name,
                    idRoster: req.body.idRoster,
                  }
            });
        }
    })
}

function patchPlayer(req, res) {
    let name = req.body.hasOwnProperty("name") ? `\`name\`='${req.body.name}',` : "";
    let idRoster = req.body.hasOwnProperty("idRoster") ? `\`idRoster\`='${req.body.idRoster}',` : "";
    let tt_points = "\`tt_points\`= tt_points +";
    let tt_top1 = "\`tt_top1\`= tt_top1 +";
    let tt_top3 = "\`tt_top3\`= tt_top3 +";
    
    tt_points = setUpdateParam(req, "tt_points", tt_points);
    tt_top1 = setUpdateParam(req, "tt_top1", tt_top1);
    tt_top3 = setUpdateParam(req, "tt_top3", tt_top3);
    
    // set the , for SQL request
    tt_points += ",";
    tt_top1 += ","; 
    
    const SQL_REQUEST = `UPDATE player SET ${name} ${idRoster} ${tt_points} ${tt_top1} ${tt_top3} WHERE player.idPlayer = ${req.params.idPlayer};`
    
    db.query(SQL_REQUEST, (err, result) => {
        if(err) {
            res.status(STATUS_CODE_BAD_REQUEST).send(err);
            return;
        }
        res.status(STATUS_CODE_OK).send(result);
    })
}

// set param for update SQL request
const setUpdateParam = (req, nameParam, param) => {
    if(req.body.hasOwnProperty(nameParam)) {
        param += req.body[nameParam];
    } else {
        param += "0";
    }
    return param;
}


module.exports = {getAllPlayers, getPlayer, getTimetrialFromPlayer, postPlayer, patchPlayer}