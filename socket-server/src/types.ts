import type { Socket } from "socket.io";

export interface QueuedPlayer {
    player_id: string;
    socket: Socket;
}

export interface Team {
    team_id: string;
    players: QueuedPlayer[]; // must be exactly 3 players for 3v3 mode
}

export type MatchMode = "1v1" | "3v3";

export interface QueuePlayerData1v1 {
    mode: "1v1";
    player_id: string;
}

export interface QueuePlayerData3v3 {
    mode: "3v3";
    team_id: string;
    players: { player_id: string }[]; // socket will be attached server-side
}

export type QueuePlayerData = QueuePlayerData1v1 | QueuePlayerData3v3;
