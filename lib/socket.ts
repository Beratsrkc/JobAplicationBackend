import { Server } from "socket.io"

let io: Server;

export const initSocket = (server: any) => {
    io = new Server(server, {
        cors: { origin: "*" }
    })

    io.on("connection", (socket) => {
        socket.on("joinUserRoom", (userId) => {
            socket.join(`user:${userId}`);
        });
    });
    return io;
}


export const getIO = () => {
    if (!io) throw new Error("Socket init edilmemiş");
    return io;
};