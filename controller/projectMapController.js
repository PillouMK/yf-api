const config = require('../databaseConfig.js');
const {STATUS_CODE_OK, STATUS_CODE_CREATED, STATUS_CODE_BAD_REQUEST, STATUS_CODE_NOT_FOUND} = require('./variable');
// Connexion à la database
const db = config.connection;

function getAllprojectMap(req, res){
    let SQL_ALL_SELECT="";
    const month = req.query.month;
    const iteration = req.query.iteration
    if(req.query.idRoster == undefined){
        res.status(STATUS_CODE_BAD_REQUEST).send({
            error : "Paramètre idRoster requis" 
        });
        return;
    }
    const idRoster = req.query.idRoster 
    const SQL_REQUEST_PROJECT_MAP = (idMap, month ,idRoster) =>{ 
        return `SELECT pm.*,m.nameMap FROM projectmap as pm 
        JOIN map as m ON pm.idMap=m.idMap 
        WHERE pm.idMap='${idMap}' AND pm.idRoster='${idRoster}' AND DATE(pm.date) >= (DATE(NOW()) - INTERVAL ${month} MONTH)
        ORDER BY pm.id DESC;`;
    };
    const SQL_REQUEST_MAPS="SELECT idMap FROM map";
    db.query(SQL_REQUEST_MAPS, (err, result) => {
        if(err){
            res.status(STATUS_CODE_BAD_REQUEST).send(err);
            return;
        }

        if(!Array.isArray(result) || !result.length){
            res.status(STATUS_CODE_NOT_FOUND).send({ 
                error : "No maps in database"
            });
            return;
        }

        result.forEach(element => {
            SQL_ALL_SELECT += SQL_REQUEST_PROJECT_MAP(element.idMap, month, idRoster);
        });
        db.query(SQL_ALL_SELECT, (_err, _result) => {
            if(_err){
                res.status(STATUS_CODE_BAD_REQUEST).send(_err);
                return;
            }
            if(!Array.isArray(_result) || !_result.length){
                res.status(STATUS_CODE_NOT_FOUND).send({ 
                     error : "No projectMap Data" 
                });
                return;
            }
            let RESPONSE_ARRAY = [];
            let RESPONSE_ARRAY_2 = [];
            _result.forEach(_element =>{
                if(_element.length){
                    let coef = 0;
                    let score = 0;
                    _element.forEach(elt =>{
                        coef += elt.coef;
                        score += elt.score * elt.coef;
                    })
                    let numberOfData = _element.length;
                    let scoreOfMap = Math.round(score * 10 / coef) / 10; 
                    let scoreMap = {
                        idMap : _element[0].idMap,
                        nameMap : _element[0].nameMap,
                        score : scoreOfMap,
                        iteration : numberOfData,
                    }
                    if(numberOfData >= iteration) RESPONSE_ARRAY.push(scoreMap)
                    else RESPONSE_ARRAY_2.push(scoreMap);
                }
            })
            if(RESPONSE_ARRAY.length){
                RESPONSE_ARRAY.sort((a, b) => {
                    return b.score - a.score;
                });
                RESPONSE_ARRAY_2.sort((a, b) => {
                    return b.score - a.score;
                })
                res.status(STATUS_CODE_OK).send({
                        projectMapValid : RESPONSE_ARRAY,
                        projectMapNotValid : RESPONSE_ARRAY_2                  
                });
            } else {
                res.status(STATUS_CODE_NOT_FOUND).send({ 
                     error : "No projectMap Data" 
                });
            }    
        });
    });
}

function postProjectMap (req, res){
    let SQL_INSERT = "INSERT INTO `projectmap`(`idMap`, `idRoster`, `score`, `coef`) VALUES ";
    const SQL_REQUEST_MAPS = "SELECT idMap from map";
    if(req.body.scoreMatch == undefined || req.body.idRoster == undefined || req.body.scoresMaps == undefined){
        res.status(STATUS_CODE_BAD_REQUEST).send({
           error : "Au moins un de ces paramètres est manquant : scoreMatch, idRoster, scoresMaps" 
        });
        return;     
    } 
    if(typeof req.body.scoreMatch != "number"){
        res.status(STATUS_CODE_BAD_REQUEST).send({
           error : "scoreMatch doit être de type number" 
        });
        return;
    }
    if(req.body.idRoster != "YFG" && req.body.idRoster !="YFO"){
        res.status(STATUS_CODE_BAD_REQUEST).send({
            error : "idRoster doit avoir une des valeurs suivantes : YFG, YFO" 
        });
        return;   
    }
    if(!Array.isArray(req.body.scoresMaps) || !req.body.scoresMaps.length){
        res.status(STATUS_CODE_BAD_REQUEST).send({
            error : "scoresMaps doit être un tableau non vide" 
        });
        return;   
    }
    const idRoster = req.body.idRoster;
    let coef = calculCoef(req.body.scoreMatch);
    db.query(SQL_REQUEST_MAPS, (err, result) => {
        if(err) {
            res.status(STATUS_CODE_BAD_REQUEST).send(err);
            return;
        }
        if(!Array.isArray(result) || !result.length) {
            res.status(STATUS_CODE_NOT_FOUND).send({ 
                error : "There is no map"
            });
            return;
        } 
           
        req.body.scoresMaps.forEach((element, index) =>{
            if(element.idMap == undefined || element.scoreMap == undefined){
                res.status(STATUS_CODE_BAD_REQUEST).send({
                    error : "scoresMaps doit contenir des éléments ayant pour attributs : idMap, scoreMap" 
                });
                return;   
            }
            if(result.findIndex(x => x.idMap == element.idMap) == -1){
                res.status(STATUS_CODE_BAD_REQUEST).send({
                    error : `${element.idMap} n'est pas un idMap valide`
                });
                return; 
            }
            if(typeof element.scoreMap != "number"){
                res.status(STATUS_CODE_BAD_REQUEST).send({
                    error : "scoreMap doit être de type number" 
                });
                return;
            }
            SQL_INSERT += "('"+ element.idMap +"', '" + idRoster +"'," + element.scoreMap +"," + coef+ ")";
            if(req.body.scoresMaps.length == (index+1)){
                SQL_INSERT+= ";";
            } else {
                SQL_INSERT+= ",";
            }
        });
        db.query(SQL_INSERT, (_err, _result) => {
            if(_err) {
                console.log(_err);
                res.status(STATUS_CODE_BAD_REQUEST).send(_err);
                return;
            }
            res.status(STATUS_CODE_CREATED).send(_result);
        })
    })
    
}

const calculCoef = (scoreWar) => {
    let coef = 0;
    let exposant = Math.log(1/2) * (scoreWar * scoreWar) * (1/10000);
    coef = Math.exp(exposant) * 10;
    coef = Math.round(coef*100)/100;
    return coef;
}


module.exports={getAllprojectMap, postProjectMap};