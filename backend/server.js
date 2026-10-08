require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

const PORT = 5000;
const API_KEY = process.env.API_SPORTS_KEY;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isNaN(number) ? null : number;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Authentication required"
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Authentication required"
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (error) {
    return res.status(403).json({
      message: "Invalid or expired token"
    });
  }
}

// ==========================================
// PROTECTED AUTH TEST
// ==========================================

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      `
      SELECT
        id,
        name,
        email,
        account_type,
        created_at
      FROM users
      WHERE id = ?
      `,
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({
      user: users[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch user"
    });
  }
});

// ==========================================
// BASIC TEST ROUTES
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "NBA Stats API is running!"
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    message: "Hello from the NBA backend!"
  });
});

// ==========================================
// GET ALL PLAYERS FROM MYSQL
// ==========================================

app.get("/api/players", async (req, res) => {
  try {
    const [players] = await db.execute(`
      SELECT
        p.id,
        p.api_player_id,
        p.first_name,
        p.last_name,
        p.position,
        p.jersey_number,
        p.birth_date,
        p.birth_country,
        p.height_feet,
        p.height_inches,
        p.height_meters,
        p.weight_pounds,
        p.weight_kilograms,
        p.college,
        p.nba_start_year,
        p.nba_experience,
        p.photo,
        t.id AS team_id,
        t.name AS team,
        t.nickname AS team_nickname,
        t.code AS team_code,
        t.city AS team_city,
        t.logo AS team_logo,
        t.conference,
        t.division
      FROM players p
      JOIN teams t
        ON p.team_id = t.id
      ORDER BY p.last_name, p.first_name
    `);

    res.json(players);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch players",
      error: error.message
    });
  }
});

// ==========================================
// GET ONE PLAYER BY DATABASE ID
// ==========================================

app.get("/api/players/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [players] = await db.execute(
      `
      SELECT
        p.id,
        p.api_player_id,
        p.first_name,
        p.last_name,
        p.position,
        p.jersey_number,
        p.birth_date,
        p.birth_country,
        p.height_feet,
        p.height_inches,
        p.height_meters,
        p.weight_pounds,
        p.weight_kilograms,
        p.college,
        p.affiliation,
        p.nba_start_year,
        p.nba_experience,
        p.photo,

        t.id AS team_id,
        t.name AS team,
        t.nickname AS team_nickname,
        t.code AS team_code,
        t.city AS team_city,
        t.logo AS team_logo,
        t.conference,
        t.division

      FROM players p

      LEFT JOIN teams t
        ON p.team_id = t.id

      WHERE p.id = ?
      `,
      [id]
    );

    if (players.length === 0) {
      return res.status(404).json({
        message: "Player not found"
      });
    }

    res.json(players[0]);

  } catch (error) {
    console.error("Player details error:", error);

    res.status(500).json({
      message: "Failed to fetch player",
      error: error.message
    });
  }
});

// ==========================================
// TEAMS FROM MYSQL
// ==========================================

app.get("/api/teams", async (req, res) => {
  try {
    const [teams] = await db.execute(`
      SELECT
        id,
        api_team_id,
        name,
        nickname,
        code,
        city,
        logo,
        all_star,
        nba_franchise,
        conference,
        division
      FROM teams
      WHERE nba_franchise = true
      ORDER BY name
    `);

    res.json(teams);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch teams",
      error: error.message
    });
  }
});

// ==========================================
// GET ONE TEAM BY DATABASE ID
// ==========================================

app.get("/api/teams/:id", async (req, res) => {
  try {
    const [teams] = await db.execute(
      `
      SELECT
        id,
        api_team_id,
        name,
        nickname,
        code,
        city,
        logo,
        all_star,
        nba_franchise,
        conference,
        division
      FROM teams
      WHERE id = ?
      `,
      [req.params.id]
    );

    if (teams.length === 0) {
      return res.status(404).json({
        message: "Team not found"
      });
    }

    res.json(teams[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch team",
      error: error.message
    });
  }
});

// ==========================================
// GET PLAYERS BELONGING TO ONE TEAM
// ==========================================

app.get("/api/teams/:id/players", async (req, res) => {
  try {
    const [players] = await db.execute(
      `
      SELECT
        id,
        api_player_id,
        first_name,
        last_name,
        position,
        jersey_number,
        birth_date,
        birth_country,
        height_feet,
        height_inches,
        height_meters,
        weight_pounds,
        weight_kilograms,
        college,
        nba_start_year,
        nba_experience,
        photo
      FROM players
      WHERE team_id = ?
      ORDER BY last_name, first_name
      `,
      [req.params.id]
    );

    res.json(players);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch team players",
      error: error.message
    });
  }
});

// ==========================================
// TEST API-SPORTS CONNECTION
// ==========================================

