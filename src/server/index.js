const Hapi = require('hapi');

const Port = 8080;
const server = new Hapi.Server();
server.connection({
  host: 'localhost',
  port: Port,
});

server.route({
  method: 'GET',
  path: '/ping',
  handler: (request, response) => {
    response({ statusCode: 200, message: 'pong' });
  },
});


const start = async () => {
  await server.start();
  console.log('server running at port :', server.info.uri);
};
start();
