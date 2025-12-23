import express from "express";
import "dotenv/config";
import cors from "cors"

import { connectRedis } from "./lib/redis";
import { initSocket } from "./lib/socket";

import authRouter from "./router/authRoutes"
import adminRouter from "./router/adminRoutes"
import profileRouter from "./router/profileRoutes"
import companyRouter from "./router/companyRoutes"
import jobRouter from "./router/jobRoutes"
import applicationRouter from "./router/applicationRoutes"
import rabbitMQ from "./services/rabbitmq.service";

const app = express()
const PORT = process.env.PORT || 5000

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json())

app.use("/user", authRouter)
app.use("/admin", adminRouter)
app.use("/profile", profileRouter)
app.use("/company", companyRouter)
app.use("/job", jobRouter)
app.use("/application", applicationRouter)




const startServer = async () => {
  await rabbitMQ.connect();

  const server = app.listen(PORT, async () => {
    console.log("API server running on ", PORT);
    connectRedis();
    initSocket(server);
  });
};

startServer();