import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./TeamProfile.css";

function TeamProfile() {
  const { teamId } = useParams();

  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`http://localhost:5000/api/teams/${teamId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch team");
          }

          return response.json();
        }),

      fetch(`http://localhost:5000/api/teams/${teamId}/players`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch players");
          }

          return response.json();
        }),
    ])
      .then(([teamData, playerData]) => {
        setTeam(teamData);
        setPlayers(playerData);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setError("Could not load team information.");
        setLoading(false);
      });
  }, [teamId]);

  if (loading) {
    return (
      <div className="team-profile-page">
        <p className="team-profile-message">
          Loading team...
        </p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="team-profile-page">
        <p className="team-profile-message error">
          {error || "Team not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="team-profile-page">

      {/* TEAM HEADER */}
      <section className="team-profile-header">

        <div className="team-profile-main">

          <div className="team-profile-logo">
            <img
              src={team.logo}
              alt={`${team.name} logo`}
            />
          </div>

          <div>
            <p className="team-conference">
              {team.conference?.toUpperCase()} CONFERENCE
            </p>

            <h1>{team.name}</h1>

            <p className="team-subtitle">
              {team.conference} · {team.division} Division
            </p>
          </div>

        </div>

        <div className="team-summary">

          <div className="summary-box">
            <span>Roster</span>
            <strong>{players.length}</strong>
          </div>

          <div className="summary-box">
            <span>Conference</span>
            <strong>{team.conference}</strong>
          </div>

          <div className="summary-box">
            <span>Division</span>
            <strong>{team.division}</strong>
          </div>

        </div>

      </section>

      {/* TABS */}
      <div className="team-tabs">

        <button className="team-tab">
          Schedule
        </button>

        <button className="team-tab active">
          Roster
        </button>

        <button className="team-tab">
          Standings
        </button>

      </div>

      {/* CONTENT */}
      <div className="team-profile-content">

        {/* ROSTER */}
        <section className="roster-section">

          <div className="section-heading">
            <h2>Roster</h2>

            <span>
              {players.length} players
            </span>
          </div>

          <div className="roster-table">

            <div className="roster-header">
              <span>Player</span>
              <span>Position</span>
              <span>Number</span>
            </div>

            {players.map((player) => (

              <div
                className="roster-row"
                key={player.id}
              >

                <div className="roster-player">

                  <div className="roster-avatar">
                    {player.first_name?.[0]}
                    {player.last_name?.[0]}
                  </div>

                  <div>
                    <strong>
                      {player.first_name}{" "}
                      {player.last_name}
                    </strong>

                    <small>
                      {player.birth_country || "N/A"}
                    </small>
                  </div>

                </div>

                <span>
                  {player.position || "N/A"}
                </span>

                <span>
                  {player.jersey_number
                    ? `#${player.jersey_number}`
                    : "N/A"}
                </span>

              </div>

            ))}

          </div>

        </section>

        {/* TEAM LEADERS */}
        <section className="leaders-section">

          <h2>Team leaders</h2>

          <div className="leader-card">
            <span>Points</span>
            <strong>—</strong>
            <small>Stats coming soon</small>
          </div>

          <div className="leader-card">
            <span>Rebounds</span>
            <strong>—</strong>
            <small>Stats coming soon</small>
          </div>

          <div className="leader-card">
            <span>Assists</span>
            <strong>—</strong>
            <small>Stats coming soon</small>
          </div>

        </section>

      </div>

    </div>
  );
}

export default TeamProfile;