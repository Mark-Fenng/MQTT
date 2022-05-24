import * as mqtt from "async-mqtt";
import * as fs from "fs";
import * as path from "path";
import { QoS, QOS_TOPIC, DELAY_TOPIC, BROKER_SYS_TOPIC, USER_NAME, PASSWORD } from "./type";

const BROKER_URL = "mqtt://127.0.0.1";

async function main() {
  try {
    const client = await mqtt.connectAsync(BROKER_URL, { username: USER_NAME, password: PASSWORD });
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
  // analysisFromRecords();
}

type AnalysisResult = {
  MessageRate: number; // messages received per second
  LossRate: string; // message loss rate
  OutOfOrderRate: string; // the rate of any out-of-order messages
  GapMedian: number; // median value of inter-message-gap
  GapAverage: number; // average value of inter-message-gap
};

class Analyzer {
  // Default measurement period is 2mins.
  private MeasurementPeriod = 2; // unit: minute
  private readonly MSPerMinute = 60 * 1000;
  private client?: mqtt.AsyncMqttClient;
  // an array of tuples. The tuple[0] indicates the received number and tuple[1] indicates the timestamp when the number received.
  private record: [number, number][] = [];
  private systemLog: string = "";
  private startTime: number | null = null;
  private qos: QoS = QoS.AT_LEAST_ONCE;
  private delay: number = 1000;

  /**
   *
   * @param client give a MQTT client
   * @param measurePeriod the length of the measurement period (unit: minute)
   */
  constructor(client?: mqtt.AsyncMqttClient, measurePeriod?: number) {
    this.client = client;
    if (measurePeriod) this.MeasurementPeriod = measurePeriod;
  }

  public setQoS(qos: QoS) {
    this.qos = qos;
  }

  public setDelay(delay: number) {
    this.delay = delay;
  }

  /**
   * Analyze with specific QoS level and delay value
   */
  public analyze(qos: QoS, delay: number): Promise<AnalysisResult> {
    return new Promise(async (resolve, reject) => {
      if (this.client === undefined) reject("MQTT client is not specified.");
      if (this.startTime != null) reject("One analysis process is working.");
      this.qos = qos;
      this.delay = delay;
      const TargetTopic = `counter/${qos}/${delay}`;
      const onMessageHandler = (topic: string, message: Buffer) => {
        if (topic === TargetTopic) {
          if (this.client === undefined) reject("MQTT client is not specified.");
          if (this.startTime === null) this.startTime = Date.now();
          const num = Number.parseInt(message.toString());
          const timestamp = Date.now() - this.startTime;
          if (timestamp < this.MeasurementPeriod * this.MSPerMinute) {
            this.record.push([num, Date.now() - this.startTime]);
          } else {
            this.startTime = null;
            this.client!.off("message", onMessageHandler);
            this.client!.unsubscribe(TargetTopic);
            this.client!.unsubscribe(BROKER_SYS_TOPIC);
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
      await this.client!.on("message", onMessageHandler);
      await this.client!.subscribe(TargetTopic, {
        qos,
      });
      await this.client!.subscribe(BROKER_SYS_TOPIC, { qos });
      await Promise.all([this.client!.publish(QOS_TOPIC, qos.toString(), { qos }), this.client!.publish(DELAY_TOPIC, delay.toString(), { qos })]);
    });
  }

  private saveRecordData() {
    const targetDir = path.resolve(__dirname, `../record`);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir);
    fs.writeFileSync(`${targetDir}/${this.qos}-${this.delay}.csv`, this.record.map((r) => r.join(", ")).join("\n"));
    fs.writeFileSync(`${targetDir}/${this.qos}-${this.delay}-system.log`, this.systemLog);
  }

  public readRecordData(path: string) {
    if (!fs.existsSync(path)) throw new Error(`Can't find the file: ${path}.`);
    const fileContent = fs.readFileSync(path).toString();
    const lines = fileContent.split("\n");
    this.record = [];
    lines.forEach((line) => {
      const nums = line.split(",");
      this.record.push([Number.parseInt(nums[0]), Number.parseInt(nums[1])]);
    });
  }

  public getStatistics(): AnalysisResult {
    this.record.sort((a, b) => a[0] - b[0]);
    let outOrderNums = 0;
    let gap = [];
    let lossCount = 0;
    for (let i = 0; i < this.record.length - 1; i++) {
      if (this.record[i][1] > this.record[i + 1][1]) outOrderNums++;
      else if (this.record[i + 1][0] - this.record[i][0] === 1) {
        gap.push(this.record[i + 1][1] - this.record[i][1]);
      } else {
        lossCount += this.record[i + 1][0] - this.record[i][0] - 1;
      }
    }
    const median = (arr: number[]) => {
      let middle = Math.floor(arr.length / 2);
      arr.sort((a, b) => a - b);
      return arr.length % 2 !== 0 ? arr[middle] : (arr[middle - 1] + arr[middle]) / 2;
    };
    const sum = gap.reduce((a, b) => a + b, 0);
    return {
      MessageRate: this.record.length / (this.MeasurementPeriod * 60),
      LossRate: `${(lossCount / this.record[this.record.length - 1][0]) * 100}%`,
      OutOfOrderRate: `${(outOrderNums / this.record.length) * 100}%`,
      GapMedian: median(gap),
      GapAverage: sum / gap.length || 0,
    };
  }
}

/**
 * Load data from files and analyze from it.
 */
function analysisFromRecords() {
  const analyzer = new Analyzer(undefined, 2);
  for (const qos of [QoS.AT_MOST_ONCE, QoS.AT_LEAST_ONCE, QoS.EXACTLY_ONCE]) {
    for (const delay of [0, 1, 2, 10, 20, 100, 200]) {
      console.log(`Start to analyze with QoS: ${qos} and delay: ${delay}.`);
      const targetDir = path.resolve(__dirname, `../record`);
      analyzer.setQoS(qos);
      analyzer.setDelay(delay);
      analyzer.readRecordData(`${targetDir}/${qos}-${delay}.csv`);
      console.log(analyzer.getStatistics());
    }
  }
}

main();
