const http = require('http');
const app = require('./app.js');

let server = http.createServer(app);

let port = process.env.PORT || 1337;
server.listen(port);

console.log("Server running at http://localhost:%d", port);
module.exports = app;
