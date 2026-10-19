import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getStoredUser } from "../services/auth.js";
import { getPlayers, getStandings } from "../services/api.js";
import "./HomePage.css";

// PLAYER PHOTOS
const playerPhotos = {
  "lebron james": "/lebron.jpg",
  "austin reaves": "/austin.jpg",
  "luka doncic": "/luka.jpg",
};

// NORMALIZE PLAYER NAMES
function normalizeName(name = "") {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// HANDLE DIFFERENT API RESPONSE SHAPES
function getStandingsArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.response)) return data.response;
  if (Array.isArray(data?.standings)) return data.standings;
  return [];
}

function HomePage() {
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [user] = useState(getStoredUser);
  
const [proActive, setProActive] = useState(false);
const [proStatusLoading, setProStatusLoading] = useState(true);


  const [conference, setConference] = useState("Eastern");
  const [standings, setStandings] = useState([]);
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [standingsError, setStandingsError] = useState("");
  const [showAllStandings, setShowAllStandings] = useState(false);
  const [upgradeNotice, setUpgradeNotice] = useState(false);
  
const [games, setGames] = useState([]);
const [gamesLoading, setGamesLoading] = useState(true);
const [gamesError, setGamesError] = useState("");


  // CHECK THE LOGGED-IN USER'S CURRENT PRO SUBSCRIPTION
  useEffect(() => {
    const checkProStatus = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setProActive(false);
          return;
        }

        const baseURL =
          import.meta.env.VITE_API_BASE_URL ||
          "http://localhost:5000/api";

        const response = await fetch(`${baseURL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setProActive(false);
          return;
        }

        const data = await response.json();
        const account = data.user;

        const expiry = account?.pro_expires_at
          ? new Date(account.pro_expires_at)
          : null;

        setProActive(
          account?.account_type === "pro" &&
          expiry !== null &&
          !Number.isNaN(expiry.getTime()) &&
          expiry.getTime() > Date.now()
        );
      } catch (error) {
        console.error("Could not check Pro status:", error);
        setProActive(false);
      } finally {
        setProStatusLoading(false);
      }
    };

    checkProStatus();
  }, []);

  // GET PLAYERS FROM MYSQL
  useEffect(() => {
    getPlayers()
      .then((data) => {
        setPlayers(Array.isArray(data) ? data : data?.response || []);
      })
      .catch((error) => {
        console.error("Error fetching players:", error);
      });
  }, []);

  // GET NBA STANDINGS
  useEffect(() => {
    getStandings()
      .then((data) => {
        const rows = getStandingsArray(data);
        console.table(
  rows.map((item) => ({
    team: item.team?.name,
    rank: item.conference?.rank,
    conference: item.conference?.name,
    season: item.season,
  }))
);
        setStandings(rows);
        setStandingsError(
          rows.length ? "" : "No standings data was returned."
        );
      })
      .catch((error) => {
        console.error("Error fetching standings:", error);
        setStandingsError("Could not load standings.");
      })
      .finally(() => {
        setStandingsLoading(false);
      });
  }, []);

  
  // GET REAL NBA GAMES
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setGamesLoading(true);
        setGamesError("");

        const today = new Date().toLocaleDateString("en-CA", {
          timeZone: "Africa/Accra",
        });

        const baseURL =
          import.meta.env.VITE_API_BASE_URL ||
          "http://localhost:5000/api";

        const response = await fetch(
          `${baseURL}/nba-schedule-test?date=${today}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch games");
        }

        const data = await response.json();

        if (data.errors && Object.keys(data.errors).length > 0) {
          throw new Error("The NBA schedule API returned an error");
        }

        const scheduledGames = (data.response || [])
          .filter((game) => game.status?.short === 1)
          .sort(
            (a, b) =>
              new Date(a.date.start) - new Date(b.date.start)
          );

        setGames(scheduledGames);
      } catch (error) {
        console.error("Error fetching NBA games:", error);
        setGamesError("Could not load the schedule.");
      } finally {
        setGamesLoading(false);
      }
    };

    fetchGames();
  }, []);


  // FEATURED PLAYERS
  const featuredPlayerNames = [
    "lebron james",
    "austin reaves",
    "luka doncic",
  ];

  const featuredPlayers = featuredPlayerNames
    .map((wantedName) =>
      players.find((player) =>
        normalizeName(
          `${player.first_name || ""} ${player.last_name || ""}`
        ) === wantedName
      )
    )
    .filter(Boolean);

  // SEARCH
  const filteredPlayers = players.filter((player) => {
    const fullName =
      `${player.first_name || ""} ${player.last_name || ""}`.toLowerCase();

    return fullName.includes(search.toLowerCase());
  });

 
// GET CONFERENCE NAME
const getConferenceName = (item) => {
  const value =
    item.conference?.name ??
    item.conference?.code ??
    item.conference ??
    "";

  return String(value).toLowerCase();
};

// GET TEAM NAME
const getTeamName = (item) =>
  item.team?.name ??
  item.team?.nickname ??
  item.team_name ??
  item.name ??
  "Unknown team";

