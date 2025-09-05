touconst fs = require("fs");
const login = require("sagor-z-fca");

var credentials = {email: "FB_EMAIL", password: "FB_PASSWORD"}; // credential information

login(credentials, (err, api) => {
    if(err) return console.error(err);
    // login
    fs.writeFileSync('Sagorstate.json', JSON.stringify(api.getAppState())); //create appstate
});
