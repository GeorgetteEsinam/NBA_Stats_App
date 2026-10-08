
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PlayerDetails.css";

function PlayerDetails() {
  const { playerId } = useParams();
  const navigate = useNavigate();

  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastGames, setLastGames] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  // =========================
  // FETCH PLAYER
  // =========================
  useEffect(() => {
    fetch(`http://localhost:5000/api/players/${playerId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch player");
        }

        return response.json();
      })
      .then((data) => {
        setPlayer(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setError("Could not load player.");
        setLoading(false);
      });
  }, [playerId]);

  // =========================
  // FETCH LAST 5 GAMES
  // =========================
  useEffect(() => {
    const fetchLastGames = async () => {
      try {
        setGamesLoading(true);

        const response = await fetch(
          `http://localhost:5000/api/players/${playerId}/last-games`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch games");
        }

        const data = await response.json();

        setLastGames(data);
      } catch (error) {
        console.error("Last games error:", error);
        setLastGames([]);
      } finally {
        setGamesLoading(false);
      }
    };

    fetchLastGames();
  }, [playerId]);

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="player-details-page">
        <div className="player-details-message">
          Loading player...
        </div>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================
  if (error || !player) {
    return (
      <div className="player-details-page">
        <div className="player-details-message">
          <p>{error || "Player not found."}</p>

          <button
            className="back-players-button"
            onClick={() => navigate("/players")}
          >
            ← Back to Players
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${player.first_name} ${player.last_name}`;

  const birthDate = player.birth_date
    ? new Date(player.birth_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  return (
    <div className="player-details-page">

      {/* =========================
          TOP NAV
      ========================= */}

      <header className="player-details-navbar">

        <div className="navbar-left">

          <div className="nba-logo">
            NBA
          </div>

          <div className="nba-brand">
            NBA Stats
          </div>

          <nav className="details-nav">

            <span onClick={() => navigate("/")}>
              Home
            </span>

            <span onClick={() => navigate("/teams")}>
              Teams
            </span>

            <span className="active">
              Players
            </span>

          </nav>

        </div>

        <div className="navbar-right">

          <div className="details-menu">
            ☰
          </div>

        </div>

      </header>

      {/* =========================
          PAGE CONTENT
      ========================= */}

      <main className="player-details-content">

        {/* BACK BUTTON */}

        <button
          className="player-back-button"
          onClick={() => navigate("/players")}
        >
          ← Back to Players
        </button>

        {/* =========================
            MAIN TWO-COLUMN LAYOUT
        ========================= */}

        <div className="player-dashboard-grid">

          {/* =========================
              LEFT COLUMN
          ========================= */}

          <div className="player-main-column">

            {/* HERO */}

            <section className="player-hero">

              <div className="player-hero-left">

                <div className="player-team-circle">
                  {player.team_code}
                </div>

                <div className="player-team-info">

                  <span className="player-team-name">
                    {player.team}
                  </span>

                  <span className="player-position">
                    {player.position || "N/A"}

                    {player.jersey_number
                      ? `  #${player.jersey_number}`
                      : ""}
                  </span>

                  <h1>
                    {fullName}
                  </h1>

                </div>

              </div>

              {/* PLAYER PHOTO */}

              <div className="player-photo-area">

                {player.photo ? (
                  <img
                    src={player.photo}
                    alt={fullName}
                  />
                ) : (
                  <div className="player-photo-placeholder">
                    {player.first_name?.[0]}
                    {player.last_name?.[0]}
                  </div>
                )}

              </div>

            </section>

            {/* PROFILE TAB */}

            <div className="player-tabs">

              <button className="player-tab active">
                Profile
              </button>

            </div>

            {/* =========================
                SEASON AVERAGES
            ========================= */}

            <section className="season-section">

              <div className="section-title">

                <div>

                  <h2>
                    Season Averages
                  </h2>

                  <p>
                    Current season statistics
                  </p>

                </div>

              </div>

              <div className="season-table">

                <div className="season-row season-header">

                  <span>
                    Season
                  </span>

                  <span>
                    GP
                  </span>

                  <span>
                    PPG
                  </span>

                  <span>
                    RPG
                  </span>

                  <span>
                    APG
                  </span>

                </div>

                <div className="season-row">

                  <span>
                    2023–24
                  </span>

                  <span>
                    --
                  </span>

                  <span>
                    --
                  </span>

                  <span>
                    --
                  </span>

                  <span>
                    --
                  </span>

                </div>

              </div>

            </section>

          </div>

          {/* =========================
              RIGHT COLUMN
          ========================= */}

          <div className="player-side-column">

            {/* =========================
                BIO
            ========================= */}

            <section className="player-info-card player-bio-card">

              <div className="card-heading">

                <h2>
                  Bio
                </h2>

              </div>

              <div className="bio-grid">

                <div className="bio-item">

                  <span>
                    Height / Weight
                  </span>

                  <strong>
                    {player.height_feet
                      ? `${player.height_feet}' ${player.height_inches}" · ${player.weight_pounds} lbs`
                      : "N/A"}
                  </strong>

                </div>

                <div className="bio-item">

                  <span>
                    Age
                  </span>

                  <strong>
                    {player.birth_date
                      ? new Date().getFullYear() -
                        new Date(player.birth_date).getFullYear()
                      : "N/A"}
                  </strong>

                </div>

                <div className="bio-item">

                  <span>
                    Birthdate
                  </span>

                  <strong>
                    {birthDate}
                  </strong>

                </div>

                <div className="bio-item">

                  <span>
                    Country
                  </span>

                  <strong>
                    {player.birth_country || "N/A"}
                  </strong>

                </div>

                <div className="bio-item">

                  <span>
                    College
                  </span>

                  <strong>
                    {player.college || "N/A"}
                  </strong>

                </div>

                <div className="bio-item">
                </div>

              </div>

            </section>

            {/* =========================
                LAST 5 GAMES
            ========================= */}

            <section className="last-games-section">

              <div className="section-title">

                <div>

                  <h2>
                    Last 5 Games
                  </h2>

                  

                </div>

              </div>

              <div className="last-games-card">

                {gamesLoading ? (
                  <div className="empty-games">
                    <p>Loading recent games...</p>
                  </div>
                ) : lastGames.length === 0 ? (
                  <div className="empty-games">
                    <p>No recent game data available.</p>
                  </div>
                ) : (
                  <table className="games-list">
                    <thead>
                      <tr>
                        <th scope="col">Date</th>
                        <th scope="col">Opponent</th>
                        <th scope="col">MIN</th>
                        <th scope="col">PTS</th>
                        <th scope="col">REB</th>
                        <th scope="col">AST</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastGames.map((game) => (
                        <tr key={`${game.date}-${game.abbr}`}>
                          <td>
                            {new Date(game.date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric"
                              }
                            )}
                          </td>
                          <td>
                            <div className="game-opponent">
                              <strong>{game.abbr}</strong>
                              <span>{game.opponent}</span>
                            </div>
                          </td>
                          <td>{game.min_played}</td>
                          <td>{game.pts}</td>
                          <td>{game.reb}</td>
                          <td>{game.ast}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

              </div>

            </section>

          </div>

        </div>

      </main>

    </div>
  );
}

export default PlayerDetails;
