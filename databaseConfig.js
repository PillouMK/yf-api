const mysql = require('mysql');
require('dotenv').config();

config = {
    host: `${process.env.database_host}`,
    user: `${process.env.database_user}`,
    password: `${process.env.database_password}`,
    database: `${process.env.database_name}`,
    multipleStatements: true
}

const connection = mysql.createPool(config);


connection.getConnection((err, connexion) => {
  if (err){
    console.log('error connecting:' + err.stack);
  }
  console.log('connected successfully to DB.');
  connexion.release();
});


module.exports = {
     connection : mysql.createPool(config) 
} 


