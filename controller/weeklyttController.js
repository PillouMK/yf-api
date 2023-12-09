const config = require('../databaseConfig.js');
const {STATUS_CODE_OK, STATUS_CODE_CREATED, STATUS_CODE_BAD_REQUEST, STATUS_CODE_NOT_FOUND, STATUS_CODE_CONFLICT} = require('./variable');
const { msToTime } = require("./functions.js");
// Connexion à la database
const db = config.connection;

function postWeeklytt(req, res) {
    const body = req.body;
    if(!body.hasOwnProperty("idMap")) {
        res.status(STATUS_CODE_BAD_REQUEST).send({
            error: "Aucun idMap indiqué"
        });
        return
    }
    if(!body.hasOwnProperty("idPlayer")) {
        res.status(STATUS_CODE_BAD_REQUEST).send({
            error: "Aucun idPlayer indiqué"
        });
        return
    }
    if(!body.hasOwnProperty("isShroomless")) {
        res.status(STATUS_CODE_BAD_REQUEST).send({
            error: "Aucun isShroomless indiqué"
        });
        return
    }
    if(!body.hasOwnProperty("time")) {
        res.status(STATUS_CODE_BAD_REQUEST).send({
            error: "Aucun temps en milliseconde indiqué"
        });
        return
    }
    const SQL_INSERT_WEEKLYTT = `INSERT INTO \`weekly_tt\`(\`idMap\`, \`idPlayer\`, \`time\`, \`isShroomless\`, \`date\`) VALUES ('${body.idMap}','${body.idPlayer}',${body.time},${body.isShroomless},CURRENT_TIMESTAMP);`;
    const SQL_SELECT_TIMETRIAL_PLAYER = `SELECT * FROM \`timetrial\` WHERE idPlayer = '${body.idPlayer}' AND isShroomless = ${body.isShroomless} AND idMap = '${body.idMap}'`;
    db.query(SQL_INSERT_WEEKLYTT + SQL_SELECT_TIMETRIAL_PLAYER, (err, result) => {
        if(err) {
            if(err.errno == 1452) {
                res.status(STATUS_CODE_BAD_REQUEST).send({
                    error: `${body.idMap} en ${body.isShroomless ? "no items" : "items"} n'est pas une map weekly`
                })
                return
            }
            if(err.errno == 1062) {
                res.status(STATUS_CODE_CONFLICT).send({
                    error: "Weeklytt already exist for this ressource"
                })
                return
            }
            
        }
        let tt_time_ms = (result[1].length) ? result[1][0].time : undefined;
        let tt_time = tt_time_ms != undefined ? msToTime(tt_time_ms) : ""
        if((tt_time_ms != undefined && tt_time_ms > body.time) || tt_time_ms == undefined) {
            const SQL_UPDATE_TIMETRIAL = (tt_time_ms == undefined) ? "INSERT INTO `timetrial`(`idMap`, `idPlayer`, `time`, `isShroomless`) " +
            `VALUES ('${body.idMap}','${body.idPlayer}',${body.time},${body.isShroomless});` : `UPDATE \`timetrial\` SET \`time\`='${body.time}' ,\`date\`=CURRENT_TIMESTAMP WHERE idMap = '${body.idMap}' AND idPlayer = '${body.idPlayer}' AND isShroomless = ${body.isShroomless};`;
            db.query(SQL_UPDATE_TIMETRIAL, (errUpdate, resultUpdate) => {
                if(errUpdate) {
                    res.status(STATUS_CODE_BAD_REQUEST).send(errUpdate);
                    return;
                }
                res.status(STATUS_CODE_CREATED).send({
                    weekly: msToTime(body.time),
                    timetrial: tt_time,
                    ttExist: (tt_time_ms != undefined),
                    newIsBetter : (tt_time_ms != undefined) ? (tt_time_ms > body.time) : false
                })
            })
        } else {
            // if new time isn't better than normal timetrial
            res.status(STATUS_CODE_CREATED).send({
                weekly: msToTime(body.time),
                timetrial: tt_time,
                ttExist: (tt_time_ms != undefined),
                newIsBetter : (tt_time_ms != undefined) ? (tt_time_ms > body.time) : false
            })
        }
        
    })
}

