import amqplib, { type Channel } from "amqplib"

let channel: Channel;

export const connectRabbit = async () => {
    try {
        const connection = await amqplib.connect({
            protocol: 'amqp',
            hostname: 'localhost',
            port: 5672,
            username: 'guest',
            password: 'guest',
            vhost: '/'
        });

        channel = await connection.createChannel()
        console.log("RabbitMQ connected");
    } catch (error) {
        console.log("RabbitMQ error: ", error);
    }
}

export const publishEvent = async (
    queue: string,
    payload: any
) => {
    if (!channel) {
        throw new Error("Rabbit channel not initialized")
    }

    await channel.assertQueue(queue, { durable: true })

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), { persistent: true })
}