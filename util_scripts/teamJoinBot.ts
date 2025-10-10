// teamJoinBot.ts
import { io, Socket } from "socket.io-client";
import readline from "readline";

interface BotInfo {
    player_id: string;
    name: string;
    email: string;
    socket: Socket;
}

const SERVER_URL = "http://localhost:3001"; // your socket server
let botCounter = 0;
const bots: BotInfo[] = [];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});

// Helper to return only serializable bot data
function botData(bot: BotInfo) {
    return {
        player_id: bot.player_id,
        name: bot.name,
        email: bot.email
    };
}

function spawnBot(linkOrId: string) {
    const inviteId = linkOrId.split('/').pop()!;
    const socket = io(SERVER_URL);

    const bot: BotInfo = {
        player_id: `bot_${botCounter}_${Date.now()}`,
        name: `Bot_${botCounter}`,
        email: `bot${botCounter}@example.com`,
        socket,
    };
    bots.push(bot);
    botCounter++;

    socket.on("connect", () => {
        console.log(`${bot.name} connected: ${socket.id}`);

        if (linkOrId.includes("/join/")) {
            socket.emit("joinTeamWithInvite", { invite_id: inviteId, player: botData(bot) });
            console.log(`${bot.name} trying to join team with invite ${inviteId}`);
        } else if (linkOrId.includes("/privateRoom/")) {
            socket.emit("joinPrivateRoom", { inviteId, player: botData(bot) });
            console.log(`${bot.name} trying to join private room ${inviteId}`);
        } else {
            console.warn("Unknown invite type. Defaulting to team join.");
            socket.emit("joinTeamWithInvite", { invite_id: inviteId, player: botData(bot) });
        }
    });

    socket.on("teamJoined", (teamData) => console.log(`${bot.name} joined team:`, teamData));
    socket.on("privateRoomJoined", (roomData) => console.log(`${bot.name} joined private room:`, roomData));
    socket.on("privateRoomDeleted", () => console.log(`${bot.name} left private room due to deletion.`));
    socket.on("teamLeft", (playerId) => console.log(`${playerId} left the team.`));
    socket.on("disconnect", () => console.log(`${bot.name} disconnected.`));
    socket.on("error", (err) => console.error(`${bot.name} error:`, err));
}

function clearBots() {
    if (bots.length > 0) {
        console.log(`Disconnecting ${bots.length} active bots...`);
        bots.forEach(bot => bot.socket.disconnect());
        bots.length = 0;
        console.log("All bots disconnected.");
    }
    console.clear();
    botCounter = 0;
    console.log("Console cleared. Bot counter reset.");
}

console.log("Type an invite link or ID to spawn a bot. Type 'clear' to remove all bots and reset.");

rl.on("line", (line) => {
    const input = line.trim();
    if (!input) return;

    if (input.toLowerCase() === "clear") {
        clearBots();
        return;
    }

    spawnBot(input);
});
