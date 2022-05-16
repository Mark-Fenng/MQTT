import * as mqtt from "async-mqtt";
import * as fs from "fs";
import * as path from "path";
import { QoS, QOS_TOPIC, DELAY_TOPIC, BROKER_SYS_TOPIC } from "./type";

// const BROKER_URL = "mqtt://test.mosquitto.org";
const BROKER_URL = "mqtt://127.0.0.1";

async function main() {
  try {
    const client = await mqtt.connectAsync(BROKER_URL);
    console.log(`Connected to ${BROKER_URL}.`);
    const analyzer = new Analyzer(client, 2);
    for (const qos of [QoS.AT_MOST_ONCE, QoS.AT_LEAST_ONCE, QoS.EXACTLY_ONCE]) {
      for (const delay of [0, 1, 2, 10, 20, 100, 200]) {
        console.log(`Start to analyze with QoS: ${qos} and delay: ${delay}.`);
        const result = await analyzer.analyze(qos, delay);
        console.log(result);
      }
    }
    await client.end();
  } catch (e) {
    console.log(e);
    process.exit();
  }
}

type AnalysisResult = {
  MessageRate: number;
  LossRate: number;
  OutOfOrderRate: number;
  GapMedian: number;
  GapAverage: number;
};
class Analyzer {
  // Default measurement period is 2mins.
  private MeasurementPeriod = 2; // unit: minute
  private readonly MSPerMinute = 60 * 1000;
  private client: mqtt.AsyncMqttClient;
  // an array of tuples. The tuple[0] indicates the received number and tuple[1] indicates the timestamp when the number received.
  private record: [number, number][] = [];
  private systemLog: string = "";
  private startTime: number | null = null;
  private qos: QoS = QoS.AT_LEAST_ONCE;
  private delay: number = 1000;
  constructor(client: mqtt.AsyncMqttClient, measurePeriod?: number) {
    this.client = client;
    if (measurePeriod) this.MeasurementPeriod = measurePeriod;
  }

  public analyze(qos: QoS, delay: number): Promise<AnalysisResult> {
    return new Promise(async (resolve, reject) => {
      if (this.startTime != null) reject("One analysis process is working.");
      this.qos = qos;
      this.delay = delay;
      const TargetTopic = `counter/${qos}/${delay}`;
      const onMessageHandler = (topic: string, message: Buffer) => {
        if (topic === TargetTopic) {
          if (this.startTime === null) this.startTime = Date.now();
          const num = Number.parseInt(message.toString());
          const timestamp = Date.now() - this.startTime;
          if (timestamp < this.MeasurementPeriod * this.MSPerMinute) {
            this.record.push([num, Date.now() - this.startTime]);
          } else {
            this.startTime = null;
            this.client.off("message", onMessageHandler);
            this.client.unsubscribe(TargetTopic);
            this.client.unsubscribe(BROKER_SYS_TOPIC);
            const result = this.getStatistics();
            this.saveRecordData();
            this.record = [];
            this.systemLog = "";
            resolve(result);
          }
        } else {
          if (this.startTime !== null) this.systemLog += `${Date.now() - this.startTime}, ${topic}, ${message.toString()}\n`;
        }
      };
      await this.client.on("message", onMessageHandler);
      await this.client.subscribe(TargetTopic, {
        qos,
      });
      await this.client.subscribe(BROKER_SYS_TOPIC, { qos });
      await Promise.all([this.client.publish(QOS_TOPIC, qos.toString(), { qos }), this.client.publish(DELAY_TOPIC, delay.toString(), { qos })]);
    });
  }

  private saveRecordData() {
    const targetDir = path.resolve(__dirname, `../record`);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir);
    fs.writeFileSync(`${targetDir}/${this.qos}-${this.delay}.csv`, this.record.map((r) => r.join(", ")).join("\n"));
    fs.writeFileSync(`${targetDir}/${this.qos}-${this.delay}-system.log`, this.systemLog);
  }

  private getStatistics(): AnalysisResult {
    this.record.sort((a, b) => a[0] - b[0]);
    const targetNums = this.delay ? (this.MSPerMinute * this.MeasurementPeriod) / this.delay : this.record.length;
    let outOrderNums = 0;
    let gap = [];
    for (let i = 0; i < this.record.length - 1; i++) {
      if (this.record[i][1] > this.record[i + 1][1]) outOrderNums++;
      else if (this.record[i + 1][0] - this.record[i][0] === 1) {
        gap.push(this.record[i + 1][1] - this.record[i][1]);
      }
    }
    const median = (arr: number[]) => {
      let middle = Math.floor(arr.length / 2);
      arr.sort((a, b) => a - b);
      return arr.length % 2 !== 0 ? arr[middle] : (arr[middle - 1] + arr[middle]) / 2;
    };
    const sum = gap.reduce((a, b) => a + b, 0);
    return {
      MessageRate: this.record.length / this.MeasurementPeriod,
      LossRate: 1 - this.record.length / targetNums,
      OutOfOrderRate: outOrderNums / this.record.length,
      GapMedian: median(gap),
      GapAverage: sum / gap.length || 0,
    };
  }
}

main();
