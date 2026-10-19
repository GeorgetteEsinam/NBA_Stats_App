require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


const PORT = 5000;
const API_KEY = process.env.API_SPORTS_KEY;

const { randomUUID } = require("crypto");

const EXPRESSPAY_MERCHANT_ID =
  process.env.EXPRESSPAY_MERCHANT_ID;

const EXPRESSPAY_API_KEY =
  process.env.EXPRESSPAY_API_KEY;

const EXPRESSPAY_BASE_URL =
  process.env.EXPRESSPAY_ENV === "live"
    ? "https://expresspaygh.com/api"
    : "https://sandbox.expresspaygh.com/api";

const PRO_PLANS = {
  monthly: {
    amount: 110,
    durationMonths: 1,
    description: "NBA Stats Pro - 1 month"
  },
  yearly: {
    amount: 1100,
    durationMonths: 12,
    description: "NBA Stats Pro - 1 year"
  }
};

const PRO_CURRENCY = "GHS";


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

function getPublicApiUrl() {
  const url = process.env.PUBLIC_API_URL;

  if (!url || !url.startsWith("https://")) {
    throw new Error(
      "PUBLIC_API_URL must be configured with a public HTTPS URL"
    );
  }

  return url.replace(/\/+$/, "");
}

async function queryExpressPay(token) {
  const response = await fetch(
    `${EXPRESSPAY_BASE_URL}/query.php`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        "merchant-id": EXPRESSPAY_MERCHANT_ID,
        "api-key": EXPRESSPAY_API_KEY,
        token
      })
    }
  );

  if (!response.ok) {
    throw new Error("ExpressPay Query API request failed");
  }

  return response.json();
}

// Verify a transaction with ExpressPay and update our records.
// A browser redirect or callback alone is never proof of payment.

