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

module.exports = {getAllMaps}
