const mqtt = require("mqtt");
const WebSocket = require("ws");
const { sql, poolPromise } = require("./database");
const http = require("http");

// MQTT Broker se connect
const mqttClient = mqtt.connect("mqtt://localhost:1883");

// WebSocket Server
const wss = new WebSocket.Server({
    port: 8080
});


const httpServer = http.createServer(async (req, res) => {

    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // OPTIONS request handle karo
    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === "/temperature-history" && req.method === "GET") {

        try {

            const pool = await poolPromise;

            const result = await pool.request()
                .query(`
                    SELECT TOP 50
                        Id,
                        Temperature,
                        RecordedAt
                    FROM TemperatureReadings
                    ORDER BY Id DESC
                `);

            res.writeHead(200, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            });

            res.end(JSON.stringify(result.recordset));

        }
        catch (error) {

            console.log("Failed to get temperature history");
            console.log(error);

            res.writeHead(500, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            });

            res.end(JSON.stringify({
                error: "Failed to get temperature history"
            }));
        }

        return;
    }

    res.writeHead(404, {
        "Access-Control-Allow-Origin": "*"
    });

    res.end("Not Found");
});

httpServer.listen(3000, () => {
    console.log("HTTP Server started on port 3000");
});

console.log("WebSocket Server started on port 8080");


// MQTT Broker se connection
mqttClient.on("connect", () => {

    console.log("Node.js connected to MQTT Broker");

    mqttClient.subscribe("home/room1/temperature", (err) => {

        if (!err) {
            console.log("Subscribed to temperature topic");
        }

    });

});


// MQTT se message receive
mqttClient.on("message", async (topic, message) => {

    const temperature = parseFloat(message.toString());

    console.log(`MQTT Temperature: ${temperature}°C`);

    try {

        // SQL Server me temperature save karo
        const pool = await poolPromise;

        await pool.request()
            .input("Temperature", sql.Decimal(5, 2), temperature)
            .query(`
                INSERT INTO TemperatureReadings
                (Temperature, RecordedAt)
                VALUES
                (@Temperature, GETDATE())
            `);

        console.log("Temperature saved to SQL Server");


        // Last 50 readings nikalo
        const result = await pool.request()
            .query(`
                SELECT TOP 50
                    Id,
                    Temperature,
                    RecordedAt
                FROM TemperatureReadings
                ORDER BY Id DESC
            `);

        const history = result.recordset;


        // Temperatures nikalo
        const temperatures = history.map(
            reading => Number(reading.Temperature)
        );


        // Highest aur Lowest
        const highest = Math.max(...temperatures);
        const lowest = Math.min(...temperatures);


        // Browser ko complete data bhejo
        const dashboardData = {
            type: "temperature",
            temperature: temperature,
            highest: highest,
            lowest: lowest,
            history: history
        };


        wss.clients.forEach((client) => {

            if (client.readyState === WebSocket.OPEN) {

                client.send(
                    JSON.stringify(dashboardData)
                );

            }

        });

    }
    catch (error) {

        console.log("Failed to process temperature");
        console.log(error);

    }

});


// Browser WebSocket connection
wss.on("connection", (socket) => {

    console.log("Browser connected");

    socket.on("close", () => {

        console.log("Browser disconnected");

    });

});