app.get("/api/nba-test", async (req, res) => {
  try {
    const response = await fetch(
      "https://v2.nba.api-sports.io/teams",
      {
        headers: {
          "x-apisports-key": API_KEY
        }
      }
    );

    const data = await response.json();

    res.json(data);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch NBA data",
      error: error.message
    });
  }
});

// ==========================================
// IMPORT NBA TEAMS
// ==========================================

app.get("/api/import-teams", async (req, res) => {
  try {
    const response = await fetch(
      "https://v2.nba.api-sports.io/teams",
      {
        headers: {
          "x-apisports-key": API_KEY
        }
      }
    );

    const data = await response.json();

    const nbaTeams = data.response.filter(
      (team) => team.nbaFranchise === true
    );

    for (const team of nbaTeams) {
      await db.execute(
        `
        INSERT INTO teams
        (
          api_team_id,
          name,
          nickname,
          code,
          city,
          logo,
          all_star,
          nba_franchise,
          conference,
          division
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          team.id,
          team.name,
          team.nickname,
          team.code,
          team.city,
          team.logo,
          team.allStar,
          team.nbaFranchise,
          team.leagues?.standard?.conference || null,
          team.leagues?.standard?.division || null
        ]
      );
    }

    res.json({
      message: "NBA teams imported successfully!",
      count: nbaTeams.length
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to import NBA teams",
      error: error.message
    });
  }
});

// ==========================================
// TEST NBA PLAYERS API
// ==========================================

app.get("/api/nba-players-test", async (req, res) => {
  try {
    const response = await fetch(
      "https://v2.nba.api-sports.io/players?team=1&season=2024",
      {
        headers: {
          "x-apisports-key": API_KEY
        }
      }
    );

    const data = await response.json();

    res.json(data);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch NBA players",
      error: error.message
    });
  }
});

// ==========================================
// IMPORT NBA PLAYERS
// ==========================================

app.get("/api/import-players", async (req, res) => {
  try {

    const [teams] = await db.execute(`
      SELECT
        t.id,
        t.api_team_id,
        t.name
      FROM teams t
      LEFT JOIN players p
        ON t.id = p.team_id
      WHERE t.nba_franchise = true
      GROUP BY t.id, t.api_team_id, t.name
      HAVING COUNT(p.id) = 0
    `);

    let totalPlayers = 0;
    let teamsProcessed = 0;

    console.log(
      `Teams remaining to import: ${teams.length}`
    );

    for (const team of teams) {

      console.log(
        `Importing players for ${team.name}...`
      );

      const response = await fetch(
        `https://v2.nba.api-sports.io/players?team=${team.api_team_id}&season=2024`,
        {
          headers: {
            "x-apisports-key": API_KEY
          }
        }
      );

      const data = await response.json();

      if (
        data.errors &&
        Object.keys(data.errors).length > 0
      ) {
        console.log(
          `Could not import ${team.name}:`,
          data.errors
        );

        await wait(7000);

        continue;
      }

      for (const player of data.response) {

        const standard =
          player.leagues?.standard ||
          player.leagues?.Standard ||
          {};

        await db.execute(
          `
          INSERT INTO players (
            api_player_id,
            first_name,
            last_name,
            team_id,
            position,
            jersey_number,
            birth_date,
            birth_country,
            height_feet,
            height_inches,
            height_meters,
            weight_pounds,
            weight_kilograms,
            college,
            nba_start_year,
            nba_experience
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

          ON DUPLICATE KEY UPDATE
            first_name = VALUES(first_name),
            last_name = VALUES(last_name),
            team_id = VALUES(team_id),
            position = VALUES(position),
            jersey_number = VALUES(jersey_number),
            birth_date = VALUES(birth_date),
            birth_country = VALUES(birth_country),
            height_feet = VALUES(height_feet),
            height_inches = VALUES(height_inches),
            height_meters = VALUES(height_meters),
            weight_pounds = VALUES(weight_pounds),
            weight_kilograms = VALUES(weight_kilograms),
            college = VALUES(college),
            nba_start_year = VALUES(nba_start_year),
            nba_experience = VALUES(nba_experience)
          `,
          [
            player.id,
            player.firstname,
            player.lastname,
            team.id,
            standard.pos || null,
            toNumberOrNull(standard.jersey),
            player.birth?.date || null,
            player.birth?.country || null,
            toNumberOrNull(player.height?.feets),
            toNumberOrNull(player.height?.inches),
            toNumberOrNull(player.height?.meters),
            toNumberOrNull(player.weight?.pounds),
            toNumberOrNull(player.weight?.kilograms),
            player.college || null,
            toNumberOrNull(player.nba?.start),
            toNumberOrNull(player.nba?.pro)
          ]
        );

        totalPlayers++;
      }

      teamsProcessed++;

      console.log(
        `${team.name} imported successfully.`
      );

      await wait(7000);
    }

    res.json({
      message: "Players imported successfully!",
      teamsProcessed: teamsProcessed,
      playersProcessed: totalPlayers
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to import players",
      error: error.message
    });
  }
});

