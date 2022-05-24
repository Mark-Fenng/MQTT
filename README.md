### Environment
OS: macOS Monterey version 12.31
Hardware: Macbook Pro with Apple M1 Max chip
Memory: 32GB
Nodejs: v16.15.0
IDE: VSCode Version: 1.67.2

### How to setup
1. Make sure the local environment has installed a [nodejs](https://nodejs.org/en/). The recommended version is 16.15.0 LTS.
2. Execute `npm install` under the project's root folder.

### How to run the project
1. Open a local MQTT broker or setup a cloud MQTT broker.
2. Change the constant value `BROKER_URL` in the file [controller.ts](./src/controller.ts) and [analyzer.ts](./src/analyzer.ts) with your configured broker address.
3. Start a controller with the command `npm run controller`. If there is a message `"Connected to mqtt://********"`, then the controller can start to work.
4. Start an analyzer with the command `npm run analyzer`. If there is a message `"Connected to mqtt://********"`, then the analyzer can start to work.

### Sample Running Results
#### controller
```shell
➜  MQTT git:(master) ✗ npm run controller

> mqtt@1.0.0 controller
> ts-node ./src/controller.ts

Connected to mqtt://127.0.0.1.
Start to publish counter with QoS: 0 and delay: 0.
Start to publish counter with QoS: 0 and delay: 1.
Start to publish counter with QoS: 0 and delay: 2.
Start to publish counter with QoS: 0 and delay: 10.
Start to publish counter with QoS: 0 and delay: 20.
Start to publish counter with QoS: 0 and delay: 100.
Start to publish counter with QoS: 0 and delay: 200.
Start to publish counter with QoS: 1 and delay: 200.
Start to publish counter with QoS: 1 and delay: 0.
Start to publish counter with QoS: 1 and delay: 1.
Start to publish counter with QoS: 1 and delay: 2.
Start to publish counter with QoS: 1 and delay: 10.
Start to publish counter with QoS: 1 and delay: 20.
Start to publish counter with QoS: 1 and delay: 100.
Start to publish counter with QoS: 1 and delay: 200.
Start to publish counter with QoS: 2 and delay: 200.
Start to publish counter with QoS: 2 and delay: 0.
Start to publish counter with QoS: 2 and delay: 1.
Start to publish counter with QoS: 2 and delay: 2.
Start to publish counter with QoS: 2 and delay: 10.
Start to publish counter with QoS: 2 and delay: 20.
Start to publish counter with QoS: 2 and delay: 100.
Start to publish counter with QoS: 2 and delay: 200.
```

#### analyzer
```shell
➜  MQTT git:(master) ✗ npm run analyzer

> mqtt@1.0.0 analyzer
> ts-node ./src/analyzer.ts

Connected to mqtt://127.0.0.1.
Start to analyze with QoS: 0 and delay: 0.
{
  MessageRate: 38036.66666666667,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 0,
  GapAverage: 0.02624775426142588
}
Start to analyze with QoS: 0 and delay: 1.
{
  MessageRate: 1000,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 1,
  GapAverage: 1
}
Start to analyze with QoS: 0 and delay: 2.
{
  MessageRate: 435,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 2,
  GapAverage: 2.3038461538461537
}
Start to analyze with QoS: 0 and delay: 10.
{
  MessageRate: 91.66666666666667,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 11,
  GapAverage: 10.944444444444445
}
Start to analyze with QoS: 0 and delay: 20.
{
  MessageRate: 48.333333333333336,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 21,
  GapAverage: 20.678571428571427
}
Start to analyze with QoS: 0 and delay: 100.
{
  MessageRate: 10,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 101,
  GapAverage: 100.8
}
Start to analyze with QoS: 0 and delay: 200.
{
  MessageRate: 5,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 201,
  GapAverage: 201
}
Start to analyze with QoS: 1 and delay: 0.
{
  MessageRate: 42755,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 0,
  GapAverage: 0.02335100576953064
}
Start to analyze with QoS: 1 and delay: 1.
{
  MessageRate: 1000,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 1,
  GapAverage: 1
}
Start to analyze with QoS: 1 and delay: 2.
{
  MessageRate: 446.6666666666667,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 2,
  GapAverage: 2.2397003745318353
}
Start to analyze with QoS: 1 and delay: 10.
{
  MessageRate: 91.66666666666667,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 11,
  GapAverage: 10.962962962962964
}
Start to analyze with QoS: 1 and delay: 20.
{
  MessageRate: 48.333333333333336,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 21,
  GapAverage: 20.714285714285715
}
Start to analyze with QoS: 1 and delay: 100.
{
  MessageRate: 10,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 101,
  GapAverage: 100.4
}
Start to analyze with QoS: 1 and delay: 200.
{
  MessageRate: 5,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 201,
  GapAverage: 201
}
Start to analyze with QoS: 2 and delay: 0.
{
  MessageRate: 53720,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 0,
  GapAverage: 0.01858459247308492
}
Start to analyze with QoS: 2 and delay: 1.
{
  MessageRate: 1011.6666666666667,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 1,
  GapAverage: 0.9884488448844885
}
Start to analyze with QoS: 2 and delay: 2.
{
  MessageRate: 443.33333333333337,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 2,
  GapAverage: 2.2566037735849056
}
Start to analyze with QoS: 2 and delay: 10.
{
  MessageRate: 93.33333333333334,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 11,
  GapAverage: 10.89090909090909
}
Start to analyze with QoS: 2 and delay: 20.
{
  MessageRate: 48.333333333333336,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 21,
  GapAverage: 20.928571428571427
}
Start to analyze with QoS: 2 and delay: 100.
{
  MessageRate: 10,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 101,
  GapAverage: 101.2
}
Start to analyze with QoS: 2 and delay: 200.
{
  MessageRate: 5,
  LossRate: '0%',
  OutOfOrderRate: '0%',
  GapMedian: 201.5,
  GapAverage: 201.5
}
```