const mysql = require('mysql');

config = {
    host: "bdd2.adkynet.com",
    user: "u2496_zEYPJAoc9H",
    password: "W3A+Kks!w=@7^NIZn0FhkCQy",
    database: "s2496_YoshiFamily",
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