function patchWeeklytt(req, res) {
    const body = req.body;
    let idMap = req.params.idMap;
    let idPlayer = req.params.idPlayer;
    let isShroomless = req.params.isShroomless;
    const SQL_SELECT_OLD_TIME = `SELECT time FROM \`weekly_tt\` WHERE idMap = '${idMap}' AND idPlayer = '${idPlayer}' AND isShroomless = ${isShroomless};`;
    const SQL_UPDATE_WEEKLYTT = `UPDATE \`weekly_tt\` SET \`time\`='${body.time}' ,\`date\`=CURRENT_TIMESTAMP WHERE idMap = '${idMap}' AND idPlayer = '${idPlayer}' AND isShroomless = ${isShroomless};`;
    const SQL_SELECT_TIMETRIAL_PLAYER = `SELECT * FROM \`timetrial\` WHERE idPlayer = '${idPlayer}' AND isShroomless = ${isShroomless} AND idMap = '${idMap}'`;
    db.query(SQL_SELECT_OLD_TIME + SQL_UPDATE_WEEKLYTT + SQL_SELECT_TIMETRIAL_PLAYER, (err, result) => {
        if(err) {
            res.status(STATUS_CODE_BAD_REQUEST).send(err)
            return
        }
        if(!result[0].length) {
            res.status(STATUS_CODE_NOT_FOUND).send({
                error: "Ce joueur ne possède pas de temps weekly_tt pour cette map"
            })
            return;
        }
        
        let oldTime = result[0][0].time;
        let diff = msToTime(oldTime-body.time, true);
        diff = (oldTime >= body.time) ? "-" + diff : diff;

        let tt_time_ms = result[2][0].time;
        let tt_time = tt_time_ms != undefined ? msToTime(tt_time_ms) : ""

        if(tt_time_ms > body.time) {
            const SQL_UPDATE_TIMETRIAL = `UPDATE \`timetrial\` SET \`time\`='${body.time}' ,\`date\`=CURRENT_TIMESTAMP WHERE idMap = '${idMap}' AND idPlayer = '${idPlayer}' AND isShroomless = ${isShroomless};`;
            db.query(SQL_UPDATE_TIMETRIAL, (errUpdate, resultUpdate) => {
                if(errUpdate) {
                    res.status(STATUS_CODE_BAD_REQUEST).send(errUpdate);
                    return;
                }
                res.status(STATUS_CODE_OK).send({
                    diff : diff,
                    newWeekly : msToTime(body.time),
                    oldWeekly: msToTime(oldTime),
                    timetrial: tt_time,
                    ttExist: true,
                    newIsBetter : (tt_time_ms != undefined) ? (tt_time_ms > body.time) : false
                });
            })
        } else {
            res.status(STATUS_CODE_OK).send({
                diff : diff,
                newWeekly : msToTime(body.time),
                oldWeekly: msToTime(oldTime),
                timetrial: tt_time,
                ttExist: true,
                newIsBetter : false
            });
        }

        
    })
}

