var express = require('express');
var router = express.Router();
var db = require('../db');

/* GET users listing. */
router.get('/', async function(req, res, next) {
   let result = await db.accounts.find({});
   res.send(result);
});

module.exports = router;
