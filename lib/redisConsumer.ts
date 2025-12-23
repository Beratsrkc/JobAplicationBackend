import { createClient } from "redis";
import "dotenv/config";

export const createConsumerRedis = () => {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    
    const redis = createClient({
        url: redisUrl,
        socket: {
            reconnectStrategy: (retries) => {
                console.log(` Redis reconnecting (attempt ${retries})`);
                if (retries > 5) {
                    console.error(" Redis max retries exceeded");
                    return new Error("Max retries exceeded");
                }
                return Math.min(retries * 500, 5000);
            }
        }
    });

    redis.on("error", (err) => {
        console.error(" Consumer Redis Error:", err.message);
    });

    redis.on("connect", () => {
        console.log(" Consumer Redis connected");
    });

    redis.on("ready", () => {
        console.log(" Consumer Redis ready");
    });

    redis.on("end", () => {
        console.log(" Consumer Redis disconnected");
    });

    return redis;
};

export const getConsumerRedis = async () => {
    const redis = createConsumerRedis();
    await redis.connect();
    return redis;
};