const express = require('express');

const webhookRouter = require('./webhooks');

const routerAggregator = express.Router();
routerAggregator.use(webhookRouter);

module.exports = routerAggregator;