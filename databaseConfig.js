const mysql = require('mysql');

config = {
    host: "localhost",
    user: "root",
    password: "",
    database: "yoshi_family_2",
    multipleStatements: true
}

const connection = mysql.createConnection(config);

connection.connect(function(err){
  if (err){
    console.log('error connecting:' + err.stack);
  }
  console.log('connected successfully to DB.');
});

module.exports = {
     connection : mysql.createConnection(config) 
} 