// ==========================================
// USER REGISTRATION
// ==========================================

app.post("/api/auth/Signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    const [existingUsers] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "An account with this email already exists"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      `
      INSERT INTO users
      (name, email, password_hash)
      VALUES (?, ?, ?)
      `,
      [name, email, passwordHash]
    );

    res.status(201).json({
      message: "Account created successfully",
      userId: result.insertId
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create account",
      error: error.message
    });
  }
});

// ==========================================
// USER LOGIN
// ==========================================

app.post("/api/auth/Login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const [users] = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        accountType: user.account_type
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h"
      }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        account_type: user.account_type
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to login",
      error: error.message
    });
  }
});

// ==========================================
// TEST USERS
// ==========================================

app.get("/api/test-users", async (req, res) => {
  try {
    const [users] = await db.execute(
      "SELECT id, name, email, account_type, created_at FROM users"
    );

    res.json(users);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message
    });
  }
});

// ==========================================
// RAPIDAPI SCHEDULE TEST
// ==========================================

app.get("/api/schedule-test", async (req, res) => {
  try {

    const date = req.query.date || "2026-10-01";

    const url =
      `https://nba-api-free-data.p.rapidapi.com/nba-schedule-by-date?date=${date}`;

    const response = await fetch(url, {
      method: "GET",

      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host":
          "nba-api-free-data.p.rapidapi.com"
      }
    });

    const data = await response.json();

    res.json(data);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to fetch NBA schedule",
      error: error.message
    });
  }
});

// ==========================================
// API-SPORTS SCHEDULE TEST
// ==========================================

app.get("/api/nba-schedule-test", async (req, res) => {
  try {

    const date = req.query.date || "2026-10-05";

    const response = await fetch(
      `https://v2.nba.api-sports.io/games?date=${date}`,
      {
        headers: {
          "x-apisports-key": API_KEY
        }
      }
    );

    const data = await response.json();

    res.json(data);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to fetch NBA schedule",
      error: error.message
    });
  }
});

// ==========================================
// TEST POST
// ==========================================

app.post("/api/test-post", (req, res) => {
  console.log("POST request received!");
  console.log("Body:", req.body);

  res.json({
    message: "POST is working!",
    received: req.body
  });
});

// ==========================================
// LAST 5 GAMES FOR A PLAYER
// ==========================================

app.get("/api/players/:id/last-games", async (req, res) => {
  try {
    const { id } = req.params;

    // GET PLAYER FROM MYSQL
    const [players] = await db.execute(
      `
      SELECT
        first_name,
        last_name
      FROM players
      WHERE id = ?
      `,
      [id]
    );

    if (players.length === 0) {
      return res.status(404).json({
        message: "Player not found"
      });
    }

    const playerName =
      `${players[0].first_name} ${players[0].last_name}`;

    console.log("Looking up player:", playerName);

    // FIND PLAYER IN BIG BALLS
    const playerResponse = await fetch(
      `https://api.bigballsdata.com/v1/players?sport=basketball&league=nba&name=${encodeURIComponent(
        playerName
      )}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.BBS_API_KEY}`
        }
      }
    );

    const playerData = await playerResponse.json();

    console.log(
      "Big Balls player response:",
      playerData
    );

    if (!playerResponse.ok) {
      return res.status(500).json({
        message: "Big Balls player lookup failed",
        error: playerData
      });
    }

    if (
      !playerData.data ||
      playerData.data.length === 0
    ) {
      return res.status(404).json({
        message: `Player "${playerName}" was not found in Big Balls`
      });
    }

    const bbsPlayerId =
      playerData.data[0].id;

    console.log(
      "Big Balls player ID:",
      bbsPlayerId
    );

    // GET PLAYER GAME LOG
    const gamesResponse = await fetch(
      `https://api.bigballsdata.com/v1/players/${bbsPlayerId}/gamelog?sport=basketball&season=2025-26`,
      {
        headers: {
          Authorization: `Bearer ${process.env.BBS_API_KEY}`
        }
      }
    );

    const gamesData =
      await gamesResponse.json();

    console.log(
      "Big Balls games response:",
      gamesData
    );

    if (!gamesResponse.ok) {
      return res.status(500).json({
        message: "Failed to fetch player game log",
        error: gamesData
      });
    }

    if (
      !gamesData.data ||
      gamesData.data.length === 0
    ) {
      return res.status(404).json({
        message: "No game data found for this player"
      });
    }

    const lastFiveGames =
      gamesData.data.slice(0, 5);

    res.json(lastFiveGames);

  } catch (error) {

    console.error(
      "Last games error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch last 5 games",
      error: error.message
    });
  }
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});