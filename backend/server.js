require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcrypt");

const app = express();

const PORT = 5000;
const API_KEY = process.env.API_SPORTS_KEY;

// Convert empty API values into NULL for MySQL
function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isNaN(number) ? null : number;
}

// Wait function to slow down API requests
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Allow React frontend to communicate with backend
app.use(cors());
app.use(express.json());


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
// PLAYERS FROM MYSQL
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
// Get one team by database ID
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


// Get players belonging to one team
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

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check that all fields were provided
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    // Check if the email already exists
    const [existingUsers] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "An account with this email already exists"
      });
    }

    // Hash the password before storing it
    const passwordHash = await bcrypt.hash(password, 10);

    // Save the user
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
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});