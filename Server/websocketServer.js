const mqtt = require("mqtt");
const WebSocket = require("ws");

// MQTT Broker se connect
const mqttClient = mqtt.connect("mqtt://localhost:1883");

// WebSocket Server
const wss = new WebSocket.Server({
    port: 8080
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
mqttClient.on("message", (topic, message) => {

    const temperature = message.toString();

    console.log(`MQTT Temperature: ${temperature}°C`);

    // Connected browsers ko temperature bhejo
    wss.clients.forEach((client) => {

        if (client.readyState === WebSocket.OPEN) {

            client.send(temperature);

        }

    });

});


// Browser WebSocket connection
wss.on("connection", (socket) => {

    console.log("Browser connected");

    socket.on("close", () => {

        console.log("Browser disconnected");

    });

});