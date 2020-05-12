var fs = require('fs');
var https = require('https');
const express = require('express');
const app = express();
const path = require('path');

const cors = require('cors');
// Allow cross-origin resource sharing
app.use(cors());
app.options("*", cors());

const AccessToken = require('twilio').jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;
require('dotenv').config();

const MAX_ALLOWED_SESSION_DURATION = 14400;
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioApiKeySID = process.env.TWILIO_API_KEY_SID;
const twilioApiKeySecret = process.env.TWILIO_API_KEY_SECRET;

app.use(express.static(path.join(__dirname, 'build')));

app.get('/token', (req, res) => {

  const { identity, roomName } = req.query;
  const token = new AccessToken(twilioAccountSid, twilioApiKeySID, twilioApiKeySecret, {
    ttl: MAX_ALLOWED_SESSION_DURATION,
  });
  token.identity = identity;
  const videoGrant = new VideoGrant({ room: roomName });
  token.addGrant(videoGrant);
  res.send(token.toJwt());
  console.log(`issued token for ${identity} in room ${roomName}`);
});

app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'build/index.html')));

var options = {
  key: fs.readFileSync('./file.pem'),
  cert: fs.readFileSync('./file.crt')
};

var server = https.createServer( options, app );
const mysocketserver = require('./mysocketserver');
mysocketserver.initSocketServer(server);

const PORT = process.env.PORT || 443;
server.listen(PORT, () => { 
  console.log(`server run at ${PORT} port`);
})

// let server = app.listen(PORT, (req, res) => {
//   console.log(`Server Started at PORT ${PORT}`);
// });

