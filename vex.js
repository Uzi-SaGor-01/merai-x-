const { spawn } = require("child_process");
const { readFileSync } = require("fs-extra");
const http = require("http");
const axios = require("axios");
const semver = require("semver");
const logger = require("./utils/log");
const chalk = require("chalk");
const express = require("express");

////////////////////////////////////////////////
//========= EXPRESS SERVER =========//
////////////////////////////////////////////////

const app = express();
const port = process.env.PORT || 5000;

app.listen(port, () =>
  logger(`Your app is listening at http://localhost:${port}`, "[ ONLINE ]")
);

logger("Opened server site...", "[ Starting ]");

app.get("/", (req, res) =>
  res.sendFile(__dirname + "/includes/index.html")
);

////////////////////////////////////////////////
//========= START BOT & AUTO RESTART =========//
////////////////////////////////////////////////

function startBot(message) {
  if (message) logger(message, "[ Starting ]");

  const child = spawn(
    "node",
    ["--trace-warnings", "--async-stack-traces", "Sagor.js"],
    {
      cwd: __dirname,
      stdio: "inherit",
      shell: true
    }
  );

  // Initialize restart counter
  if (!global.countRestart) global.countRestart = 0;

  child.on("close", (codeExit) => {
    // Restart only if bot crashed and restart limit not reached
    if (codeExit !== 0 && global.countRestart < 5) {
      global.countRestart++;
      startBot("Restarting bot...");
    }
  });

  child.on("error", (error) => {
    logger("An error occurred: " + JSON.stringify(error), "[ Starting ]");
  });
}

////////////////////////////////////////////////
//========= CHECK UPDATE FROM GITHUB =========//
////////////////////////////////////////////////

axios
  .get("https://raw.githubusercontent.com/Uzi-SaGor-01/sagor-bot-x/main/package.json")
  .then((res) => {
    if (res.data.name) logger(res.data.name, "[ NAME ]");
    if (res.data.version) logger("Version: " + res.data.version, "[ VERSION ]");
    if (res.data.description)
      logger(res.data.description, "[ DESCRIPTION ]");
  })
  .catch((err) => {
    logger("Failed to fetch update info", "[ ERROR ]");
  });

////////////////////////////////////////////////
//========= RUN BOT =========//
////////////////////////////////////////////////

startBot();
