import { useEffect, useState } from "react";
import { useNavigate} from "react-router-dom";
import "./Players.css";

function Players() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [conferenceFilter, setConferenceFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const playersPerPage = 14;

  useEffect(() => {
    fetch("http://localhost:5000/api/players")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch players");
        }

        return response.json();
      })
      .then((data) => {
        setPlayers(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setError("Could not load players.");
        setLoading(false);
      });
  }, []);

  // Filter players
  const filteredPlayers = players.filter((player) => {
    const fullName =
      `${player.first_name} ${player.last_name}`.toLowerCase();

    const teamName = (player.team || "").toLowerCase();

    const searchText = search.toLowerCase();

    const matchesSearch =
      fullName.includes(searchText) ||
      teamName.includes(searchText);

    const matchesConference =
      conferenceFilter === "All" ||
      player.conference === conferenceFilter;

    return matchesSearch && matchesConference;
  });



  // Pagination
  const totalPages = Math.ceil(
    filteredPlayers.length / playersPerPage
  );

  const startIndex =
    (currentPage - 1) * playersPerPage;

  const currentPlayers = filteredPlayers.slice(
    startIndex,
    startIndex + playersPerPage
  );

  // Get player initials
  const getInitials = (player) => {
    const first = player.first_name?.[0] || "";
    const last = player.last_name?.[0] || "";

    return `${first}${last}`.toUpperCase();
  };

  // Team circle colors
  const teamColors = {
    OKC: "#00a8e8",
    DEN: "#f5c400",
    BOS: "#00a651",
    MIN: "#8bc34a",
    LAL: "#8b5cf6",
    GSW: "#f5c400",
    MIL: "#00a651",
    NYK: "#f59e0b",
    CLE: "#e11d48",
    SAS: "#aaaaaa",
    PHI: "#38bdf8",
    PHX: "#f97316",
    ATL: "#ef4444",
    BKN: "#ffffff",
    CHA: "#06b6d4",
    CHI: "#ef4444",
    DAL: "#38bdf8",
    DET: "#ef4444",
    HOU: "#ef4444",
    IND: "#f5c400",
    MIA: "#ef4444",
    ORL: "#38bdf8",
    POR: "#ef4444",
    SAC: "#a855f7",
    TOR: "#ef4444",
    UTA: "#a855f7",
    WAS: "#38bdf8",
  };

  const getTeamColor = (code) => {
    return teamColors[code] || "#777";
  };

  if (loading) {
    return (
      <div className="players-page">
        <h1>Players</h1>
        <p className="players-message">
          Loading players...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="players-page">
        <h1>Players</h1>
        <p className="players-message error">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="players-page">

      {/* PAGE HEADER */}
      <div className="players-top">

        <div>
          <h1>Players</h1>

          <p className="players-count">
            Showing {currentPlayers.length} of{" "}
            {filteredPlayers.length} players
          </p>
        </div>

        <div className="players-controls">

          {/* SEARCH */}
          <div className="player-search-wrapper">
            <input
              type="text"
              placeholder="Filter by name or team"
              value={search}
            onChange={(e) => {
  setSearch(e.target.value);
  setCurrentPage(1);
}}
              className="player-search"
            />
          </div>

          {/* CONFERENCE FILTER */}
          <div className="conference-filter">

            <button
              className={
                conferenceFilter === "All"
                  ? "filter-button active"
                  : "filter-button"
              }
              onClick={() => {
  setConferenceFilter("All");
  setCurrentPage(1);
}
              }
            >
              All
            </button>

            <button
              className={
                conferenceFilter === "East"
                  ? "filter-button active"
                  : "filter-button"
              }
             onClick={() => {
  setConferenceFilter("East");
  setCurrentPage(1);
}
              }
            >
              Eastern
            </button>

            <button
              className={
                conferenceFilter === "West"
                  ? "filter-button active"
                  : "filter-button"
              }
              onClick={() => {
  setConferenceFilter("West");
  setCurrentPage(1);
}
              }
            >
              Western
            </button>

          </div>

        </div>
      </div>

      {/* TABLE */}
      <div className="players-table-container">

        <div className="players-table">

          {/* HEADER */}
          <div className="players-table-header">

            <div>Team</div>
            <div>Name</div>
            <div>Conference</div>
            <div>Division</div>

          </div>

          {/* PLAYER ROWS */}
          {currentPlayers.map((player) => {

            const fullName =
              `${player.first_name} ${player.last_name}`;

            const conference =
              player.conference || "N/A";

            return (
              <div
                className="player-row"
                key={player.id}
                onClick={() => navigate(`/players/${player.id}`)}
              >

                {/* TEAM */}
                <div className="team-column">

                  <div
                    className="team-circle"
                    style={{
                      borderColor:
                        getTeamColor(
                          player.team_code
                        ),
                    }}
                  >
                    {player.team_code}
                  </div>

                </div>

                {/* NAME */}
                <div className="name-column">

                  <div className="player-initials">
                    {getInitials(player)}
                  </div>

                  <span className="player-name">
                    {fullName}
                  </span>

                </div>

                {/* CONFERENCE */}
                <div>

                  <span
                    className={
                      conference === "East"
                        ? "conference-badge eastern"
                        : "conference-badge western"
                    }
                  >
                    {conference === "East"
                      ? "Eastern"
                      : "Western"}
                  </span>

                </div>

                {/* DIVISION */}
                <div className="division">
                  {player.division || "N/A"}
                </div>

              </div>
            );
          })}

          {currentPlayers.length === 0 && (
            <div className="no-players">
              No players found.
            </div>
          )}

          {/* TABLE FOOTER */}
          <div className="players-table-footer">

            <span>
              Rows per page: {playersPerPage}
            </span>

            <div className="pagination">

              <span>
                {filteredPlayers.length === 0
                  ? "0–0"
                  : `${startIndex + 1}–${Math.min(
                      startIndex + playersPerPage,
                      filteredPlayers.length
                    )}`}{" "}
                of {filteredPlayers.length}
              </span>

              <button
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage(
                    currentPage - 1
                  )
                }
              >
                ‹
              </button>

              <button
                disabled={
                  currentPage === totalPages ||
                  totalPages === 0
                }
                onClick={() =>
                  setCurrentPage(
                    currentPage + 1
                  )
                }
              >
                ›
              </button>

            </div>

          </div>

        </div>
      </div>

    </div>
  );
}

export default Players;