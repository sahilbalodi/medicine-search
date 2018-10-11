const Hapi = require('hapi');
const vision = require('@google-cloud/vision');
const path = require('path');

process.env.GOOGLE_APPLICATION_CREDENTIALS = 'secrets/index.json';

const client = new vision.ImageAnnotatorClient();

const Port = 8080;
const server = new Hapi.Server();
server.connection({
  host: 'localhost',
  port: Port,
});

server.route([
  {
    method: 'GET',
    path: '/ping',
    handler: (request, response) => {
      response({ statusCode: 200, message: 'pong' });
    },
  }, {
    method: 'GET',
    path: '/description',
    handler: (request, response) => {
      client
        .textDetection(path.resolve(__dirname, '../resources/test.jpeg'))
        .then((results) => {
          const textAnnotationsDescriptions = [];
          const text = results[0].textAnnotations;
          text.forEach((textAnnotations) => {
            const Lines = textAnnotations.description.split('\n');
            Lines.forEach((line) => {
              textAnnotationsDescriptions.push(line);
            });
          });
          response({ statusCode: 200, textAnnotationsDescriptions });
        })
        .catch((err) => {
          console.error('ERROR:', err);
        });
    },
  }]);


const start = async () => {
  await server.start();
  console.log('server running at port :', server.info.uri);
};
start();
