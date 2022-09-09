const mysql = require('mysql')
const config = require('../configuration')

const connection = mysql.createPool({
    host: config.HOST,
    socketPath: config.SOCKET,
    port: config.PORT,
    user: config.DBUSER,
    password: config.DBPASSWORD,
    database: config.DBNAME
})

// connection.connect((error) => {
//     if(error) {
//         return console.log('[DB] Database connection error');
//     } else {
//         return console.log('[DB] Connection successfully');
//     }
// })

module.exports = connection