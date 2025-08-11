import type { Socket } from "socket.io";

export type MatchMode = "1v1" | "3v3";

export interface QueuePlayerData {
    player_id: string;
    name: string;
    email: string;
}

export interface QueuePlayerData1v1 {
    player: QueuePlayerData;
    timeLimit: boolean;
}

export interface QueuePlayerData3v3 {
    team_id: string;
    players: QueuePlayerData[];
    timeLimit: boolean;
}

export type QueuePlayerDataAny = QueuePlayerData1v1 | QueuePlayerData3v3;

export interface PlayerSession extends QueuePlayerData {
    socket: Socket;
}
export interface Team {
    team_id: string;
    players: PlayerSession[]; // exactly 3 players for 3v3
}