const config = require('../databaseConfig.js');
const {STATUS_CODE_OK, STATUS_CODE_CREATED, STATUS_CODE_BAD_REQUEST, STATUS_CODE_NOT_FOUND} = require('./variable');
// Connexion à la database
const db = config.connection;

function getTimetrialsByMap(req, res) {
    // set roster filter, set one by default if don't exist
    const whereFilter = (req.query.idRoster != undefined) ? 
    `WHERE tm.idMap = '${req.params.idMap}' AND r.idRoster = '${req.query.idRoster}'` 
    : `WHERE tm.idMap = '${req.params.idMap}' AND r.idRoster = 'YFG' OR tm.idMap = '${req.params.idMap}' AND r.idRoster = 'YFO'`;

    const SQL_REQUEST_MAP = `SELECT idMap, nameMap, minia, initialGame, DLC, retro FROM map where map.idMap = '${req.params.idMap}';`; 
    const SQL_REQUEST_TIMETRIALS = `SELECT tm.idPlayer, p.name, tm.time, tm.isShroomless, tm.date, r.rosterName, r.idRoster
                                    FROM timetrial tm 
                                    JOIN player p ON tm.idPlayer = p.idPlayer 
                                    JOIN roster r on p.idRoster = r.idRoster 
                                    ${whereFilter}
                                    ORDER BY tm.time ASC, tm.date ASC`;
    db.query(SQL_REQUEST_MAP + SQL_REQUEST_TIMETRIALS, (err, result) => {
        if(err) {
            res.status(STATUS_CODE_BAD_REQUEST).send(err);
            return;
        }

        // Check if idMap is valid
        if(!Array.isArray(result[0]) || !result[0].length) {
            res.status(STATUS_CODE_NOT_FOUND).send({
                    error : `${req.params.idMap} n'est pas un idMap valide`                
            });
            return;
        }
        
        // check if data for idMap exists
        if(!Array.isArray(result[1]) && !result[1].length) {
            res.status(STATUS_CODE_NOT_FOUND).send({             
                    error : `${req.params.idMap} ne possède pas de temps enregistré pour ${filterRoster}`               
            });
            return;
        }
        const mapInfos = result[0][0];
        const arrayTimetrial = {};
        const arrayShroom = [];
        const arrayNoShroom = [];
        let firstNoShroom;
        let firstShroom;
        result[1].forEach(element => {
            let timetrial = element;
            let duration = msToTime(timetrial.time);
                // Sort timetrials by isShroomless
                if(!timetrial.isShroomless) {
                    firstShroom = arrayShroom.length ? firstShroom : timetrial.time;
                    let difference = arrayShroom.length ? msToTime(timetrial.time - firstShroom, true) : "0.000"
                    timetrial.difference = difference+"s";
                    timetrial.duration = duration;
                    arrayShroom.push(timetrial)
                } else {            
                    firstNoShroom = (arrayNoShroom.length) ? firstNoShroom : timetrial.time;
                    let difference = arrayNoShroom.length ? msToTime(timetrial.time - firstNoShroom, true) : "0.000"
                    timetrial.difference = difference+"s";
                    timetrial.duration = duration;
                    arrayNoShroom.push(timetrial);
                }
                // shroomless params is no longer needed
                delete timetrial.isShroomless
                delete timetrial.time
        });

        // add response, null if no data
        arrayTimetrial.arrayShroom = arrayShroom.length ? arrayShroom : null;
        arrayTimetrial.arrayShroomless = arrayNoShroom.length ? arrayNoShroom : null;
        res.status(STATUS_CODE_OK).send({
                infoMap : mapInfos,
                timetrials : arrayTimetrial        
        });
    });
}