function getWeeklyttByMap(req, res) {
    const SQL_SELECT_WEEKLY_MAP = "SELECT idMap, isShroomless FROM `weekly_map`;";
    db.query(SQL_SELECT_WEEKLY_MAP, (err, result) => {
        if(err) {
            res.status(STATUS_CODE_BAD_REQUEST).send(err)
            return;
        }
        const SQL_SELECT_WEEKLYTT_FROM_ID = (idMap, isShroomless) => {
            return `SELECT wtt.idMap, wtt.idPlayer, p.name, wtt.time, wtt.isShroomless, wtt.date 
            FROM weekly_tt wtt
            JOIN player p on p.idPlayer = wtt.idPlayer 
            WHERE wtt.idMap = '${idMap}' and wtt.isShroomless = ${isShroomless}
            ORDER BY wtt.time ASC, wtt.date ASC;`;
        }

        const SQL_SELECT_MAP_INFOS_FROM_ID = (idMap, isShroomless) => {
            return `SELECT m.idMap, m.nameMap, m.minia, m.initialGame, m.DLC, m.retro, wm.* 
            FROM \`map\` m JOIN \`weekly_map\` wm ON m.idMap = wm.idMap 
            WHERE m.idMap = '${idMap}' AND wm.isShroomless = ${isShroomless};` 
        }

        if(!result.length) {
            res.status(STATUS_CODE_NOT_FOUND).send({
                error : "Il n'y a pas de map weekly"
            })
            return;
        }

        let SQL_SELECT_WEEKLYTT = "";
        for(let elt of result) {
            SQL_SELECT_WEEKLYTT += SQL_SELECT_WEEKLYTT_FROM_ID(elt.idMap, elt.isShroomless);
        }

        let SQL_SELECT_INFOMAP = "";
        for(let elt of result) {
            SQL_SELECT_INFOMAP += SQL_SELECT_MAP_INFOS_FROM_ID(elt.idMap, elt.isShroomless);
        }
        db.query(SQL_SELECT_WEEKLYTT, (errWeekly, resultWeekly) => {
            if(errWeekly) {
                res.status(STATUS_CODE_BAD_REQUEST).send(errWeekly)
                return;
            }
            if(!Array.isArray(resultWeekly) || !resultWeekly.length) {
                res.status(STATUS_CODE_NOT_FOUND).send({             
                        error : `Aucune données`               
                });
                return;
            }
            db.query(SQL_SELECT_INFOMAP, (errMap, resultMap) => {
                console.log(resultMap);
                if(errMap) {
                    res.status(STATUS_CODE_BAD_REQUEST).send(errWeekly)
                    return;
                }
                if(!Array.isArray(resultMap) || !resultMap.length) {
                    res.status(STATUS_CODE_NOT_FOUND).send({             
                            error : `Aucune données`               
                    });
                    return;
                }
                let arrayResponse = [];
                for(let i = 0; i<resultMap.length; i++) {
                    let infoMap = resultMap[i][0];
                    let goldArray = [];
                    let silverArray = [];
                    let bronzeArray = [];
                    let outArray = [];
                    if(Array.isArray(resultWeekly[i])) {
                        resultWeekly[i].forEach((element, index) => {
                            let time = element.time;
                            element.duration = msToTime(element.time);
                            delete element.time;
                            delete element.idMap;
                            if(time < infoMap.goldTime) goldArray.push(element)
                            else if(time < infoMap.silverTime) silverArray.push(element)                                
                            else if(time < infoMap.bronzeTime) bronzeArray.push(element)                                                         
                            else outArray.push(element)                                
                                    
                        });
                    } else {
                        let infoMap = resultMap[0][0];
                        let element = resultWeekly[0][0];
                        let time = element.time;
                        element.duration = msToTime(element.time);
                        delete element.time;
                        delete element.idMap;
                        if(time < infoMap.goldTime) goldArray.push(element)
                        else if(time < infoMap.silverTime) silverArray.push(element)                                
                        else if(time < infoMap.bronzeTime) bronzeArray.push(element)                                                         
                        else outArray.push(element)
                    }
                                                        
                    const weeklyTimetrial = {goldArray: goldArray, silverArray: silverArray, bronzeArray: bronzeArray, outArray : outArray};
                    arrayResponse.push({map: infoMap, weeklyTimetrial: weeklyTimetrial})
                }
                res.status(STATUS_CODE_OK).send({             
                    arrayResponse               
            });
            })
        })
        
    })

}


module.exports = {
    postWeeklytt,
    patchWeeklytt,
    getWeeklyttByMap
}