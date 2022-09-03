class Player {
    constructor(idPlayer, name, tt_points, tt_top1, tt_top3) {
        this.idPlayer = idPlayer;
        this.name = name;
        this.tt_points = tt_points;
        this.tt_top1 = tt_top1;
        this.tt_top3 = tt_top3;
    }

    fromJSON(json) {
        return new Player(json.idPlayer, json.name, json.tt_points, json.tt_top1, json.tt_top3);
    }
}

module.exports = Player;