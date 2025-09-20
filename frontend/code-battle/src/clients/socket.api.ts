// frontend\code-battle\src\clients\socket.api.ts
import { io, Socket } from "socket.io-client"

const URL = import.meta.env.VITE_SOCKET_URL
export const socket: Socket = io(URL, {
    autoConnect: false
})
