const { spawn } = require("child_process");
const { readFileSync } = require("fs-extra");
const http = require("http");
const axios = require("axios");
const semver = require("semver");
const logger = require("./utils/log");
const chalk = require("chalk");
const express = require("express");
const Monitor = require("ping-monitor");

////////////////////////////////////////////////
//========= CHECK UPTIME =========//
////////////////////////////////////////////////

const slug = process.env.REPL_SLUG || "sagor-bot-x";  // fallback name
const owner = process.env.REPL_OWNER || "Uzi-SaGor-01"; // fallback owner
const uptimelink = [`https://${slug}.${owner}.repl.co`];

for (const now of uptimelink) {
  const monitor = new Monitor({
    website: now,
    title: "Cliff",
    interval: 59,
    config: {
      intervalUnits: "seconds"
    }
  });

  monitor.on("up", (res) =>
    console.log(
      chalk.bold.hex("#BF00FF")("[ UP ] ❯ ") +
        chalk.hex("#BF00FF")(`${res.website}`)
    )
  );
  monitor.on("down", (res) =>
    console.log(
      chalk.bold.hex("#FF0000")("[ DOWN ] ❯ ") +
        chalk.hex("#FF0000")(`${res.website} ${res.statusMessage}`)
    )
  );
  monitor.on("stop", (website) =>
    console.log(
      chalk.bold.hex("#FF0000")("[ STOP ] ❯ ") +
        chalk.hex("#FF0000")(`${website}`)
    )
  );
  monitor.on("error", (error) =>
    console.log(
      chalk.bold.hex("#FF0000")("[ ERROR ] ❯ ") +
        chalk.hex("#FF0000")(`${error}`)
    )
  );
}

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

  child.on("close", (codeExit) => {
    if (codeExit != 0 || (global.countRestart && global.countRestart < 5)) {
      startBot("Restarting bot...");
      global.countRestart = (global.countRestart || 0) + 1;
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
    logger(res.data.name, "[ NAME ]");
    logger("Version: " + res.data.version, "[ VERSION ]");
    logger(res.data.description, "[ DESCRIPTION ]");
  })
  .catch((err) => {
    logger("Failed to fetch update info", "[ ERROR ]");
  });

////////////////////////////////////////////////
//========= RUN BOT =========//
////////////////////////////////////////////////

startBot();