async function verifyAndUpdatePayment(orderId, token) {
  const [payments] = await db.execute(
    "SELECT * FROM payments WHERE order_id = ?",
    [orderId]
  );

  if (!payments.length) {
    return { found: false, status: "not_found" };
  }

  const payment = payments[0];

  if (
    !payment.expresspay_token ||
    payment.expresspay_token !== token
  ) {
    return { found: true, verified: false };
  }

  // A successful payment must never renew the subscription twice.
  if (payment.status === "approved") {
    return { found: true, verified: true, status: "approved" };
  }

  // Do not reprocess declined or errored payments.
  if (payment.status !== "pending") {
    return {
      found: true,
      verified: true,
      status: payment.status
    };
  }

  const result = await queryExpressPay(token);

  const sameOrder = String(result["order-id"]) === String(orderId);
  const sameToken = String(result.token) === String(token);
  const sameAmount = Number(result.amount) === Number(payment.amount);
  const sameCurrency =
    String(result.currency).toUpperCase() ===
    String(payment.currency).toUpperCase();

  if (!sameOrder || !sameToken || !sameAmount || !sameCurrency) {
    return { found: true, verified: false };
  }

  const transactionId =
    result["transaction-id"] ||
    result.transaction_id ||
    null;

  if (Number(result.result) === 1) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [currentRows] = await connection.execute(
        "SELECT * FROM payments WHERE order_id = ? FOR UPDATE",
        [orderId]
      );

      if (!currentRows.length) {
        throw new Error("Payment record disappeared");
      }

      const current = currentRows[0];

      // Revalidate the locked record before granting access.
      if (
        current.expresspay_token !== token ||
        Number(current.amount) !== Number(result.amount) ||
        String(current.currency).toUpperCase() !==
          String(result.currency).toUpperCase()
      ) {
        throw new Error("Payment details changed during verification");
      }

      if (current.status === "pending") {
       
await connection.execute(
  `UPDATE users
   SET account_type = 'pro',
       pro_cancelled_at = NULL,
       pro_expires_at = DATE_ADD(
         GREATEST(
           COALESCE(pro_expires_at, UTC_TIMESTAMP()),
           UTC_TIMESTAMP()
         ),
         INTERVAL ? MONTH
       )
   WHERE id = ?`,
  [plan.durationMonths, current.user_id]
);


        await connection.execute(
          `UPDATE payments
           SET status = 'approved', transaction_id = ?
           WHERE order_id = ? AND status = 'pending'`,
          [transactionId, orderId]
        );

        await connection.execute(
          `UPDATE users
           SET account_type = 'pro',
               pro_expires_at = DATE_ADD(
                 GREATEST(
                   COALESCE(pro_expires_at, UTC_TIMESTAMP()),
                   UTC_TIMESTAMP()
                 ),
                 INTERVAL ? MONTH
               )
           WHERE id = ?`,
          [plan.durationMonths, current.user_id]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return { found: true, verified: true, status: "approved" };
  }

  if (Number(result.result) === 2) {
    await db.execute(
      `UPDATE payments
       SET status = 'declined'
       WHERE order_id = ? AND status = 'pending'`,
      [orderId]
    );

    return { found: true, verified: true, status: "declined" };
  }

  if (Number(result.result) === 4) {
    return { found: true, verified: true, status: "pending" };
  }

  await db.execute(
    `UPDATE payments
     SET status = 'error'
     WHERE order_id = ? AND status = 'pending'`,
    [orderId]
  );

  return { found: true, verified: true, status: "error" };
}


// Start a monthly Pro payment.

app.post(
  "/api/payments/expresspay/create",
  authenticateToken,
  async (req, res) => {
    try {
      if (!EXPRESSPAY_MERCHANT_ID || !EXPRESSPAY_API_KEY) {
        return res.status(500).json({
          message: "ExpressPay credentials are not configured"
        });
      }

      const { billingPeriod } = req.body;
      const selectedPlan = PRO_PLANS[billingPeriod];

      if (!selectedPlan) {
        return res.status(400).json({
          message: "Please select a valid subscription plan"
        });
      }

      const [users] = await db.execute(
        `SELECT id, name, email, account_type, pro_expires_at
         FROM users
         WHERE id = ?`,
        [req.user.userId]
      );

      if (!users.length) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      const user = users[0];

      if (
        user.account_type === "pro" &&
        user.pro_expires_at &&
        new Date(user.pro_expires_at) > new Date()
      ) {
        return res.status(409).json({
          message: "You already have active Pro access",
          proExpiresAt: user.pro_expires_at
        });
      }

      const publicUrl = getPublicApiUrl();
      const orderId = `NBA-${randomUUID()}`;
      const nameParts = user.name.trim().split(/\s+/);
      const firstname = nameParts.shift() || "NBA";
      const lastname = nameParts.join(" ") || "Stats";

      // Save the selected plan before contacting ExpressPay.
      await db.execute(
        `INSERT INTO payments
         (user_id, order_id, amount, currency, billing_period, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [
          user.id,
          orderId,
          selectedPlan.amount,
          PRO_CURRENCY,
          billingPeriod
        ]
      );

      const response = await fetch(
        `${EXPRESSPAY_BASE_URL}/submit.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            "merchant-id": EXPRESSPAY_MERCHANT_ID,
            "api-key": EXPRESSPAY_API_KEY,
            firstname,
            lastname,
            email: user.email,
            currency: PRO_CURRENCY,
            amount: String(selectedPlan.amount),
            "order-id": orderId,
            "order-desc": selectedPlan.description,
            "redirect-url": `${publicUrl}/api/payments/expresspay/return`,
            "post-url": `${publicUrl}/api/payments/expresspay/callback`
          })
        }
      );

      const result = await response.json();

      
if (
  !response.ok ||
  Number(result.status) !== 1 ||
  !result.token ||
  String(result["order-id"]) !== orderId
) {
  await db.execute(
    `UPDATE payments
     SET status = 'error'
     WHERE order_id = ? AND status = 'pending'`,
    [orderId]
  );

  return res.status(502).json({
    message: "ExpressPay could not start the checkout"
  });
}


      await db.execute(
        `UPDATE payments
         SET expresspay_token = ?
         WHERE order_id = ? AND status = 'pending'`,
        [result.token, orderId]
      );

     res.json({
  orderId,
  checkoutUrl: `${EXPRESSPAY_BASE_URL}/checkout.php?token=${encodeURIComponent(result.token)}`,
  checkoutToken: result.token
});
    } catch (error) {
      console.error("ExpressPay create error:", error.message);

      res.status(500).json({
        message: "Unable to start payment"
      });
    }
  }
);


