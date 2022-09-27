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
                response : {
                    error : `${req.params.idMap} n'est pas un idMap valide`
                }
            });
            return;
        }
        
        // check if data for idMap exists
        if(!Array.isArray(result[1]) && !result[1].length) {
            res.status(STATUS_CODE_NOT_FOUND).send({
                response : {
                    error : `${req.params.idMap} ne possède pas de temps enregistré pour ${filterRoster}`
                }
            });
            return;
        }
        const mapInfos = result[0];
        const arrayTimetrial = [];
        const arrayShroom = [];
        const arrayNoShroom = [];
        result[1].forEach(element => {
            let timetrial = element;
                // Sort timetrials by isShroomless
                if(!timetrial.isShroomless) {
                    arrayShroom.push(timetrial)
                } else {
                    arrayNoShroom.push(timetrial);
                }
                // shroomless params is no longer needed
                delete timetrial.isShroomless
        });

        // add response, null if no data
        arrayTimetrial.push({"arrayShroom" : arrayShroom.length ? arrayShroom : null});
        arrayTimetrial.push({"arrayShroomless" : arrayNoShroom.length ? arrayNoShroom : null});
        res.status(STATUS_CODE_OK).send({
            response : {
                infoMap : mapInfos,
                timetrials : arrayTimetrial
            }
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
                const SQL_REQUEST_UPDATE = makeUpdateRequest(OLD_RANKING, NEW_RANKING);

                db.query(SQL_REQUEST_UPDATE, (_err, _result) => {
                    if(_err) {
                        res.status(STATUS_CODE_BAD_REQUEST).send(err);
                        return;
                    }
                    res.status(STATUS_CODE_CREATED).send(result[1]);
                })

            } else {
                res.status(STATUS_CODE_CREATED).send(result[1]);
            }
        } else {
            // if no data already exist for the idMap
            const SQL_REQUEST_UPDATE = `UPDATE \`player\` SET \`tt_points\`=tt_points + 15,\`tt_top1\`= tt_top1 + 1,\`tt_top3\`= tt_top3 + 0 WHERE idPlayer = '${params.idPlayer}';`;
            db.query(SQL_REQUEST_UPDATE, (_err, _result) => {
                if(_err) {
                    res.status(STATUS_CODE_BAD_REQUEST).send(err);
                    return;
                }
                res.status(STATUS_CODE_CREATED).send(result[1]);
            })
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
        if(!Array.isArray(result[0]) || !result[0].length) {
            res.status(STATUS_CODE_NOT_FOUND).send({
                response : {
                        error : `'${req.params.idMap}' n'existe pas`
                    }
            });
            return;
        }
            const OLD_RANKING = result[0];
            const NEW_RANKING = result[2];

            let isSame = true;
            for(let i = 0; i < 10; i++) {
                if(OLD_RANKING[i].idPlayer != NEW_RANKING[i].idPlayer) {
                    isSame = false;
                }
            }
            
            if(!isSame) {
                const SQL_REQUEST_UPDATE = makeUpdateRequest(OLD_RANKING, NEW_RANKING);

                db.query(SQL_REQUEST_UPDATE, (_err, _result) => {
                    if(_err) {
                        res.status(STATUS_CODE_BAD_REQUEST).send(err);
                        return;
                    }
                    res.status(STATUS_CODE_OK).send(result[1]);
                })

            } else {
                res.status(STATUS_CODE_OK).send(result[1]);
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
module.exports = {getTimetrialsByMap, postTimetrial, patchTimetrial}