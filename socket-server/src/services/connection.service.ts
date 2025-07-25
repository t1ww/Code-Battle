import { Socket } from "socket.io";

interface ActiveConnection {
    socket_id: string;
    connected_at: Date;
}

export class ConnectionService {
    private activeConnections: Map<string, ActiveConnection> = new Map();

    handleConnect(socket: Socket): void {
        // ✅ UTC-14 ID 2: Invalid socket input
        if (!socket || typeof socket !== "object" || !("id" in socket)) {
            // Cannot call socket.emit if socket is invalid, so just return or throw
            console.error("Invalid Socket input");
            return;
        }

        // ✅ UTC-14 ID 3: Empty socket input
        if (!socket.id) {
            socket.emit("error", { error_message: "Socket input is required" });
            return;
        }

        // ✅ UTC-14 ID 1: Valid socket connection
        this.activeConnections.set(socket.id, {
            socket_id: socket.id,
            connected_at: new Date(),
        });

        console.log(`[CONNECT] ${socket.id} connected`);
    }

    handleDisconnect(socketId: string): void {
        // ✅ UTC-15 ID 3: Empty socket ID
        if (!socketId) {
            console.warn("[DISCONNECT] Empty socket ID");
            return;
        }

        // ✅ UTC-15 ID 2: Unknown socket ID
        if (!this.activeConnections.has(socketId)) {
            console.warn(`[DISCONNECT] Socket ID not found: ${socketId}`);
            return;
        }

        // ✅ UTC-15 ID 1: Valid socket ID
        this.activeConnections.delete(socketId);
        console.log(`[DISCONNECT] ${socketId} disconnected successfully`);
    }
}
