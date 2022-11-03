const config = require('../databaseConfig.js');
const {
    STATUS_CODE_OK, 
    STATUS_CODE_CREATED, 
    STATUS_CODE_BAD_REQUEST, 
    STATUS_CODE_NOT_FOUND
} = require('./variable');

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
            res.status(STATUS_CODE_CREATED).send(result);
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
    let SQL_REQUEST_RESET = "";
    if(idRoster != "") {
        SQL_REQUEST_RESET = "UPDATE `player` SET `tt_points`=0,`tt_top1`=0,`tt_top3`=0;SELECT idMap from map"
    }
    
    const SQL_REQUEST = `UPDATE player SET ${name} ${idRoster} ${tt_points} ${tt_top1} ${tt_top3} WHERE player.idPlayer = ${req.params.idPlayer};`
    
    db.query(SQL_REQUEST + SQL_REQUEST_RESET, (err, result) => {
        if(err) {
            res.status(STATUS_CODE_BAD_REQUEST).send(err);
            return;
        } 
        if(idRoster == "") {
            res.status(STATUS_CODE_OK).send(result);
        } else {
            
            console.log(result[2]);
            let arrayMap = result[2];
            let SQL_TOP_BY_MAP = "";
            arrayMap.forEach(element => {
                SQL_TOP_BY_MAP += getAllTopByMap(element.idMap);
            })
            db.query(SQL_TOP_BY_MAP, (_err, _result) => {
                if(_err) {
                    res.status(STATUS_CODE_BAD_REQUEST).send(_err);
                    return;
                } 
                let SQL_UPDATE_POINT_REQUEST = "";
                console.log(_result);
                _result.forEach(map => {
                    map.forEach((player, index) => {
                        let point = convertPlaceToPoints(index);
                        let top1 = (index == 0) ? 1 : 0;
                        let top3 = (index == 1 || index == 2) ? 1 : 0;
                        SQL_UPDATE_POINT_REQUEST += makeUpdateRequest(player.idPlayer, point, top1, top3);
                    });
                });
                db.query(SQL_UPDATE_POINT_REQUEST, (_newErr, _newResult) => {
                    if(_newErr) {
                        res.status(STATUS_CODE_BAD_REQUEST).send(_newErr);
                        return;
                    } else {
                        res.status(STATUS_CODE_OK).send(result);
                        return;
                    }
                })
            })
        }
    })
}

const convertPlaceToPoints = (index) => {
    let place = parseInt(index);
    return (10 - place)
}

const makeUpdateRequest = (idPlayer, points, top1, top3) => {
    return `UPDATE \`player\` SET \`tt_points\`=tt_points + ${points},\`tt_top1\`= tt_top1 + ${top1},\`tt_top3\`= tt_top3 + ${top3} WHERE idPlayer = '${idPlayer}';`;
}

const getAllTopByMap = (idMap) => {
    return `SELECT player.idPlayer FROM timetrial 
    JOIN player ON player.idPlayer = timetrial.idPlayer 
    WHERE player.idRoster = 'YFG' AND timetrial.idMap = '${idMap}' OR player.idRoster = 'YFO' AND timetrial.idMap = '${idMap}'
    ORDER BY timetrial.time
    LImit 10;`
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

function msToTime(s, isDiff = false) {

    // Pad to 2 or 3 digits, default is 2
    function pad(n, z) {
      z = z || 2;
      return ('00' + n).slice(-z);
    }
  
    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
  
    return !isDiff ? pad(mins) + ':' + pad(secs) + '.' + pad(ms, 3) : secs + '.' + pad(ms, 3);
}
  

module.exports = {getAllPlayers, getPlayer, getTimetrialFromPlayer, postPlayer, patchPlayer}