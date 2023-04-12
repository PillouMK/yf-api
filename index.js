const express = require('express');
const app = express();
const bodyParser        = require('body-parser');
const PlayerRoute       = require("./routes/playerRoutes");
const MapsRoute         = require("./routes/mapsRoutes");
const TimetrialRoute    = require("./routes/timetrialRoutes");
const ProjectMapRoute   = require("./routes/projectMapRoutes");
const WeeklyRoute       = require("./routes/weeklyRoutes");

const API_VERSION = "v1";
const {STATUS_CODE_UNAUTHORISED} = require('./controller/variable');
const { resetTimetrialRanking } = require('./controller/functions');
const config = require('./databaseConfig');
const cron = require('node-cron');
const db = config.connection;

require('dotenv').config();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// On écoute le port 8080
app.listen(8080, () => {  console.log('Serveur à l\'écoute, yeah')       });

app.use((req, res, next) => {

   
        // API keys 
        if(req.method == "GET" || req.headers["api-key"] === process.env.api_key) {
            next();
        } else {
            res.status(STATUS_CODE_UNAUTHORISED).json({error: 'unauthorised'})
        }
    
    
})

// Ressources
app.use(`/${API_VERSION}/player`, PlayerRoute);
app.use(`/${API_VERSION}/maps`, MapsRoute);
app.use(`/${API_VERSION}/timetrial`, TimetrialRoute);
app.use(`/${API_VERSION}/projectmap`, ProjectMapRoute);
app.use(`/${API_VERSION}/weekly`, WeeklyRoute);

// Reset timetrial ranking every 6 hours
cron.schedule('0 */6 * * *', () => {
    resetTimetrialRanking(db);
})