// GET TEAM RANK
const getTeamRank = (item, index) =>
  item.conference?.rank ??
  item.conference_rank ??
  item.rank ??
  index + 1;


// GET WINS
const getWins = (item) => {
  const total = Number(item.win?.total ?? 0);

  // Fall back to home + away if the API total is zero.
  if (total > 0) return total;

  return (
    Number(item.win?.home ?? 0) +
    Number(item.win?.away ?? 0)
  );
};

// GET LOSSES
const getLosses = (item) => {
  const total = Number(item.loss?.total ?? 0);

  // Fall back to home + away if the API total is zero.
  if (total > 0) return total;

  return (
    Number(item.loss?.home ?? 0) +
    Number(item.loss?.away ?? 0)
  );
};

// GET WIN PERCENTAGE
const getWinPercentage = (item) => {
  const wins = getWins(item);
  const losses = getLosses(item);
  const gamesPlayed = wins + losses;

  return gamesPlayed > 0 ? wins / gamesPlayed : 0;
};



const filteredStandings = standings
  .filter((item) => {
    const name = getConferenceName(item);

    if (conference === "Eastern") {
      return name.includes("east") || name === "e";
    }

    return name.includes("west") || name === "w";
  })
  .sort((a, b) => {
    // Highest win percentage comes first.
    const percentageDifference =
      getWinPercentage(b) - getWinPercentage(a);

    if (percentageDifference !== 0) {
      return percentageDifference;
    }

    // If percentages match, compare total wins.
    return getWins(b) - getWins(a);
  });



  // SHOW FOUR TEAMS OR ALL TEAMS
  const displayedStandings = showAllStandings
    ? filteredStandings
    : filteredStandings.slice(0, 4);

  // NAVIGATE TO PLAYER DETAILS
  const openPlayer = (player) => {
    if (player?.id !== undefined && player?.id !== null) {
      navigate(`/players/${player.id}`);
    }
  };

  const handlePlayerCardKeyDown = (event, player) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPlayer(player);
    }
  };

  return (
    <div className="app">
      <main className="dashboard">
        {/* LEFT SIDE */}
        <section className="left-column">
          {/* FEATURED GAME */}
          <div className="featured-game">
            <div className="featured-overlay">
              <div className="game-label">FEATURED GAME</div>

              <div className="game-title">
                Lakers <span>at</span> Warriors
              </div>

              <div className="game-details">
                <span>TONIGHT</span>
                <span>8:00 PM</span>
                <span>Chase Center</span>
              </div>
            </div>
          </div>

          {/* CONFERENCE STANDINGS */}
          <div className="panel">
            <div className="panel-header">
              <h2>Conference Standings</h2>

              <span className="view-all">
                {!standingsLoading &&
                  !standingsError &&
                  filteredStandings.length > 4 && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowAllStandings((previous) => !previous)
                      }
                    >
                      {showAllStandings ? "Show less" : "View all"}
                    </button>
                  )}
              </span>
            </div>

            <div className="standings-tabs">
              <button
                type="button"
                className={
                  conference === "Eastern" ? "selected-tab" : ""
                }
                onClick={() => {
                  setConference("Eastern");
                  setShowAllStandings(false);
                }}
              >
                Eastern
              </button>

              <button
                type="button"
                className={
                  conference === "Western" ? "selected-tab" : ""
                }
                onClick={() => {
                  setConference("Western");
                  setShowAllStandings(false);
                }}
              >
                Western
              </button>
            </div>

            <div className="standing-table">
              <div className="table-heading">
                <span>#</span>
                <span>TEAM</span>
                <span>W</span>
                <span>L</span>
                <span>PCT</span>
              </div>

              {standingsLoading && <p>Loading standings...</p>}

              {!standingsLoading && standingsError && (
                <p>{standingsError}</p>
              )}

              {!standingsLoading &&
                !standingsError &&
                displayedStandings.map((item, index) => (
                  <div
                    className="standing-row"
                    key={
                      item.team?.id ??
                      item.team_id ??
                      `${getTeamName(item)}-${index}`
                    }
                  >
                    <span className="rank">
                      {getTeamRank(item, index)}
                    </span>

                    <span className="team-name">
                      <span className="team-dot" />
                      {getTeamName(item)}
                    </span>

                    <span>{getWins(item)}</span>
                    <span>{getLosses(item)}</span>
                    <span>{getWinPercentage(item).toFixed(3)}</span>
                  </div>
                ))}

              {!standingsLoading &&
                !standingsError &&
                filteredStandings.length === 0 && (
                  <p>
                    No standings available for this conference.
                  </p>
                )}
            </div>
          </div>

          {/* UPCOMING GAMES - PRO FEATURE */}
          <div className="panel upcoming-panel">
            <div className="panel-header">
              <h2>Upcoming Games</h2>

              <span className="view-all pro-label">
                <span className="pro-label-dot" />
                League Pass
              </span>
            </div>

            <div className="schedule-preview">
            <div className={`games-list ${proActive ? "" : "schedule-blurred"}`}>
                {/* Real NBA games go here */}
             