// Check the payment status for the logged-in user.
app.get(
  "/api/payments/expresspay/status/:orderId",
  authenticateToken,
  async (req, res) => {
    try {
      const [payments] = await db.execute(
        `SELECT order_id, expresspay_token, status, amount,
                currency, created_at
         FROM payments
         WHERE order_id = ? AND user_id = ?`,
        [req.params.orderId, req.user.userId]
      );

      if (!payments.length) {
        return res.status(404).json({
          message: "Payment not found"
        });
      }

      const payment = payments[0];

      // Re-query ExpressPay for any payment that isn't final.
      if (
        payment.status === "pending" &&
        payment.expresspay_token
      ) {
        await verifyAndUpdatePayment(
          payment.order_id,
          payment.expresspay_token
        );
      }

      const [updated] = await db.execute(
        `SELECT order_id, status, amount, currency, created_at
         FROM payments
         WHERE order_id = ? AND user_id = ?`,
        [req.params.orderId, req.user.userId]
      );

      const [users] = await db.execute(
        `SELECT account_type, pro_expires_at
         FROM users WHERE id = ?`,
        [req.user.userId]
      );

      res.json({
        payment: updated[0],
        pro: users[0]
      });

    } catch (error) {
      console.error("Payment status error:", error.message);

      res.status(500).json({
        message: "Unable to check payment status"
      });
    }
  }
);

// Browser redirect after checkout. This does NOT grant Pro by itself.
app.get(
  "/api/payments/expresspay/return",
  async (req, res) => {
    try {
      const orderId = req.query["order-id"];
      const token = req.query.token;

      if (typeof orderId !== "string" ||
          typeof token !== "string") {
        return res.status(400).send("Missing payment reference");
      }

      await verifyAndUpdatePayment(orderId, token);

      // Replace this with your actual frontend result page URL.
      const frontendUrl = process.env.FRONTEND_URL;

      if (!frontendUrl) {
        return res.status(500).send(
          "FRONTEND_URL is not configured"
        );
      }

      res.redirect(
        `${frontendUrl.replace(/\/+$/, "")}/payment-result?orderId=${encodeURIComponent(orderId)}`
      );

    } catch (error) {
      console.error("ExpressPay return error:", error.message);
      res.status(500).send("Unable to verify payment");
    }
  }
);

// Mobile-money callback. Always query ExpressPay again.
app.post(
  "/api/payments/expresspay/callback",
  async (req, res) => {
    // Acknowledge promptly as required by the documentation.
    res.sendStatus(200);

    const orderId = req.body["order-id"];
    const token = req.body.token;

    if (typeof orderId !== "string" ||
        typeof token !== "string") {
      return;
    }

    try {
      await verifyAndUpdatePayment(orderId, token);
    } catch (error) {
      console.error(
        "ExpressPay callback verification error:",
        error.message
      );
    }
  }
);


// ==========================================
// MIDDLEWARE
// ==========================================



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
        pro_expires_at,
        pro_cancelled_at,
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

/* ==========================================
   CANCEL PRO SUBSCRIPTION
========================================== */

app.post(
  "/api/subscription/cancel",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;

      const [users] = await db.execute(
        `SELECT
           id,
           account_type,
           pro_expires_at,
           pro_cancelled_at,
           (pro_expires_at > UTC_TIMESTAMP()) AS has_active_pro
         FROM users
         WHERE id = ?`,
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      const user = users[0];

      if (
        user.account_type !== "pro" ||
        !user.has_active_pro
      ) {
        return res.status(400).json({
          message: "You do not have an active Pro subscription to cancel."
        });
      }

      // Do not record the cancellation twice.
      if (user.pro_cancelled_at) {
        return res.json({
          message: "Your cancellation has already been recorded.",
          cancelled: true,
          proExpiresAt: user.pro_expires_at,
          cancelledAt: user.pro_cancelled_at
        });
      }

      await db.execute(
        `UPDATE users
         SET pro_cancelled_at = UTC_TIMESTAMP()
         WHERE id = ?
           AND pro_cancelled_at IS NULL`,
        [userId]
      );

      const [updatedUsers] = await db.execute(
        `SELECT pro_expires_at, pro_cancelled_at
         FROM users
         WHERE id = ?`,
        [userId]
      );

      res.json({
        message: "Your cancellation request has been recorded.",
        cancelled: true,
        proExpiresAt: updatedUsers[0].pro_expires_at,
        cancelledAt: updatedUsers[0].pro_cancelled_at
      });

    } catch (error) {
      console.error("Cancel subscription error:", error);

      res.status(500).json({
        message: "Unable to record your cancellation. Please try again."
      });
    }
  }
);


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
// PLAYER SEASON AVERAGES
// ==========================================

