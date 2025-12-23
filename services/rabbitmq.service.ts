import amqplib, { type Connection, type Channel, type ConsumeMessage } from "amqplib";

class RabbitMQService {
    private connection: Connection | null = null;
    private channel: Channel | null = null;
    private connected: boolean = false;
    private readonly url = "amqp://guest:guest@localhost:5672";

    async connect() {
        if (this.connected && this.channel) return;

        try {
            console.log("RabbitMQ'ya bağlanılıyor...");
            this.connection = await amqplib.connect(this.url);

            this.connection.on("error", (err) => {
                console.error("RabbitMQ Bağlantı Hatası:", err);
                this.connected = false;
            });

            this.connection.on("close", () => {
                console.warn("RabbitMQ Bağlantısı Koptu!");
                this.connected = false;
            });

            this.channel = await this.connection.createChannel();
            this.connected = true;
            console.log(" RabbitMQ Connected");

        } catch (error) {
            console.error(" RabbitMQ bağlantı hatası:", error);
            setTimeout(() => this.connect(), 5000);
        }
    }

    async publishEvent(queue: string, payload: any) {
        if (!this.channel) {
            await this.connect();
        }

        try {
            await this.channel!.assertQueue(queue, { durable: true });

            const sent = this.channel!.sendToQueue(
                queue,
                Buffer.from(JSON.stringify(payload)),
                {
                    persistent: true,
                    contentType: 'application/json'
                }
            );

            if (sent) {
                console.log(` Mesaj gönderildi: ${queue}`, {
                    payload
                });
            } else {
                console.warn(` Channel buffer dolu: ${queue}`);
            }

        } catch (error) {
            console.error(` Mesaj gönderilemedi (${queue}):`, error);
            throw error;
        }
    }

    async consume(queue: string, onMessage: (msg: any) => Promise<void>) {
        if (!this.channel) await this.connect();

        await this.channel!.assertQueue(queue, { durable: true });
        this.channel!.prefetch(1);

        console.log(` Consumer dinliyor: ${queue}`);

        this.channel!.consume(queue, async (msg: ConsumeMessage | null) => {
            if (!msg) return;

            try {
                const data = JSON.parse(msg.content.toString());

                await onMessage(data);

                this.channel!.ack(msg);

            } catch (error) {
                console.error(" Mesaj işleme hatası:", error);

                const retryCount = msg.properties.headers?.['x-retry-count'] || 0;

                if (retryCount < 2) {
                    console.log(` Retry ${retryCount + 1}/2`);
                    this.channel!.nack(msg, false, true);
                } else {
                    console.error(` Max retry exceeded, dropping message`);
                    this.channel!.nack(msg, false, false);
                }
            }
        });
    }
}

export default new RabbitMQService();