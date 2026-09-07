const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://localhost:1883");

client.on("connect", () => {
    console.log("Temperature Device connected to MQTT Broker");

    setInterval(() => {

        const temperature = (20 + Math.random() * 15).toFixed(2);

        client.publish(
            "home/room1/temperature",
            temperature
        );

        console.log(`Temperature sent: ${temperature}°C`);

    }, 2000);
});