function postTimetrial(req, res) {
    const params = req.body;
    const SQL_REQUEST_TIMETRIALS =  `SELECT tm.idPlayer, p.name, tm.time, tm.isShroomless, tm.date, r.rosterName, r.idRoster
                                    FROM timetrial tm 
                                    JOIN player p ON tm.idPlayer = p.idPlayer 
                                    JOIN roster r on p.idRoster = r.idRoster 
                                    WHERE tm.idMap = '${params.idMap}' AND r.idRoster = 'YFG' AND tm.isShroomless = ${params.isShroomless} OR tm.idMap = '${params.idMap}' AND r.idRoster = 'YFO' AND tm.isShroomless = ${params.isShroomless}
                                    ORDER BY tm.time ASC, tm.date ASC;`;
    const SQL_REQUEST_INSERT = "INSERT INTO `timetrial`(`idMap`, `idPlayer`, `time`, `isShroomless`) " +
                         `VALUES ('${params.idMap}','${params.idPlayer}',${params.time},${params.isShroomless});`;
    db.query(SQL_REQUEST_TIMETRIALS + SQL_REQUEST_INSERT + SQL_REQUEST_TIMETRIALS, (err, result) => {
        if(err) {
            res.status(STATUS_CODE_BAD_REQUEST).send(err);
            return;
        }
        if(Array.isArray(result[0]) && result[0].length) {
            const OLD_RANKING = result[0];
            const NEW_RANKING = result[2]

            let isSame = true;
            for(let i = 0; i < 10; i++) {
                if(i < OLD_RANKING.length) {
                    if(OLD_RANKING[i].idPlayer != NEW_RANKING[i].idPlayer) {
                        isSame = false;
                    }
                }
            }
            
            if(!isSame) {
                if(!params.isShroomless){
                    const SQL_REQUEST_UPDATE = makeUpdateRequest(OLD_RANKING, NEW_RANKING);

                    db.query(SQL_REQUEST_UPDATE, (_err, _result) => {
                        if(_err) {
                            res.status(STATUS_CODE_BAD_REQUEST).send(err);
                            return;
                        }
                        res.status(STATUS_CODE_CREATED).send(result[1]);
                        return;
                    })
                } else {
                    res.status(STATUS_CODE_CREATED).send(result[1]);
                    return;
                }
            } else {
                res.status(STATUS_CODE_CREATED).send(result[1]);
            }
        } else {
            if(!params.isShroomless){
                const SQL_REQUEST_PLAYER = `select idRoster from player WHERE idPlayer = '${params.idPlayer}';`;
                db.query(SQL_REQUEST_PLAYER, (_err, _result) => {
                    // if no data already exist for the idMap
                    let idRoster = _result[0].idRoster;
                    if(idRoster === 'YFG' || idRoster === 'YFO') {
                        const SQL_REQUEST_UPDATE = `UPDATE \`player\` SET \`tt_points\`=tt_points + 15,\`tt_top1\`= tt_top1 + 1,\`tt_top3\`= tt_top3 + 0 WHERE idPlayer = '${params.idPlayer}';`;
                        db.query(SQL_REQUEST_UPDATE, (__err, __result) => {
                            if(__err) {
                                res.status(STATUS_CODE_BAD_REQUEST).send(err);
                                return;
                            }
                            res.status(STATUS_CODE_CREATED).send(result[1]);
                            return;
                        })
                    }
                    res.status(STATUS_CODE_CREATED).send(result[1]);
                        return;     
                })
            } else {
                res.status(STATUS_CODE_CREATED).send(result[1]);
                return;
            }
        }
    })
}

function patchTimetrial(req, res) {
    const body = req.body;
    const SQL_REQUEST_TIMETRIALS = `SELECT tm.idPlayer, p.name, tm.time, tm.isShroomless, tm.date, r.rosterName, r.idRoster
                                    FROM timetrial tm 
                                    JOIN player p ON tm.idPlayer = p.idPlayer 
                                    JOIN roster r on p.idRoster = r.idRoster 
                                    WHERE tm.idMap = '${req.params.idMap}' AND r.idRoster = 'YFG' AND tm.isShroomless = ${req.params.isShroomless} OR tm.idMap = '${req.params.idMap}' AND r.idRoster = 'YFO' AND tm.isShroomless = ${req.params.isShroomless}
                                    ORDER BY tm.time ASC, tm.date ASC;`;
    const SQL_REQUEST_INSERT = `UPDATE \`timetrial\` SET \`time\`=${body.time},\`date\`=CURRENT_TIMESTAMP WHERE idMap = '${req.params.idMap}' AND idPlayer = '${req.params.idPlayer}' AND isShroomless = ${req.params.isShroomless};`;
    db.query(SQL_REQUEST_TIMETRIALS + SQL_REQUEST_INSERT + SQL_REQUEST_TIMETRIALS, (err, result) => {
        if(err) {
            res.status(STATUS_CODE_BAD_REQUEST).send(err);
            return;
        }
        if(result[1].changedRows === 0) {
            res.status(STATUS_CODE_BAD_REQUEST).send({
                error : "Temps n'existe pas"
            });
            return;
        }
        if(!Array.isArray(result[0]) || !result[0].length) {
            res.status(STATUS_CODE_NOT_FOUND).send({
                        error : `'${req.params.idMap}' n'existe pas`
            });
            return;
        }
            const OLD_RANKING = result[0];
            const NEW_RANKING = result[2];

            let isSame = true;
            for(let i = 0; i < 10; i++) {
                if(OLD_RANKING[i] != undefined) {
                    if(OLD_RANKING[i].idPlayer != NEW_RANKING[i].idPlayer) {
                        isSame = false;
                    }
                }
                
            }
            if(OLD_RANKING.length != NEW_RANKING.length) {
                isSame = false;
            }
            let oldTime = OLD_RANKING.find(x => x.idPlayer === req.params.idPlayer).time;
            let newTime = NEW_RANKING.find(x => x.idPlayer === req.params.idPlayer).time;
            let diff = msToTime(oldTime-newTime, true);

            diff = (oldTime >= newTime) ? "-" + diff : diff;
            oldTime = msToTime(oldTime);
            newTime = msToTime(newTime);
            if(!isSame) {
                if(req.params.isShroomless) {
                    const SQL_REQUEST_UPDATE = makeUpdateRequest(OLD_RANKING, NEW_RANKING);

                    db.query(SQL_REQUEST_UPDATE, (_err, _result) => {
                        if(_err) {
                            res.status(STATUS_CODE_BAD_REQUEST).send(err);
                            return;
                        }
                        res.status(STATUS_CODE_OK).send({
                            diff : diff,
                            newTime : newTime,
                            oldTime: oldTime
                        });
                    })
                }

            } else {
                res.status(STATUS_CODE_OK).send({
                    diff : diff,
                    newTime : newTime,
                    oldTime: oldTime
                });
            }
        
    })
}

