const config = require('../databaseConfig.js');
const {STATUS_CODE_OK, STATUS_CODE_CREATED, STATUS_CODE_BAD_REQUEST, STATUS_CODE_NOT_FOUND} = require('./variable');
// Connexion à la database
const db = config.connection;

function getAllMaps(req, res) {
    const SQL_REQUEST = "SELECT * FROM map";
    db.query(SQL_REQUEST, (err, result) => {
        if(err) {
            res.status(STATUS_CODE_BAD_REQUEST).send(err);
            return;
        }
        if(Array.isArray(result) && result.length) {
            res.status(STATUS_CODE_OK).send(result);
        } else {
            res.status(STATUS_CODE_NOT_FOUND).send({ 
                    error : "There is no map"     
            });
        }
    });
}

// WEEKLY TIMETRIAL CONTROLLER

function postMapsWeekly(req, res) {
    const params = req.body;
    const SQL_DELETE_WEEKLYMAPS = "DELETE FROM `weekly_map`;";
    const SQL_DELETE_WEEKLY_TT = "DELETE FROM `weekly_tt`;"
    const SQL_INSERT_WEEKLYMAP = (weekly_map_array) => {
        let sql = "INSERT INTO `weekly_map`(`idMap`, `isShroomless`, `goldTime`, `silverTime`, `bronzeTime`, `ironTime`, `isObligatory`) VALUES ";
        weekly_map_array.forEach((element, index) => {
            sql += `('${element.idMap}',${element.isShroomless},${element.goldTime},${element.silverTime},${element.bronzeTime},${element.ironTime},${element.isObligatory})`;
            if(index != weekly_map_array.length-1) {
                sql += ","
            }
        });
        return sql;
    }
    db.query(SQL_DELETE_WEEKLY_TT + SQL_DELETE_WEEKLYMAPS + SQL_INSERT_WEEKLYMAP(params.weekly_maps), (err, result) => {
        if(err) {
            res.status(STATUS_CODE_BAD_REQUEST).send(err);
            return;
        }
        if(Array.isArray(result) && result.length) {
            res.status(STATUS_CODE_CREATED).send(result);
            return
        }
    })
}

function patchMapWeekly(req, res) {
    let goldTime = req.body.hasOwnProperty("goldTime") ? `\`goldTime\`=${req.body.goldTime},` : `\`goldTime\`=goldTime,`;
    let silverTime = req.body.hasOwnProperty("silverTime") ? `\`silverTime\`=${req.body.silverTime},` : `\`silverTime\`=silverTime,`;
    let bronzeTime = req.body.hasOwnProperty("bronzeTime") ? `\`bronzeTime\`=${req.body.bronzeTime},` : `\`bronzeTime\`=bronzeTime,`;
    let ironTime = req.body.hasOwnProperty("ironTime") ? `\`ironTime\`=${req.body.ironTime}` : `\`ironTime\`=ironTime`;
    
    const SQL_UPDATE_WEEKLYMAP = `UPDATE \`weekly_map\` SET ${goldTime} ${silverTime} ${bronzeTime} ${ironTime} WHERE idMap = '${req.params.idMap}'`;
    db.query(SQL_UPDATE_WEEKLYMAP, (err, result) => {
        if(err) {
            res.status(STATUS_CODE_BAD_REQUEST).send(err);
            return;
        }
        if(result.affectedRows != undefined && result.affectedRows > 0)
        {
            res.status(STATUS_CODE_CREATED).send({
                sucess : "weekly map modifiée"
            });
            return; 
        } else {
            res.status(STATUS_CODE_BAD_REQUEST).send({
                error : `${req.params.idMap} est un idMap inconnu`
            });
            return; 
        }

         
    })
}

module.exports = {
    getAllMaps,
    postMapsWeekly,
    patchMapWeekly
}
