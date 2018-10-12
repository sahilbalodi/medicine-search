const Hapi = require('hapi');
const vision = require('@google-cloud/vision');
const posTagger = require('wink-pos-tagger');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const data = require('../../data.json');

const medicineList = [];
data.forEach((medicine) => { medicineList.push(medicine.name); });

process.env.GOOGLE_APPLICATION_CREDENTIALS = 'secrets/index.json';
const client = new vision.ImageAnnotatorClient();
// Create an instance of the pos tagger.
const tagger = posTagger();
const posTokens = ['NN', 'NNS', 'NNP', 'NNPS'];
// , 'FW', 'RBR', 'RBS', 'RB'

const Port = 5001;
const server = new Hapi.Server();
server.connection({
  host: '0.0.0.0',
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
          // text.forEach((textAnnotations) => {
          const textAnnotations = text[0];
          const Lines = textAnnotations.description.split('\n');
          Lines.forEach((line) => {
            const tokens = tagger.tagSentence(line);
            let newLine = '';
            tokens.forEach((token) => {
              if (posTokens.indexOf(token.pos) !== -1) {
                newLine = `${newLine} ${token.value}`;
              }
            });
            if (newLine.length !== 0) { textAnnotationsDescriptions.push(newLine); }
          });
          // });
          response({ statusCode: 200, textAnnotationsDescriptions });
        })
        .catch((err) => {
          console.error('ERROR:', err);
        });
    },
  }, {
    method: 'POST',
    path: '/error',
    handler: (request, response) => {
      console.log(request.payload);
      response(request.payload);
    },
  }, {
    method: 'POST',
    path: '/image',
    handler: (request, response) => {
      console.log(request);
      const writeStream = fs.createWriteStream(path.resolve(__dirname, '../resources/test.jpeg'), { flags: 'w' });
      writeStream.write(request.payload.file);
      writeStream.end();
      client
        .textDetection(path.resolve(__dirname, '../resources/test.jpeg'))
        .then((results) => {
          const textAnnotationsDescriptions = [];
          const text = results[0].textAnnotations;
          const textAnnotations = text[0];
          const Lines = textAnnotations.description.split('\n');
          Lines.forEach((line) => {
            const tokens = tagger.tagSentence(line);
            let newLine = '';
            tokens.forEach((token) => {
              if (posTokens.indexOf(token.pos) !== -1) {
                newLine = `${newLine} ${token.value}`;
              }
            });
            if (newLine.length !== 0) { textAnnotationsDescriptions.push(newLine); }
          });
          textAnnotationsDescriptions.forEach((line) => {
            medicineList.forEach((medicine) => {
              if (line.indexOf(medicine) !== -1) {
                response({ statusCode: 200, data: _.find(data, ['name', medicine]) });
              }
            });
          });
          response({ statusCode: 200, message: 'NOT FOUND' });
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
