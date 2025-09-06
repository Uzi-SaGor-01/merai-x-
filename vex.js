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

let restarting = false; // Avoid duplicate restarts

function startBot(message) {
  if (message && !restarting) logger(message, "[ Starting ]");

  const child = spawn(
    "node",
    ["--trace-warnings", "--async-stack-traces", "Sagor.js"],
    {
      cwd: __dirname,
      stdio: ["pipe", "pipe", "pipe"], // ⚡ Pipe prevents double logs
      shell: true
    }
  );

  // Capture stdout and stderr from Sagor.js
  child.stdout.on("data", (data) => {
    const text = data.toString().trim();
    if (text) logger(text, "[ SAGOR ]");
  });

  child.stderr.on("data", (data) => {
    const text = data.toString().trim();
    if (text) logger(text, "[ ERROR ]");
  });

  // Restart logic if Sagor.js crashes
  child.on("close", (codeExit) => {
    if (codeExit !== 0 && !restarting) {
      restarting = true;
      logger("Sagor.js crashed! Restarting bot...", "[ RESTART ]");
      setTimeout(() => {
        restarting = false;
        startBot();
      }, 3000);
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
  .catch(() => {
    logger("Failed to fetch update info", "[ ERROR ]");
  });

////////////////////////////////////////////////
//========= RUN BOT =========//
////////////////////////////////////////////////

startBot();
