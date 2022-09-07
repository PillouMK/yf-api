const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const PlayerRoute = require("./routes/playerRoutes");
const MapsRoute = require("./routes/mapsRoutes");
const TimetrialRoute = require("./routes/timetrialRoutes");
const ProjectMapRoute = require("./routes/projectMapRoutes");
// parse the body (Sinon ça peut faire d'la merde askip)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// On écoute le port 8080
app.listen(8080, () => {  console.log('Serveur à l\'écoute')       });

app.use('/player', PlayerRoute);
app.use('/maps', MapsRoute);
app.use('/timetrial', TimetrialRoute);
app.use('/projectmap', ProjectMapRoute);


