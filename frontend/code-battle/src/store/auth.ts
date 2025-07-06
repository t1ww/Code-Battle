import { ref } from "vue";
import { useRouter } from "vue-router";
import type { PlayerData } from "@/types/types";

export const isAuthenticated = ref(!!localStorage.getItem("player_token"));

export function getPlayerData(): PlayerData | null {
  const token = localStorage.getItem("player_token");
  if (!token) return null;

  return {
    token,
    id: localStorage.getItem("player_id"),
    name: localStorage.getItem("player_name"),
    email: localStorage.getItem("player_email"),
  };
}

export function loginPlayer(player: {
  token: string;
  id: string;
  name: string;
  email: string;
  role: string;
}) {
  localStorage.setItem("player_token", player.token);
  localStorage.setItem("player_id", player.id);
  localStorage.setItem("player_name", player.name);
  localStorage.setItem("player_email", player.email);
  isAuthenticated.value = true;

  console.log("Logged in player data:", player);
}

export function logoutPlayer() {
  localStorage.removeItem("player_token");
  localStorage.removeItem("player_id");
  localStorage.removeItem("player_name");
  localStorage.removeItem("player_email");

  isAuthenticated.value = false;

  const router = useRouter(); // works inside Vue components only
  setTimeout(() => {
    router.push({ name: "Login" });
  }, 300);
}
