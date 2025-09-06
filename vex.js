const { spawn } = require("child_process");
const axios = require("axios");
const express = require("express");
const logger = require("./utils/log");
const chalk = require("chalk");

// ================= EXPRESS SERVER =================
const app = express();
const port = process.env.PORT || 5000;

app.listen(port, () =>
  logger(`Your app is listening at http://localhost:${port}`, "[ ONLINE ]")
);

logger("Opened server site...", "[ Starting ]");

app.get('/', (req, res) => res.sendFile(__dirname+'/includes/index.html'));

// ================= GLOBAL CRASH HANDLER =================
const ADMIN_ID = "61579792988640"; // Admin UID
global.api = global.api || null; // Ensure api object exists

async function notifyAdmin(error) {
  try {
    if (!global.api) return;
    const message = `[BOT CRASH]\n${error.toString().slice(0, 500)}`;
    await global.api.sendMessage(message, ADMIN_ID);
  } catch (err) {
    console.error("[NOTIFY ADMIN FAILED]", err);
  }
}

process.on("uncaughtException", async (err) => {
  console.error("[UNCAUGHT EXCEPTION]", err);
  await notifyAdmin(err);
});

process.on("unhandledRejection", async (reason) => {
  console.error("[UNHANDLED REJECTION]", reason);
  await notifyAdmin(reason);
});

// ================= START BOT & AUTO RESTART =================
let restarting = false;

function startBot(message) {
  if (message && !restarting) logger(message, "[ Starting ]");

  const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "Sagor.js"], {
    cwd: __dirname,
    stdio: ["pipe", "pipe", "pipe"], // prevent duplicate logs
    shell: true
  });

  child.stdout.on("data", data => {
    const text = data.toString().trim();
    if (text) logger(text, "[ SAGOR ]");
  });

  child.stderr.on("data", data => {
    const text = data.toString().trim();
    if (text) logger(text, "[ ERROR ]");
    notifyAdmin(text);
  });

  child.on("close", codeExit => {
    if (codeExit !== 0 && !restarting) {
      restarting = true;
      logger(`Sagor.js crashed with code ${codeExit}! Restarting bot...`, "[ RESTART ]");
      setTimeout(() => {
        restarting = false;
        startBot("Restarting bot...");
      }, 3000);
    }
  });

  child.on("error", error => {
    logger("An error occurred: " + JSON.stringify(error), "[ ERROR ]");
    notifyAdmin(error);
  });
}

// ================= CHECK UPDATE FROM GITHUB =================
axios.get("https://raw.githubusercontent.com/Uzi-SaGor-01/sagor-bot-x/main/package.json")
  .then(res => {
    logger(res.data.name, "[ NAME ]");
    logger("Version: " + res.data.version, "[ VERSION ]");
    logger(res.data.description, "[ DESCRIPTION ]");
  })
  .catch(() => logger("Failed to fetch update info", "[ ERROR ]"));

// ================= RUN BOT =================
startBot();
