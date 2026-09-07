const sql = require("mssql/msnodesqlv8");

const config = {
    server: "localhost",
    port: 1433,
    database: "IoTTemperatureDB",

    driver: "ODBC Driver 17 for SQL Server",

    options: {
        trustedConnection: true,
        trustServerCertificate: true
    }
};

const poolPromise = sql.connect(config)
    .then(pool => {
        console.log("Connected to SQL Server");
        return pool;
    })
    .catch(error => {
        console.log("Database connection failed");
        console.log(error);
    });

module.exports = {
    sql,
    poolPromise
};