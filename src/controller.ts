import * as mqtt from "async-mqtt";

// const BROKER_URL = "mqtt://test.mosquitto.org";
const BROKER_URL = "mqtt://127.0.0.1";

enum QoS {
  AT_MOST_ONCE,
  AT_LEAST_ONCE,
  EXACTLY_ONCE,
}

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
  private static QOS_TOPIC = "request/qos";
  private static DELAY_TOPIC = "request/delay";
  private static TOPICS = [Controller.QOS_TOPIC, Controller.DELAY_TOPIC];
  private client: mqtt.AsyncMqttClient;
  private publisher: Publisher;
  private qos: QoS = QoS.AT_MOST_ONCE;
  private delay: number = 200;

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
    if (topic === Controller.QOS_TOPIC) {
      const newQos = Number.parseInt(message.toString());
      if (Number.isNaN(newQos) || newQos < 0 || newQos > 3) {
        console.error(`Invalid QoS value: ${message.toString()} .`);
        return;
      }
      if (newQos === this.qos) return;
      this.qos = newQos;
      this.publisher.startPublish(this.qos, this.delay);
    } else if (topic === Controller.DELAY_TOPIC) {
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
  constructor(client: mqtt.AsyncMqttClient) {
    this.client = client;
  }

  public startPublish(qos: QoS, delay: number) {
    this.stopPublish();

    let counter = 0;
    console.log(`Start to publish counter with QoS: ${qos} and delay: ${delay}.`);
    this.setIntervalHandler = setInterval(() => {
      this.client.publish(`counter/${qos}/${delay}`, counter.toString(), {
        qos,
      });
      counter++;
    }, delay);
  }

  public stopPublish() {
    if (!this.setIntervalHandler) return;
    clearInterval(this.setIntervalHandler);
    this.setIntervalHandler = null;
  }
}

main();
