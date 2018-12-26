var express = require('express');
var db = require('../db');
var router = express.Router();
var loadash = require('lodash');
var {RpcClient} = require('tendermint');
let client = RpcClient('wss://dragonfly.forest.network:443');

/* GET users listing. */
router.post('/login', async function(req, res, next) {
    let public_key = req.body.public_key;
    var result = await checkIsValidAccount(public_key);
    console.log(result);
    res.send({status: result});
});

router.post('/getAccountInfo', async function(req,res,next) {
    let public_key = req.body.public_key;
    let account = await db.accounts.findOne({public_key: public_key});
    console.log(account);
    res.send(account);
});

router.post('/followers', async function(req, res, next){
    let public_key = req.body.public_key;
    let listFollowers = await getListFollersByPublicKey(public_key);
    console.log(listFollowers);
    res.send(listFollowers);
});

router.post('/followings', async function(req, res, next){
    let public_key = req.body.public_key;
    let listFollowings =  await getListFollowingsByPublicKey(public_key);
    console.log(listFollowings);
    res.send(listFollowings);

});

router.post('/updateAccount', async function(req,res, next) {
   let tx = req.body.tx;
   console.log(tx);
   var result = await client.broadcastTxCommit({
        tx: tx,
   });

   console.log(result);
   res.send(result);
});

router.post('/listForFollowings', async function (req,res, next){
    let public_key = req.body.public_key;
    console.log("PUBLICKEY : " + public_key);


    let account = await db.accounts.find({public_key: public_key});
    let topAccount = await  db.accounts.find({});
   console.log("FOLLOWED DATA");
    // for(var accountIndex = 0; accountIndex < 50; accountIndex++){
    //     var currentAccount = topAccount[accountIndex];
    //
    //     var isFollowed = false;
    //     for(var i = 0; i < listFollowed.length; i++){
    //         if(currentAccount.public_key === listFollowed[i].address){
    //             isFollowed = true;
    //             break;
    //         }
    //     }
    //
    //     if(!isFollowed){
    //         listReuslt.push(currentAccount);
    //     }
    // }
    res.send(topAccount.slice(1,50));
});

router.post('/payment', async function(req, res, next){
    let tx = req.body.tx;
    console.log(tx);
    var result = await client.broadcastTxCommit({
        tx: tx,
    });

    var status = 0;
    console.log("CURRENT HEIGHT : " + result.height);
    if(result.height > 0){
        status = 1;
    }
    console.log("STATUS :" + status);
    res.send({status: status});
});

router.post('/post', async function (req,res,next) {
    let tx = req.body.tx;
    console.log(tx);
    var result = await client.broadcastTxCommit({
        tx: tx,
    });

    var status = 1;
    res.send({status: status});
});





router.post('/lastSequence', async function(req, res,) {
    let sequence = await  getAccountLastSequence(req.body.public_key);
    res.send({sequence : sequence});
});

const getAccountLastSequence = async (publicKey) =>{
  var account = await db.accounts.findOne({public_key: publicKey});
  if(account){
      return account.sequence;
  }

  return -1;
};

const checkIsValidAccount = async (public_key) =>{
  let result = await db.accounts.findOne({public_key: public_key});
  if(result != null){
      return 1;
  }

  return 0;
};


const getListFollersByPublicKey = async (public_key) =>{
    let account = await  db.accounts.findOne({public_key: public_key});
    if(account){
        if(account.followers && account.followers.length > 0){
            var listFollowers = [];
            for(var itemIndex = 0; itemIndex < account.followers.length; itemIndex++) {
                let item = account.followers[itemIndex];
                let accountFollower = await db.accounts.findOne({public_key: item.address});
                if (accountFollower) {
                    listFollowers.push({
                        public_key: accountFollower.public_key,
                        displayName: accountFollower.displayName,
                        avatar: accountFollower.avatar,
                        bandwidth: accountFollower.bandwidth,
                        balance: accountFollower.balance,

                    });
                }
            }
            return listFollowers;
        }
    }

    return [];
};

const getListFollowingsByPublicKey = async (public_key) =>{
    let account = await  db.accounts.findOne({public_key: public_key});
    if(account){
        if(account.followings  && account.followings.length > 0){
            var listFollowings = [];
            for(var itemIndex = 0; itemIndex < account.followings.length; itemIndex++) {
                let item = account.followings[itemIndex];
                let accountFollowing = await db.accounts.findOne({public_key: item.address});
                if (accountFollowing) {
                    listFollowings.push({
                        public_key: accountFollowing.public_key,
                        displayName: accountFollowing.displayName,
                        avatar: accountFollowing.avatar,
                        bandwidth: accountFollowing.bandwidth,
                        balance: accountFollowing.balance,
                    });
                }
            }
            return listFollowings;
        }
    }
    return [];
};



module.exports = router;