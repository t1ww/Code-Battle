// socket-server/src/types.ts
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
    timeLimit: boolean;
}

export type QueuePlayerDataAny = QueuePlayerData1v1 | QueuePlayerData3v3;

export interface PlayerSession extends QueuePlayerData {
    socket: Socket;
    connectionQuality?: number; // e.g. ping in ms or a score 0–100
    joinedQueueAt?: number; // timestamp when queued
    queueTimeoutId?: NodeJS.Timeout;
}
export interface Team {
    team_id: string;
    players: PlayerSession[]; // exactly 3 players for 3v3
    queueTimeoutId?: NodeJS.Timeout;
}

// Sharing services
import { ConnectionService } from "@/services/connection.service";
import { MatchmakingService } from "@/services/matchmaking.service";
import { TeamService } from "@/services/team.service";
import { TeamInviteService } from "@/services/team.invite.service";
import { PrivateRoomService } from "@/services/privateRoom.service";
import { PrivateRoomInviteService } from "@/services/privateRoom.invite.service";
import { TerminalService } from "@/services/terminal.service";

export interface Services {
    connectionService: ConnectionService;
    matchmakingService: MatchmakingService;
    teamService: TeamService;
    teamInviteService: TeamInviteService;
    privateRoomService: PrivateRoomService;
    privateRoomInviteService: PrivateRoomInviteService;
    terminalService: TerminalService;
}
