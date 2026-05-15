const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 4000;
const JWT_SECRET =
  process.env.JWT_SECRET || "korean_center_secret";

// ─────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ─────────────────────────────────────
// DATA PATHS
// ─────────────────────────────────────

const dataDir = path.join(__dirname, "data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const usersFile = path.join(dataDir, "users.json");
const statsFile = path.join(dataDir, "stats.json");
const xpFile = path.join(dataDir, "xp.json");

// create files

for (const file of [usersFile, statsFile, xpFile]) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "[]");
  }
}

// ─────────────────────────────────────
// HELPERS
// ─────────────────────────────────────

const readJSON = (file) => {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
};

const writeJSON = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

const createToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      login: user.login,
    },
    JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
};

// ─────────────────────────────────────
// AUTH MIDDLEWARE
// ─────────────────────────────────────

function auth(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({
        error: "Token yo'q",
      });
    }

    const token = header.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({
      error: "Token noto'g'ri",
    });
  }
}

// ─────────────────────────────────────
// REGISTER
// ─────────────────────────────────────

app.post("/api/register", async (req, res) => {
  try {
    const { name, login, pass } = req.body;

    if (!name || !login || !pass) {
      return res.status(400).json({
        error: "Barcha maydonlar kerak",
      });
    }

    const users = readJSON(usersFile);

    const exist = users.find(
      (u) => u.login === login.toLowerCase()
    );

    if (exist) {
      return res.status(400).json({
        error: "Login band",
      });
    }

    const hash = await bcrypt.hash(pass, 10);

    const user = {
      id: Date.now().toString(),
      name,
      login: login.toLowerCase(),
      pass: hash,
      createdAt: Date.now(),
    };

    users.push(user);

    writeJSON(usersFile, users);

    // stats

    const stats = readJSON(statsFile);

    stats.push({
      userId: user.id,
      xp: 0,
      testsCompleted: 0,
      totalAnswers: 0,
      correctAnswers: 0,
      completedWords: 0,
    });

    writeJSON(statsFile, stats);

    const token = createToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        login: user.login,
      },
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: "Server error",
    });
  }
});

// ─────────────────────────────────────
// LOGIN
// ─────────────────────────────────────

app.post("/api/login", async (req, res) => {
  try {
    const { login, pass } = req.body;

    const users = readJSON(usersFile);

    const user = users.find(
      (u) => u.login === login.toLowerCase()
    );

    if (!user) {
      return res.status(401).json({
        error: "User topilmadi",
      });
    }

    const match = await bcrypt.compare(
      pass,
      user.pass
    );

    if (!match) {
      return res.status(401).json({
        error: "Parol noto'g'ri",
      });
    }

    const token = createToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        login: user.login,
      },
    });
  } catch {
    res.status(500).json({
      error: "Server error",
    });
  }
});

// ─────────────────────────────────────
// ME
// ─────────────────────────────────────

app.get("/api/me", auth, (req, res) => {
  const users = readJSON(usersFile);

  const user = users.find(
    (u) => u.id === req.user.id
  );

  if (!user) {
    return res.status(404).json({
      error: "User topilmadi",
    });
  }

  const stats = readJSON(statsFile);

  const stat = stats.find(
    (s) => s.userId === user.id
  );

  res.json({
    user: {
      id: user.id,
      name: user.name,
      login: user.login,
    },
    stats: stat || {},
  });
});

// ─────────────────────────────────────
// UPDATE STATS
// ─────────────────────────────────────

app.post("/api/stats/update", auth, (req, res) => {
  const {
    xp,
    testsCompleted,
    totalAnswers,
    correctAnswers,
    completedWords,
  } = req.body;

  const stats = readJSON(statsFile);

  const index = stats.findIndex(
    (s) => s.userId === req.user.id
  );

  if (index === -1) {
    return res.status(404).json({
      error: "Stats topilmadi",
    });
  }

  stats[index] = {
    ...stats[index],
    xp,
    testsCompleted,
    totalAnswers,
    correctAnswers,
    completedWords,
    updatedAt: Date.now(),
  };

  writeJSON(statsFile, stats);

  res.json({
    ok: true,
  });
});

// ─────────────────────────────────────
// ADD XP
// ─────────────────────────────────────

app.post("/api/xp/add", auth, (req, res) => {
  const { xp, source, word_uz, word_kr } =
    req.body;

  const xpData = readJSON(xpFile);

  xpData.push({
    id: Date.now().toString(),
    userId: req.user.id,
    xp,
    source,
    word_uz,
    word_kr,
    createdAt: Date.now(),
  });

  writeJSON(xpFile, xpData);

  const stats = readJSON(statsFile);

  const index = stats.findIndex(
    (s) => s.userId === req.user.id
  );

  if (index !== -1) {
    stats[index].xp += xp;
  }

  writeJSON(statsFile, stats);

  res.json({
    ok: true,
  });
});

// ─────────────────────────────────────
// RANKING
// ─────────────────────────────────────

app.get("/api/ranking", (req, res) => {
  const users = readJSON(usersFile);

  const stats = readJSON(statsFile);

  const ranking = users.map((user) => {
    const stat = stats.find(
      (s) => s.userId === user.id
    );

    return {
      id: user.id,
      name: user.name,
      login: user.login,
      xp: stat?.xp || 0,
      testsCompleted:
        stat?.testsCompleted || 0,
      completedWords:
        stat?.completedWords || 0,
    };
  });

  ranking.sort((a, b) => b.xp - a.xp);

  res.json(ranking);
});

// ─────────────────────────────────────
// HEALTH
// ─────────────────────────────────────

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    server: "working",
    time: new Date().toISOString(),
  });
});

// ─────────────────────────────────────
// 404
// ─────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint topilmadi",
  });
});

// ─────────────────────────────────────
// START
// ─────────────────────────────────────

app.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT}`
  );
});