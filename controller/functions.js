// FUNCTION FOR CONTROLLERS

const convertPlaceToPoints = (index) => {
    let place = parseInt(index);
    return (10 - place)
}

const makeUpdateRequest = (idPlayer, points, top1, top3) => {
    return `UPDATE \`player\` SET \`tt_points\`=tt_points + ${points},\`tt_top1\`= tt_top1 + ${top1},\`tt_top3\`= tt_top3 + ${top3} WHERE idPlayer = '${idPlayer}';`;
}

const getAllTopByMap = (idMap) => {
    return `SELECT player.idPlayer FROM timetrial 
    JOIN player ON player.idPlayer = timetrial.idPlayer 
    WHERE timetrial.idMap = '${idMap}' AND timetrial.isShroomless = false AND player.idRoster IN ('YFG', 'YFO')
    ORDER BY timetrial.time
    LImit 10;`
}

const msToTime = (s, isDiff = false) => {

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
  
    return !isDiff ? pad(mins) + ':' + pad(secs) + '.' + pad(ms, 3) : secs + '.' + pad(ms, 3);
}
  
const resetTimetrialRanking = (db) => {
    const SQL_RESET_ALL_POINTS = "UPDATE `player` SET `tt_points`=0,`tt_top1`=0,`tt_top3`=0;";
    const SQL_SELECT_MAP = "SELECT idMap from map;";
    db.query(SQL_SELECT_MAP, (err, result) => {
        if(err) {
            console.log(err);
            return;
        }
        let arrayMap = result;
        let SQL_TOP_BY_MAP = "";
        arrayMap.forEach(element => {
            SQL_TOP_BY_MAP += getAllTopByMap(element.idMap);
        });

        db.query(SQL_TOP_BY_MAP, (_err, _result) => {
            if(_err) {
                console.log(_err);
                return;
            } 
            let SQL_UPDATE_POINT_REQUEST = "";
            
            _result.forEach(map => {
                map.forEach((player, index) => {
                    let point = convertPlaceToPoints(index);
                    let top1 = (index == 0) ? 1 : 0;
                    let top3 = (index == 1 || index == 2) ? 1 : 0;
                    SQL_UPDATE_POINT_REQUEST += makeUpdateRequest(player.idPlayer, point, top1, top3);
                });
            });
            db.query(SQL_RESET_ALL_POINTS + SQL_UPDATE_POINT_REQUEST, (_newErr, _newResult) => {
                if(_newErr) {
                    console.log(_newErr)
                }
            })
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

module.exports = {
    resetTimetrialRanking, 
    msToTime, 
    getAllTopByMap, 
    makeUpdateRequest, 
    convertPlaceToPoints, 
    calculCoef
}
