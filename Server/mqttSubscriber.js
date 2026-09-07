const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://localhost:1883");

client.on("connect", () => {

    console.log("Subscriber connected to MQTT Broker");

    client.subscribe("home/room1/temperature", (err) => {

        if (!err) {
            console.log("Subscribed to temperature topic");
        }

    });

});

client.on("message", (topic, message) => {

    console.log(`Topic: ${topic}`);
    console.log(`Temperature received: ${message.toString()}°C`);

});