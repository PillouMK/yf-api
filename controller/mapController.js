const config = require('../databaseConfig.js');
const {STATUS_CODE_OK, STATUS_CODE_CREATED, STATUS_CODE_BAD_REQUEST, STATUS_CODE_NOT_FOUND} = require('./variable');
// Connexion à la database
const db = config.connection;

function getAllMaps(req, res) {
    db.query("SELECT * FROM map", (err, result) => {
        if(err) {
            res.status(STATUS_CODE_BAD_REQUEST).send(err);
            return;
        }
        if(Array.isArray(result) && result.length) {
            res.status(STATUS_CODE_OK).send({
                response : result 
            });
        } else {
            res.status(STATUS_CODE_NOT_FOUND).send({ response : "There is no map"});
        }

      });
}

module.exports = {getAllMaps}
