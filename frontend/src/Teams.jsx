import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "./Teams.css";

function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/teams")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch teams");
        }

        return response.json();
      })
      .then((data) => {
        setTeams(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setError("Could not load teams.");
        setLoading(false);
      });
  }, []);

  const easternTeams = teams.filter(
    (team) => team.conference === "East"
  );

  const westernTeams = teams.filter(
    (team) => team.conference === "West"
  );

  const renderTeam = (team) => (
    <NavLink
      to={`/teams/${team.id}`}
      className="team-card-link"
      key={team.id}
    >
      <div className="team-card">

        <div className="team-logo-container">
          {team.logo ? (
            <img
              src={team.logo}
              alt={`${team.name} logo`}
              className="team-logo"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling.style.display = "flex";
              }}
            />
          ) : null}

          <div className="team-logo-fallback">
            {team.code}
          </div>
        </div>

        <div className="team-info">
          <h3>{team.name}</h3>
          <p>{team.nickname}</p>
          <span>{team.code}</span>
        </div>

      </div>
    </NavLink>
  );

  if (loading) {
    return (
      <div className="teams-page">
        <h1>NBA Teams</h1>
        <p className="teams-message">Loading teams...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teams-page">
        <h1>NBA Teams</h1>
        <p className="teams-message error">{error}</p>
      </div>
    );
  }

  return (
    <div className="teams-page">

      <div className="teams-header">
        <div>
          <p className="page-label">NBA STATS</p>

          <h1>Teams</h1>

          <p>
            Explore all NBA teams and their information.
          </p>
        </div>
      </div>

      <section className="conference-section">
        <h2>Eastern Conference</h2>

        <div className="teams-grid">
          {easternTeams.map(renderTeam)}
        </div>
      </section>

      <section className="conference-section">
        <h2>Western Conference</h2>

        <div className="teams-grid">
          {westernTeams.map(renderTeam)}
        </div>
      </section>

    </div>
  );
}

export default Teams;