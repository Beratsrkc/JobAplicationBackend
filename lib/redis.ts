import { createClient } from "redis";

if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL tanımlı değil");
}
export const redis = createClient({
    url: process.env.REDIS_URL,
})

redis.on("error", (err) => {
    console.log("Redis Client Error", err);
})

export const connectRedis = async () => {
    await redis.connect()
    console.log("Redis bağlantısı başarılı");
}