import * as mqtt from "async-mqtt";

const BROKER_URL = "mqtt://test.mosquitto.org";

async function main() {
  const client = await mqtt.connectAsync(BROKER_URL);

  console.log(`Connected to ${BROKER_URL}`);
  try {
    client.on("message", (topic, message) => {
      console.log(topic, message.toString());
    });
    await client.subscribe("presence");
    await client.publish("presence", "It works!");
  } catch (e) {
    console.log(e);
    process.exit();
  }
  await client.end();
  console.log("Disconnected");
}

main();
