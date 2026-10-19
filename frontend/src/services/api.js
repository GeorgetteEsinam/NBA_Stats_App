const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

async function request(path, options = {}) {
  const { token, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);

  if (fetchOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

export const getPlayers = () => request("/players");
export const getPlayer = (playerId) => request(`/players/${playerId}`);
export const getPlayerLastGames = (playerId) =>
  request(`/players/${playerId}/last-games`);
export const getPlayerAverages = (playerId, season = 2024) =>
  request(`/players/${playerId}/averages?season=${season}`);
export const getTeams = () => request("/teams");
export const getTeam = (teamId) => request(`/teams/${teamId}`);
export const getTeamPlayers = (teamId) =>
  request(`/teams/${teamId}/players`);
export const loginUser = (credentials) =>
  request("/auth/Login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
export const signupUser = (details) =>
  request("/auth/Signup", {
    method: "POST",
    body: JSON.stringify(details),
  });
export const getCurrentUser = (token) => request("/auth/me", { token });

export const getStandings = (season = 2024) =>
  request(`/standings?season=${season}`);


export const getFavoriteTeams = (token) =>
  request("/favorites/teams", { token });

export const addFavoriteTeam = (teamId, token) =>
  request("/favorites/teams", {
    method: "POST",
    token,
    body: JSON.stringify({ teamId }),
  });

export const removeFavoriteTeam = (teamId, token) =>
  request(`/favorites/teams/${teamId}`, {
    method: "DELETE",
    token,
  });

export const getFavoritePlayers = (token) =>
  request("/favorites/players", { token });

export const addFavoritePlayer = (playerId, token) =>
  request("/favorites/players", {
    method: "POST",
    token,
    body: JSON.stringify({ playerId }),
  });

export const removeFavoritePlayer = (playerId, token) =>
  request(`/favorites/players/${playerId}`, {
    method: "DELETE",
    token,
  });

  
export const cancelSubscription = (token) =>
  request("/subscription/cancel", {
    method: "POST",
    token,
  });



