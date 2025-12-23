import "dotenv/config";
import rabbitMQ from "../services/rabbitmq.service";
import { fileURLToPath } from 'url';
import path from 'path';
import { getConsumerRedis } from "../lib/redisConsumer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const startConsumer = async () => {
    console.log(" Application Consumer başlatılıyor...");

    const redis = await getConsumerRedis();

    await rabbitMQ.connect();


    await rabbitMQ.consume("cache.invalidate", async (data) => {
        console.log(` Cache invalidate: ${data.reason || 'unknown'}`);

        try {
            if (data.keys && Array.isArray(data.keys)) {
                const deleted = await redis.del(data.keys);
                console.log(` ${deleted} keys invalidated (reason: ${data.reason})`);
            }
        } catch (error) {
            console.error(` Error:`, error);
            throw error;
        }
    });

    await rabbitMQ.consume("job.create", async (data) => {
        console.log(` Job created: ${data.jobId}`);

        try {
            if (data.keys && Array.isArray(data.keys)) {
                const deleted = await redis.del(data.keys);
                console.log(`${deleted} keys cleared for job ${data.jobId}`);
            }
        } catch (error) {
            console.error(` Error:`, error);
            throw error;
        }
    });
    await rabbitMQ.consume("job.delete", async (data) => {
        console.log(` Job deleted: ${data.jobId}`);

        try {
            await redis.flushDb();
            console.log(" REDIS COMPLETELY CLEARED");
        } catch (error) {
            console.error("Redis flush error:", error);
            throw error;
        }
    });

    console.log(" Consumer başlatıldı ve dinliyor...");
};

const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
    startConsumer().catch(err => {
        console.error(" Consumer başlatılamadı:", err);
        process.exit(1);
    });
}

export { startConsumer };