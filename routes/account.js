var express = require('express');
var router = express.Router();

/* GET users listing. */
router.post('/login', function(req, res, next) {
    console.log(req.body.publicKey);
    res.send('respond with a resource');
});

module.exports = router;