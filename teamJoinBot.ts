// teamJoinBot.ts
import { io } from "socket.io-client";
import readline from "readline";

interface BotInfo {
    player_id: string;
    name: string;
    email: string;
}

const SERVER_URL = "http://localhost:3001"; // your socket server
let botCounter = 0;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});

function spawnBot(inviteId: string) {
    const bot: BotInfo = {
        player_id: `bot_${botCounter}_${Date.now()}`,
        name: `Bot_${botCounter}`,
        email: `bot${botCounter}@example.com`,
    };
    botCounter++;

    const socket = io(SERVER_URL);

    socket.on("connect", () => {
        console.log(`${bot.name} connected: ${socket.id}`);
        socket.emit("joinTeamWithInvite", { invite_id: inviteId, player: bot });
    });

    socket.on("teamJoined", (teamData) => {
        console.log(`${bot.name} joined team:`, teamData);
    });

    socket.on("teamLeft", (playerId) => {
        console.log(`${playerId} left the team`);
    });

    socket.on("disconnect", () => {
        console.log(`${bot.name} disconnected`);
    });

    socket.on("error", (err) => {
        console.error(`${bot.name} error:`, err);
    });
}

console.log("Type an invite link ID to spawn a bot and join that team.");
rl.on("line", (line) => {
    const input = line.trim();
    if (!input) return;

    // extract the last segment after '/' if a full URL is pasted
    const inviteId = input.split('/').pop()!;
    spawnBot(inviteId);
});

