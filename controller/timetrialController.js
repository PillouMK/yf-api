const config = require('../databaseConfig.js');
const {STATUS_CODE_OK, STATUS_CODE_CREATED, STATUS_CODE_BAD_REQUEST, STATUS_CODE_NOT_FOUND} = require('./variable');
// Connexion à la database
const db = config.connection;

function getTimetrialByMap(req, res) {
    const arrayTimetrial = [];
    const arrayShroom = [];
    const arrayNoShroom = [];

    db.query(`SELECT idMap, nameMap, minia, initialGame, DLC, retro FROM map where map.idMap = '${req.params.idMap}'; 
        SELECT tm.idPlayer, p.name, tm.time, tm.isShroomless, tm.date, r.rosterName, r.idRoster
        FROM timetrial tm 
        JOIN player p ON tm.idPlayer = p.idPlayer 
        JOIN roster r on p.idRoster = r.idRoster 
        WHERE tm.idMap = '${req.params.idMap}' AND r.idRoster = 'YFG' OR 'YFO' 
        ORDER BY tm.time ASC`, (err, result) => {
        if(err) {
            res.status(STATUS_CODE_BAD_REQUEST).send(err);
            return;
        }

        if(Array.isArray(result[0]) && result[0].length) {
            const mapInfos = result[0];
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
                res.status(STATUS_CODE_OK).send({
                    response : {
                        infoMap : mapInfos,
                        timetrials : arrayTimetrial
                    }
                })
            } else {
                res.status(STATUS_CODE_NOT_FOUND).send({
                    response : `${req.params.idMap} ne possède pas de temps enregistré`
                });
            }
        } else {
            res.status(STATUS_CODE_NOT_FOUND).send({
                response : `${req.params.idMap} n'est pas un idMap valide`
            });
        }

    })
}

module.exports = {getTimetrialByMap}