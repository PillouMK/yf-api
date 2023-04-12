const config = require('../databaseConfig.js');
const {STATUS_CODE_OK, STATUS_CODE_CREATED, STATUS_CODE_BAD_REQUEST, STATUS_CODE_NOT_FOUND} = require('./variable');
const { msToTime } = require('./functions.js');
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
                                    WHERE tm.idMap = '${params.idMap}' AND tm.isShroomless = ${params.isShroomless} AND p.idRoster IN ('YFG', 'YFO')
                                    ORDER BY tm.time ASC, tm.date ASC;`;
    const SQL_REQUEST_INSERT = "INSERT INTO `timetrial`(`idMap`, `idPlayer`, `time`, `isShroomless`) " +
                         `VALUES ('${params.idMap}','${params.idPlayer}',${params.time},${params.isShroomless});`;
    db.query(SQL_REQUEST_TIMETRIALS + SQL_REQUEST_INSERT + SQL_REQUEST_TIMETRIALS, (err, result) => {
        if(err) {
            res.status(STATUS_CODE_BAD_REQUEST).send(err);
            return;
        }
        res.status(STATUS_CODE_CREATED).send(result[1]);
        return;
    })
}

function patchTimetrial(req, res) {
    const body = req.body;
    const SQL_REQUEST_TIMETRIALS = `SELECT tm.idPlayer, p.name, tm.time, tm.isShroomless, tm.date, r.rosterName, r.idRoster
                                    FROM timetrial tm 
                                    JOIN player p ON tm.idPlayer = p.idPlayer 
                                    JOIN roster r on p.idRoster = r.idRoster 
                                    WHERE tm.idMap = '${req.params.idMap}' AND tm.isShroomless = ${req.params.isShroomless} AND p.idRoster IN ('YFG', 'YFO')
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

        if(OLD_RANKING.find(x => x.idPlayer === req.params.idPlayer) == undefined) {
            res.status(STATUS_CODE_OK).send({
                newTime : msToTime(body.time),
                oldTime: "",
                diff: ""
            });
            return
        }
        let oldTime = OLD_RANKING.find(x => x.idPlayer === req.params.idPlayer).time;
        let newTime = NEW_RANKING.find(x => x.idPlayer === req.params.idPlayer).time;
        let diff = msToTime(oldTime-newTime, true);

        diff = (oldTime >= newTime) ? "-" + diff : diff;
        oldTime = msToTime(oldTime);
        newTime = msToTime(newTime);

        res.status(STATUS_CODE_OK).send({
            diff : diff,
            newTime : newTime,
            oldTime: oldTime
        }); 
    })
}

module.exports = {
    getTimetrialsByMap, 
    postTimetrial, 
    patchTimetrial
}