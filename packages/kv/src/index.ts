import Redis from "ioredis";

console.log("REDIS_URL", process.env.REDIS_URL);
const kv = new Redis(process.env.REDIS_URL!);

export default kv;
