import { getIO } from "../lib/socket";

class SocketService {

    emitToUser(userId: number, event: string, data: any) {
        const io = getIO()
        io.to(`user:${userId}`).emit(event, data);
    }

    emitToAll(event: string, data: any) {
        const io = getIO()
        io.emit(event, data);
    }
    

    emitToJobSubscribers(jobId: number, event: string, data: any) {
        const io = getIO()
        io.to(`job:${jobId}`).emit(event, data);
    }

}

const socketService = new SocketService();
export default socketService;