class Timetrial {
    constructor(idMap, idPlayer, time, isShroomless, date) {
        this.idMap = idMap;
        this.idPlayer = idPlayer;
        this.time = time;
        this.isShroomless = isShroomless;
        this.date = date;
    }

    fromJSON(json) {
        return new Timetrial(json.idMap, json.idPlayer, json.time, json.isShroomless, json.date);
    }
}

module.exports = Timetrial;