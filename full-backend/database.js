const mysql = require("mysql");

const sqlConnection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Th,hmur1",
    database: "projectcs"
});

sqlConnection.connect( (err) => {
    if(err){
        console.log("Connection Failed");
    } else {
        console.log("Connected");
    }
});

module.exports = sqlConnection;