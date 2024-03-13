const http = require('http');
const app = require('./app');
const port = process.env.PORT || 3000;
const server = http.createServer(app);
server.listen(port);


//Atlas username: paoloduenas
//Atlas password: 9CpOksPZQyee9Jz6

//Atlas Admin username: Admin   
//Atlas Admin password: lQUJvW8YeRevd5UE