app.get("/api/players/:id/averages", async (req, res) => {
  try {
    const { id } = req.params;
    const season = Number.parseInt(req.query.season || "2024", 10);

    const [players] = await db.execute(
      `SELECT api_player_id, first_name, last_name
       FROM players
       WHERE id = ?`,
      [id]
    );

    if (!players.length) {
      return res.status(404).json({
        message: "Player not found",
      });
    }

    const apiPlayerId = players[0].api_player_id;

    const response = await fetch(
      `https://v2.nba.api-sports.io/players/statistics?id=${apiPlayerId}&season=${season}`,
      {
        headers: {
          "x-apisports-key": API_KEY,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || (data.errors &&
        Object.keys(data.errors).length > 0)) {
      return res.status(502).json({
        message: "Could not fetch player statistics",
        details: data.errors,
      });
    }

    const games = Array.isArray(data.response)
      ? data.response
      : [];

    const playedGames = games.filter((game) => {
      const minutes = Number.parseFloat(game.min);
      return Number.isFinite(minutes) && minutes > 0;
    });

    const total = (field) =>
      playedGames.reduce(
        (sum, game) => sum + (Number(game[field]) || 0),
        0
      );

    const gp = playedGames.length;

    res.json({
      player: `${players[0].first_name} ${players[0].last_name}`,
      season,
      gp,
      ppg: gp ? Number((total("points") / gp).toFixed(1)) : null,
      rpg: gp ? Number((total("totReb") / gp).toFixed(1)) : null,
      apg: gp ? Number((total("assists") / gp).toFixed(1)) : null,
    });
  } catch (error) {
    console.error("Player averages error:", error);

    res.status(500).json({
      message: "Failed to fetch player averages",
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
      `https://api.bigballsdata.com/v1/players/${bbsPlayerId}/gamelog?sport=basketball&season=2025`,
      {
        headers: {
          Authorization: `Bearer ${process.env.BBS_API_KEY}`
        }
      }
    );

    const gamesData =
      await gamesResponse.json();
      console.log("Game log status:", gamesResponse.status);
console.log("Game log response:", JSON.stringify(gamesData, null, 2));

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
 // NBA CONFERENCE STANDINGS
 // ==========================================

app.get("/api/standings", async (req, res) => {
  try {
    
    const season = req.query.season || "2024";

    const response = await fetch(
      `https://v2.nba.api-sports.io/standings?league=standard&season=${season}`,
      {
        headers: {
          "x-apisports-key": API_KEY,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || data.errors &&
        Object.keys(data.errors).length > 0) {
      console.error("Standings API error:", data.errors);

      return res.status(response.status || 502).json({
        message: "Failed to fetch NBA standings",
      });
    }

    res.json(data.response || []);
  } catch (error) {
    console.error("Standings error:", error);

    res.status(500).json({
      message: "Failed to fetch NBA standings",
    });
  }
});


 // =================================== =======
 // FAVORITE TEAMS AND PLAYERS
 // ==========================================

// GET THE LOGGED-IN USER'S FAVORITE TEAMS
app.get("/api/favorites/teams", authenticateToken, async (req, res) => {
  try {
    const [teams] = await db.execute(
      `
      SELECT
        t.id,
        t.api_team_id,
        t.name,
        t.nickname,
        t.code,
        t.city,
        t.logo,
        t.conference,
        t.division
      FROM user_favorite_teams f
      JOIN teams t ON t.id = f.team_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
      `,
      [req.user.userId]
    );

    res.json(teams);
  } catch (error) {
    console.error("Get favorite teams error:", error);
    res.status(500).json({ message: "Failed to fetch favorite teams" });
  }
});


// ADD A FAVORITE TEAM
app.post("/api/favorites/teams", authenticateToken, async (req, res) => {
  try {
    const teamId = Number(req.body.teamId);

    if (!Number.isSafeInteger(teamId) || teamId <= 0) {
      return res.status(400).json({ message: "A valid team ID is required" });
    }

    const [teams] = await db.execute(
      "SELECT id FROM teams WHERE id = ? AND nba_franchise = TRUE",
      [teamId]
    );

    if (teams.length === 0) {
      return res.status(404).json({ message: "NBA team not found" });
    }

    await db.execute(
      `
      INSERT IGNORE INTO user_favorite_teams (user_id, team_id)
      VALUES (?, ?)
      `,
      [req.user.userId, teamId]
    );

    res.status(200).json({ message: "Favorite team saved successfully" });
  } catch (error) {
    console.error("Add favorite team error:", error);
    res.status(500).json({ message: "Failed to save favorite team" });
  }
});


// REMOVE A FAVORITE TEAM
app.delete("/api/favorites/teams/:teamId", authenticateToken, async (req, res) => {
  try {
    const teamId = Number(req.params.teamId);

    if (!Number.isSafeInteger(teamId) || teamId <= 0) {
      return res.status(400).json({ message: "A valid team ID is required" });
    }

    await db.execute(
      "DELETE FROM user_favorite_teams WHERE user_id = ? AND team_id = ?",
      [req.user.userId, teamId]
    );

    res.json({ message: "Favorite team removed successfully" });
  } catch (error) {
    console.error("Remove favorite team error:", error);
    res.status(500).json({ message: "Failed to remove favorite team" });
  }
});


// GET THE LOGGED-IN USER'S FAVORITE PLAYERS
app.get("/api/favorites/players", authenticateToken, async (req, res) => {
  try {
    const [players] = await db.execute(
      `
      SELECT
        p.id,
        p.api_player_id,
        p.first_name,
        p.last_name,
        p.position,
        p.jersey_number,
        p.photo,
        t.id AS team_id,
        t.name AS team,
        t.nickname AS team_nickname,
        t.code AS team_code,
        t.logo AS team_logo
      FROM user_favorite_players f
      JOIN players p ON p.id = f.player_id
      LEFT JOIN teams t ON t.id = p.team_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
      `,
      [req.user.userId]
    );

    res.json(players);
  } catch (error) {
    console.error("Get favorite players error:", error);
    res.status(500).json({ message: "Failed to fetch favorite players" });
  }
});


// ADD A FAVORITE PLAYER
app.post("/api/favorites/players", authenticateToken, async (req, res) => {
  try {
    const playerId = Number(req.body.playerId);

    if (!Number.isSafeInteger(playerId) || playerId <= 0) {
      return res.status(400).json({ message: "A valid player ID is required" });
    }

    const [players] = await db.execute(
      "SELECT id FROM players WHERE id = ?",
      [playerId]
    );

    if (players.length === 0) {
      return res.status(404).json({ message: "Player not found" });
    }

    await db.execute(
      `
      INSERT IGNORE INTO user_favorite_players (user_id, player_id)
      VALUES (?, ?)
      `,
      [req.user.userId, playerId]
    );

    res.status(200).json({ message: "Favorite player saved successfully" });
  } catch (error) {
    console.error("Add favorite player error:", error);
    res.status(500).json({ message: "Failed to save favorite player" });
  }
});


// REMOVE A FAVORITE PLAYER
app.delete("/api/favorites/players/:playerId", authenticateToken, async (req, res) => {
  try {
    const playerId = Number(req.params.playerId);

    if (!Number.isSafeInteger(playerId) || playerId <= 0) {
      return res.status(400).json({ message: "A valid player ID is required" });
    }

    await db.execute(
      "DELETE FROM user_favorite_players WHERE user_id = ? AND player_id = ?",
      [req.user.userId, playerId]
    );

    res.json({ message: "Favorite player removed successfully" });
  } catch (error) {
    console.error("Remove favorite player error:", error);
    res.status(500).json({ message: "Failed to remove favorite player" });
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