{gamesLoading && (
  <div className="game-row">
    <div className="game-teams">
      <strong>Loading today's games...</strong>
    </div>
  </div>
)}

{!gamesLoading && gamesError && (
  <div className="game-row">
    <div className="game-teams">
      <strong>{gamesError}</strong>
    </div>
  </div>
)}

{!gamesLoading &&
  !gamesError &&
  games.length === 0 && (
    <div className="game-row">
      <div className="game-teams">
        <strong>No upcoming games scheduled today.</strong>
      </div>
    </div>
  )}

{!gamesLoading &&
  !gamesError &&
  games.slice(0, 3).map((game) => {
    const gameDate = new Date(game.date.start);

    const dateParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Accra",
      month: "short",
      day: "2-digit",
    }).formatToParts(gameDate);

    const month =
      dateParts.find((part) => part.type === "month")?.value;

    const day =
      dateParts.find((part) => part.type === "day")?.value;

    const time = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Accra",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(gameDate);

    return (
      <div className="game-row" key={game.id}>
        <div className="game-date">
          <strong>{month}</strong>
          <span>{day}</span>
        </div>

        <div className="game-teams">
          <strong>{game.teams.visitors.name}</strong>
          <span>vs</span>
          <strong>{game.teams.home.name}</strong>
        </div>

        <div className="game-time">{time}</div>
      </div>
      
      
    );
  })}

              </div>

              {!proStatusLoading && !proActive && (
              <div className="pro-lock-overlay">
                <div className="pro-lock-content">
                  <div className="pro-lock-icon" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="4" y="10" width="16" height="11" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      <path d="M12 14v3" />
                    </svg>
                  </div>

                  <h3>Unlock the Full Schedule</h3>

                  <p>
                    Get access to upcoming games, match dates and tip-off
                    times with Pro.
                  </p>

                  <button
                    type="button"
                    className="pro-unlock-button"
                    onClick={() => navigate("/league-pass")}
                  >
                    Unlock Pro <span aria-hidden="true">→</span>
                  </button>

                 
                </div>
              </div>
              )}
          </div>
          </div>
              
        </section>

        {/* RIGHT SIDE */}
        <section className="right-column">
          <div className="section-title">
            <h2>Players</h2>

            <NavLink to="/players" className="view-all">
              View all →
            </NavLink>
          </div>

          <div className="player-cards">
            {/* FEATURED PLAYER CARDS */}
            {featuredPlayers.map((player, index) => {
              const initials =
                `${player.first_name?.[0] || ""}${player.last_name?.[0] || ""}`;

              const playerName = normalizeName(
                `${player.first_name || ""} ${player.last_name || ""}`
              );

              const playerPhoto = playerPhotos[playerName];

              return (
                <div
                  className={`player-card player-card-${index + 1}`}
                  key={player.id}
                  role="link"
                  tabIndex={0}
                  aria-label={`View ${player.first_name} ${player.last_name} details`}
                  onClick={() => openPlayer(player)}
                  onKeyDown={(event) =>
                    handlePlayerCardKeyDown(event, player)
                  }
                >
                  <div className="player-background">
                    {playerPhoto ? (
                      <img
                        src={playerPhoto}
                        alt={`${player.first_name} ${player.last_name}`}
                      />
                    ) : (
                      <div className="player-placeholder">
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="player-gradient" />

                  <div className="player-info-card">
                    <div className="player-team">
                      {player.team || "NBA"}
                    </div>

                    <h3>
                      {player.first_name} {player.last_name}
                    </h3>

                    <div className="player-meta">
                      <span>{player.position || "Player"}</span>
                      <span>#{player.jersey_number || "--"}</span>
                    </div>
                  </div>

                  <div className="player-arrow">→</div>
                </div>
              );
            })}

            {/* LOADING CARDS */}
            {players.length === 0 && (
              <>
                <div className="player-card loading-card">
                  <div className="loading-text">Loading players...</div>
                </div>

                <div className="player-card loading-card">
                  <div className="loading-text">Loading players...</div>
                </div>

                <div className="player-card loading-card">
                  <div className="loading-text">Loading players...</div>
                </div>
              </>
            )}

            {/* MISSING PLAYER MESSAGE */}
            {players.length > 0 && featuredPlayers.length < 3 && (
              <div className="missing-player-message">
                Some featured players could not be found in the database.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* SEARCH RESULTS */}
      {search && (
        <div className="search-results">
          <div className="search-results-header">
            <h2>Search Results</h2>
            <span>{filteredPlayers.length} players</span>
          </div>

          <div className="search-grid">
            {filteredPlayers.slice(0, 12).map((player) => (
              <button
                type="button"
                className="search-player"
                key={player.id}
                onClick={() => openPlayer(player)}
              >
                <div className="mini-avatar">
                  {player.first_name?.[0]}
                  {player.last_name?.[0]}
                </div>

                <div>
                  <strong>
                    {player.first_name} {player.last_name}
                  </strong>

                  <small>{player.team}</small>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;