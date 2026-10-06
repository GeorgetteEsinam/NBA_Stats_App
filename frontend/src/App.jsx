
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
} from "react-router-dom";

import Teams from "./Teams";
import Players from "./Players";
import TeamProfile from "./TeamProfile";
import "./App.css";


// ==========================================
// PLAYER PHOTOS
// ==========================================

const playerPhotos = {
  "lebron james": "/lebron.jpg",
  "austin reaves": "/austin.jpg",
  "luka doncic": "/luka.jpg",
};


// ==========================================
// NORMALIZE PLAYER NAMES
// ==========================================

function normalizeName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}


// ==========================================
// DASHBOARD
// ==========================================

function Dashboard() {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");


  // ==========================================
  // GET PLAYERS FROM MYSQL
  // ==========================================

  useEffect(() => {
    fetch("http://localhost:5000/api/players")
      .then((response) => response.json())
      .then((data) => {
        setPlayers(data);
      })
      .catch((error) => {
        console.error("Error fetching players:", error);
      });
  }, []);


  // ==========================================
  // FEATURED PLAYERS
  // ==========================================

  const featuredPlayerNames = [
    "lebron james",
    "austin reaves",
    "luka doncic",
  ];

  const featuredPlayers = featuredPlayerNames
    .map((wantedName) => {
      return players.find((player) => {
        const databaseName = normalizeName(
          `${player.first_name} ${player.last_name}`
        );

        return databaseName === wantedName;
      });
    })
    .filter(Boolean);


  // ==========================================
  // SEARCH
  // ==========================================

  const filteredPlayers = players.filter((player) => {
    const fullName =
      `${player.first_name} ${player.last_name}`.toLowerCase();

    return fullName.includes(search.toLowerCase());
  });


  return (
    <div className="app">


      {/* ======================================
          NAVBAR
      ======================================= */}

      <nav className="navbar">

        <div className="nav-left">

          <div className="nba-logo">
            NBA
          </div>

          <div className="brand">
            NBA Stats
          </div>

          <div className="nav-links">

            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? "active" : ""
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/teams"
              className={({ isActive }) =>
                isActive ? "active" : ""
              }
            >
              Teams
            </NavLink>

            <NavLink
  to="/players"
  className={({ isActive }) =>
    isActive ? "active" : ""
  }
>
  Players
</NavLink>

          </div>

        </div>


        <div className="nav-right">

          <div className="search-box">

            <span>
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>


          <button className="icon-button">
            ☰
          </button>


          <div className="profile">

            <div className="profile-avatar">
              ML
            </div>

            <div className="profile-info">

              <strong>
                George
              </strong>

              <small>
                League Pass
              </small>

            </div>

            <span className="arrow">
              .
            </span>

          </div>

        </div>

      </nav>



      {/* ======================================
          MAIN DASHBOARD
      ======================================= */}

      <main className="dashboard">


        {/* ====================================
            LEFT SIDE
        ===================================== */}

        <section className="left-column">


          {/* ==================================
              FEATURED GAME
          =================================== */}

          <div className="featured-game">

            <div className="featured-overlay">

              <div className="game-label">
                FEATURED GAME
              </div>

              <div className="game-title">
                Lakers <span>at</span> Warriors
              </div>

              <div className="game-details">

                <span>
                  TONIGHT
                </span>

                <span>
                  8:00 PM
                </span>

                <span>
                  Chase Center
                </span>

              </div>

            </div>

          </div>



          {/* ==================================
              STANDINGS
          =================================== */}

          <div className="panel">

            <div className="panel-header">

              <h2>
                Conference Standings
              </h2>

              <span className="view-all">
                View all →
              </span>

            </div>


            <div className="standings-tabs">

              <button className="selected-tab">
                Eastern
              </button>

              <button>
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


              {[
                [
                  "1",
                  "Cleveland Cavaliers",
                  "48",
                  "18",
                  ".727",
                ],

                [
                  "2",
                  "Boston Celtics",
                  "46",
                  "20",
                  ".697",
                ],

                [
                  "3",
                  "New York Knicks",
                  "42",
                  "24",
                  ".636",
                ],

                [
                  "4",
                  "Milwaukee Bucks",
                  "39",
                  "27",
                  ".591",
                ],
              ].map((team) => (

                <div
                  className="standing-row"
                  key={team[0]}
                >

                  <span className="rank">
                    {team[0]}
                  </span>

                  <span className="team-name">

                    <span className="team-dot"></span>

                    {team[1]}

                  </span>

                  <span>
                    {team[2]}
                  </span>

                  <span>
                    {team[3]}
                  </span>

                  <span>
                    {team[4]}
                  </span>

                </div>

              ))}

            </div>

          </div>



          {/* ==================================
              UPCOMING GAMES
          =================================== */}

          <div className="panel upcoming-panel">

            <div className="panel-header">

              <h2>
                Upcoming Games
              </h2>

              <span className="view-all">
                View schedule →
              </span>

            </div>


            <div className="games-list">


              <div className="game-row">

                <div className="game-date">

                  <strong>
                    OCT
                  </strong>

                  <span>
                    02
                  </span>

                </div>


                <div className="game-teams">

                  <strong>
                    Lakers
                  </strong>

                  <span>
                    vs
                  </span>

                  <strong>
                    Warriors
                  </strong>

                </div>


                <div className="game-time">
                  8:00 PM
                </div>

              </div>



              <div className="game-row">

                <div className="game-date">

                  <strong>
                    OCT
                  </strong>

                  <span>
                    03
                  </span>

                </div>


                <div className="game-teams">

                  <strong>
                    Celtics
                  </strong>

                  <span>
                    vs
                  </span>

                  <strong>
                    Knicks
                  </strong>

                </div>


                <div className="game-time">
                  7:30 PM
                </div>

              </div>



              <div className="game-row">

                <div className="game-date">

                  <strong>
                    OCT
                  </strong>

                  <span>
                    04
                  </span>

                </div>


                <div className="game-teams">

                  <strong>
                    Bucks
                  </strong>

                  <span>
                    vs
                  </span>

                  <strong>
                    Heat
                  </strong>

                </div>


                <div className="game-time">
                  6:00 PM
                </div>

              </div>


            </div>

          </div>

        </section>



        {/* ====================================
            RIGHT SIDE
        ===================================== */}

        <section className="right-column">


          <div className="section-title">

            <h2>
              Players
            </h2>

            <NavLink to="/players" className="view-all">
  View all →
</NavLink>

          </div>



          <div className="player-cards">


            {/* ==================================
                FEATURED PLAYER CARDS
            =================================== */}

            {featuredPlayers.map((player, index) => {

              const initials =
                `${player.first_name?.[0] || ""}${player.last_name?.[0] || ""}`;


              const playerName = normalizeName(
                `${player.first_name} ${player.last_name}`
              );


              const playerPhoto =
                playerPhotos[playerName];


              return (

                <div
                  className={`player-card player-card-${index + 1}`}
                  key={player.id}
                >


                  {/* PLAYER PHOTO */}

                  <div className="player-background">

                    {playerPhoto ? (

                      <img
                        src={playerPhoto}
                        alt=""
                      />

                    ) : (

                      <div className="player-placeholder">
                        {initials}
                      </div>

                    )}

                  </div>


                  {/* DARK GRADIENT */}

                  <div className="player-gradient"></div>


                  {/* PLAYER INFORMATION */}

                  <div className="player-info-card">

                    <div className="player-team">

                      {player.team || "NBA"}

                    </div>


                    <h3>

                      {player.first_name}{" "}
                      {player.last_name}

                    </h3>


                    <div className="player-meta">

                      <span>
                        {player.position || "Player"}
                      </span>

                      <span>
                        #{player.jersey_number || "--"}
                      </span>

                    </div>

                  </div>


                  {/* ARROW */}

                  <div className="player-arrow">
                    →
                  </div>


                </div>

              );

            })}


            {/* ==================================
                LOADING CARDS
            =================================== */}

            {players.length === 0 && (

              <>

                <div className="player-card loading-card">

                  <div className="loading-text">
                    Loading players...
                  </div>

                </div>


                <div className="player-card loading-card">

                  <div className="loading-text">
                    Loading players...
                  </div>

                </div>


                <div className="player-card loading-card">

                  <div className="loading-text">
                    Loading players...
                  </div>

                </div>

              </>

            )}


            {/* ==================================
                MISSING PLAYER MESSAGE
            =================================== */}

            {players.length > 0 &&
              featuredPlayers.length < 3 && (

                <div className="missing-player-message">

                  Some featured players could not
                  be found in the database.

                </div>

              )}


          </div>

        </section>

      </main>



      {/* ======================================
          SEARCH RESULTS
      ======================================= */}

      {search && (

        <div className="search-results">


          <div className="search-results-header">

            <h2>
              Search Results
            </h2>

            <span>
              {filteredPlayers.length} players
            </span>

          </div>


          <div className="search-grid">


            {filteredPlayers
              .slice(0, 12)
              .map((player) => (

                <div
                  className="search-player"
                  key={player.id}
                >


                  <div className="mini-avatar">

                    {player.first_name?.[0]}

                    {player.last_name?.[0]}

                  </div>


                  <div>

                    <strong>

                      {player.first_name}{" "}
                      {player.last_name}

                    </strong>


                    <small>
                      {player.team}
                    </small>

                  </div>


                </div>

              ))}


          </div>

        </div>

      )}


    </div>
  );
}


// ==========================================
// APP ROUTING
// ==========================================

function App() {
  return (
    <BrowserRouter>
      <Routes>
  <Route path="/" element={<Dashboard />} />

  <Route path="/teams" element={<Teams />} />

  <Route
    path="/teams/:teamId"
    element={<TeamProfile />}
  />

  <Route path="/players" element={<Players />} />
</Routes>
    </BrowserRouter>
  );
}


export default App;
