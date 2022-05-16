import * as mqtt from "async-mqtt";
import { QoS, QOS_TOPIC, DELAY_TOPIC } from "./type";

// const BROKER_URL = "mqtt://test.mosquitto.org";
const BROKER_URL = "mqtt://127.0.0.1";

async function main() {
  try {
    const client = await mqtt.connectAsync(BROKER_URL);
    console.log(`Connected to ${BROKER_URL}.`);
    const controller = new Controller(client);
    controller.startControl();
  } catch (e) {
    console.log(e);
    process.exit();
  }
}

class Controller {
  private static TOPICS = [QOS_TOPIC, DELAY_TOPIC];
  private client: mqtt.AsyncMqttClient;
  private publisher: Publisher;
  private qos: QoS = QoS.AT_MOST_ONCE;
  private delay: number = 1000;

  constructor(client: mqtt.AsyncMqttClient) {
    this.client = client;
    this.publisher = new Publisher(client);
  }

  public startControl() {
    this.client.on("message", this.messageHandler.bind(this));
    this.client.subscribe(Controller.TOPICS);
  }

  public stopControl() {
    this.client.unsubscribe(Controller.TOPICS);
    this.client.off("message", this.messageHandler);
  }

  private messageHandler(topic: string, message: Buffer) {
    if (topic === QOS_TOPIC) {
      const newQos = Number.parseInt(message.toString());
      if (Number.isNaN(newQos) || newQos < 0 || newQos > 3) {
        console.error(`Invalid QoS value: ${message.toString()} .`);
        return;
      }
      if (newQos === this.qos) return;
      this.qos = newQos;
      this.publisher.startPublish(this.qos, this.delay);
    } else if (topic === DELAY_TOPIC) {
      const newDelay = Number.parseInt(message.toString());
      if (Number.isNaN(newDelay) || newDelay < 0) {
        console.error(`Invalid delay value: ${message.toString()} .`);
        return;
      }
      if (newDelay === this.delay) return;
      this.delay = newDelay;
      this.publisher.startPublish(this.qos, this.delay);
    }
  }
}

class Publisher {
  private client: mqtt.AsyncMqttClient;
  private setIntervalHandler: NodeJS.Timer | null = null;
  private stop0ms = false;
  constructor(client: mqtt.AsyncMqttClient) {
    this.client = client;
  }

  public startPublish(qos: QoS, delay: number) {
    this.stopPublish();

    let counter = 0;
    console.log(`Start to publish counter with QoS: ${qos} and delay: ${delay}.`);
    const publishFn = () => {
      this.client.publish(`counter/${qos}/${delay}`, counter.toString(), {
        qos,
      });
      counter++;
    };
    // Because the minimum gap of setInterval function is 1ms, I have to use a different mechanism.
    if (delay === 0) {
      this.stop0ms = false;
      const loop = () => {
        publishFn();
        setImmediate(() => {
          if (!this.stop0ms) loop();
        });
      };
      loop();
    } else this.setIntervalHandler = setInterval(publishFn, delay);
  }

  public stopPublish() {
    if (!this.setIntervalHandler) return;
    clearInterval(this.setIntervalHandler);
    this.setIntervalHandler = null;
    if (!this.stop0ms) this.stop0ms = true;
  }
}

main();