const convertPlaceToPoints = (index) => {
    let place = parseInt(index);
    return (10 - place)
}

const makeUpdateRequest = (OLD_RANKING, NEW_RANKING) => {
    let ARRAY_REQUEST = [];
    OLD_RANKING.forEach((element, index) => {
        if(index < 10) {
            let pointsDelete = Math.abs(convertPlaceToPoints(index)) * -1;
            let top1 = 0;
            let top3 = 0;
            if(index == 0) {
                top1 = -1;
            } else if(index == 1 || index == 2) {
                top3 = -1;
            }
            let obj = {
                idPlayer : element.idPlayer,
                points : pointsDelete,
                top1 : top1,
                top3 : top3,
                };
                ARRAY_REQUEST[element.idPlayer] = obj;
        }
    });
    NEW_RANKING.forEach((element, index) => {
        if(index < 10) {
            let pointsAdd = convertPlaceToPoints(index);
            let top1 = 0;
            let top3 = 0;
            if(index == 0) {
                top1 = 1;
            } else if(index == 1 || index == 2) {
                top3 = 1;
            }
            if(ARRAY_REQUEST[element.idPlayer] != undefined) {
                ARRAY_REQUEST[element.idPlayer].points += pointsAdd
                ARRAY_REQUEST[element.idPlayer].top1 += top1
                ARRAY_REQUEST[element.idPlayer].top3 += top3
            } else {
                let obj = {
                    idPlayer : element.idPlayer,
                    points : pointsAdd,
                    top1 : top1,
                    top3 : top3,
                };
                ARRAY_REQUEST[element.idPlayer] = obj;
            }
        }
                    
    });

    let SQL_REQUEST_UPDATE = "";
    for (let key in ARRAY_REQUEST) {
        SQL_REQUEST_UPDATE += `UPDATE \`player\` SET \`tt_points\`=tt_points + ${ARRAY_REQUEST[key].points},\`tt_top1\`= tt_top1 + ${ARRAY_REQUEST[key].top1},\`tt_top3\`= tt_top3 + ${ARRAY_REQUEST[key].top3} WHERE idPlayer = '${ARRAY_REQUEST[key].idPlayer}';`;
    }
    return SQL_REQUEST_UPDATE;
}


function msToTime(s, isDiff = false) {
    s = Math.abs(s);
    let saveTime = s;
    // Pad to 2 or 3 digits, default is 2
    function pad(n, z) {
      z = z || 2;
      return ('00' + n).slice(-z);
    }
  
    let ms = s % 1000;
    s = (s - ms) / 1000;
    let secs = s % 60;
    s = (s - secs) / 60;
    let mins = s % 60;
    console.log(saveTime);
    if(saveTime < 1000 && saveTime > -1000) {
        return "0."+pad(saveTime, 3);
    }
  
    return !isDiff ? pad(mins) + ':' + pad(secs) + '.' + pad(ms, 3) : secs + '.' + pad(ms, 3);
}

module.exports = {getTimetrialsByMap, postTimetrial, patchTimetrial}