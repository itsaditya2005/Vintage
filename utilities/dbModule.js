
var mysql = require('mysql2');

var counter = 0;
var poolConfig = {
   host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    // timezone: 'IST',
    multipleStatements: true,
    charset: 'utf8mb4',
    dateStrings: true,
    port: process.env.MYSQL_PORT
}

var pool = mysql.createPool(poolConfig);
pool.on('connection', function (connection) {
    connection.on('error', function (error) {
        console.error(new Date(), 'MySQL error', error.code);
    });
    connection.on('close', function (error) {
        console.error(new Date(), 'MySQL close', error);
    });
});



exports.openConnection = () => {
    var connection = mysql.createConnection(poolConfig);
    counter += 1;

    connection.connect();
    connection.beginTransaction((error) => {
        if (error)
            console.log("Transaction error : ", error);
    });

    return connection;
}



exports.closeConnection = (connection) => {
    try {
        connection.release();
    } catch (error) {
    }
}



exports.getDB = () => {

    var connection = mysql.createConnection(poolConfig);
    counter += 1;
    connection.connect();

    console.log("counter : " + counter);
    return connection;
}



exports.executeDDL = (query, supportKey, callback) => {
    var con = this.openConnection();
    try {
        con.query(query, callback);
    } catch (error) {
        console.log("Error : -" + error)
    }
    finally {
        con.end();
    }
}


exports.executeDQL = (query, supportKey, callback) => {
    try {
        var connection = mysql.createConnection(poolConfig);
        counter += 1;

        connection.connect();
        console.log(query);
        connection.query(query, callback);
    } catch (error) {
        console.log("Error : -" + error)
    }
    finally {
        connection.end();
    }
}


exports.executeDML = (query, values, supportKey, con, callback) => {
    try {
        console.log(query, values);
        con.query(query, values, callback);
    } catch (error) {
        console.log("Error : -" + error)
        callback(error, null)
    }
    finally { }
}


exports.executeDMLPromise = (query, values, supportKey, con) => {
    try {

        return new Promise((resolve) => {
            con.query(query, values, function (err, rows, fields) {
                if (err) {
                    console.log(err)
                    resolve("ERROR");
                }
                console.log(query, values, rows)
                resolve(rows);
            });
        })
    } catch (error) {
        console.log("Error : -" + error);
        return '';
    }

}


exports.executeDMLPromise = (query, values, supportKey) => {
    try {

        return new Promise((resolve) => {
            pool.query(query, values, function (err, rows, fields) {
                if (err) {
                    console.log(err)
                    resolve("ERROR");
                }
                console.log(query, values, rows)
                resolve(rows);
            });
        })
    } catch (error) {
        console.log("Error : -" + error);
        return '';
    }

}

exports.rollbackConnection = (connection) => {
    try {
        connection.rollback(function () {

            connection.end();
        });
    } catch (error) {
    }
}

exports.commitConnection = (connection) => {
    try {

        connection.commit(function () {
            connection.end();
        });
    } catch (error) {
    }
}
