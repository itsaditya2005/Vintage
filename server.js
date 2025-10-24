const express = require('express');
const app = express();
exports.jwt = require('jsonwebtoken');
const helmet = require('helmet');
exports.dotenv = require('dotenv').config();
exports.applicationkey = process.env.APPLICATION_KEY;
const port = process.env.PORT;
const hostname = process.env.HOST_NAME;
const logger = require("./utilities/logger");
const path = require('path');
const cors = require('cors');
const dbm = require('./utilities/dbMongo');

const http = require('http');
const server = http.createServer(app);
// const { Server } = require("socket.io");
// exports.io = new Server(server, {
//     cors: {
//         origin: ["http://localhost:4200", "http://127.0.0.1:4040"],
//         methods: ["GET", "POST"],
//     },
// });
// require("./mongoServices/orderChat").chat(this.io);

var fs = require('fs');
const globalRoutes = require('./routes/global');
var bodyParser = require('body-parser');

async function startApp() {
    try {
        await dbm.connectToDatabase();
        console.log("Database connection established.");
        // require("./mongoServices/orderChat").chat(exports.io);

        app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
        app.use(bodyParser.json({ limit: '50mb', extended: true }));
        app.use('/static', express.static(path.join(__dirname, 'Uploads')));
        app.use(cors());

        app.use('/', function timeLog(req, res, next) {
            // console.log("\n\n\n\n**********");
            console.log("\nRequested Method : -", req.method, req.url);
            console.log("\nRequested Body : -", req.body);
            // console.log("\n\n\n\n**********");
            next();
        });

        app.use(helmet());
        app.disable('x-powered-by');

        app.use('/', globalRoutes);
        require("./utilities/scheduler").schedulerJob()
        server.listen(port, hostname, () => {
            console.log('PockIT app listening on ', hostname, port, '!');
        });

    } catch (error) {
        console.error("Failed to connect to database:", error);
        process.exit(1);
    }
}



startApp();