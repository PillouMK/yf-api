const config = require('../databaseConfig.js');
const {STATUS_CODE_OK, STATUS_CODE_CREATED, STATUS_CODE_BAD_REQUEST, STATUS_CODE_NOT_FOUND, STATUS_CODE_CONFLICT} = require('./variable');
const { msToTime } = require("./timetrialController");
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
            res.status(STATUS_CODE_CONFLICT).send({
                error: "Weeklytt already exist for this ressource"
            })
            return
        }
        let tt_time_ms = result[1][0].time;
        let tt_time = tt_time_ms != undefined ? msToTime(tt_time_ms) : ""
        
        res.status(STATUS_CODE_CREATED).send({
            weekly: msToTime(body.time),
            timetrial: tt_time,
            ttExist: (tt_time_ms != undefined),
            newIsBetter : (tt_time_ms != undefined) ? (tt_time_ms > body.time) : false
        })
        return
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
        let oldTime = result[0][0].time;
        let diff = msToTime(oldTime-body.time, true);
        diff = (oldTime >= body.time) ? "-" + diff : diff;

        let tt_time_ms = result[2][0].time;
        let tt_time = tt_time_ms != undefined ? msToTime(tt_time_ms) : ""
        res.status(STATUS_CODE_OK).send({
            diff : diff,
            newWeekly : msToTime(body.time),
            oldWeekly: msToTime(oldTime),
            timetrial: tt_time,
            ttExist: (tt_time_ms != undefined),
            newIsBetter : (tt_time_ms != undefined) ? (tt_time_ms > body.time) : false
        });
    })
}


module.exports = {
    postWeeklytt,
    patchWeeklytt
}