export enum QoS {
  AT_MOST_ONCE,
  AT_LEAST_ONCE,
  EXACTLY_ONCE,
}
export const QOS_TOPIC = "request/qos";
export const DELAY_TOPIC = "request/delay";
export const BROKER_SYS_TOPIC = "$SYS/#";
