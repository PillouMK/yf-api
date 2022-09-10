const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const PlayerRoute = require("./routes/playerRoutes");
const MapsRoute = require("./routes/mapsRoutes");
const TimetrialRoute = require("./routes/timetrialRoutes");
const ProjectMapRoute = require("./routes/projectMapRoutes");
const API_VERSION = "v1";

// parse the body (Sinon ça peut faire d'la merde askip)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// On écoute le port 8080
app.listen(8080, () => {  console.log('Serveur à l\'écoute')       });

// Ressources
app.use(`/${API_VERSION}/player`, PlayerRoute);
app.use(`/${API_VERSION}/maps`, MapsRoute);
app.use(`/${API_VERSION}/timetrial`, TimetrialRoute);
app.use(`/${API_VERSION}/projectmap`, ProjectMapRoute);


