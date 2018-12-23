var express = require('express');
var db = require('../db');
var router = express.Router();

/* GET users listing. */
router.post('/login', function(req, res, next) {
    let public_key = req.body.public_key;
    checkIsValidAccount(public_key);
    res.send('respond with a resource');
});

const checkIsValidAccount = async (public_key) =>{
  let result = await db.accounts.findOne({public_key: public_key});
  console.log(result);
};

module.exports = router;