const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  apiKey: process.env.API_KEY,
  port: process.env.PORT,
  proxyAddress: process.env.PROXY_ADDRESS
};