var express = require('express');
var transaction = require('./lib/transaction/index');
var db = require('./db');
var {RpcClient}  = require('tendermint');
var  app = express();
var axios = require('axios');
const { Keypair } = require('stellar-base');
const vstruct = require('varstruct');
const mongoose = require('mongoose');
const base32 = require('base32.js');
const $ = require('jquery');


const ACCOUNT_INFO_API = 'tx_search?query=%22account=%27GBH6HEN6KMDTI3TDD4EINUYJCG3AS6N5YROE2XNBETY2SSOWB3CYRH7S%27%22';
const ACCOUNT_PUBLIC_KEY = 'GBH6HEN6KMDTI3TDD4EINUYJCG3AS6N5YROE2XNBETY2SSOWB3CYRH7S';

const ACCOUNT_SECRET_KEY          = 'SB4BGT5YZY3FIRAGTYMHYKHPUTUY4BWNHAPMVJVFHRQDTSQBWIVMY6CR';
const PAYMENT_ADDRESS_FRIEND_TEST = 'GALFOH6JQ3KCEVCPVFXI4CKXXUAOZBIYHD2LVGYSO4MXBFGNC6IC652D';
const PUBLIC_NODE_URL = "https://komodo.forest.network/";
let client = RpcClient('wss://gorilla.forest.network:443');
const UpdateAccountParams = vstruct([
    { name: 'key', type: vstruct.VarString(vstruct.UInt8) },
    { name: 'value', type: vstruct.VarBuffer(vstruct.UInt16BE) },
]);

const PlainTextContent = vstruct([
    { name: 'type', type: vstruct.UInt8 },
    { name: 'text', type: vstruct.VarString(vstruct.UInt16BE) },
]);

const Followings = vstruct([
    { name: 'addresses', type: vstruct.VarArray(vstruct.UInt16BE, vstruct.Buffer(35)) },
]);

app.listen(3000);
async function getListBlockByHeight(height){

        db.nodeInfos.create({
            height: height,
        });


        for(var i = 0; i <= height; i ++) {
            try {
            var result = await client.block({height: i});
            //console.log(result);
            if(result !== null) {
                let block_id = result.block_meta.block_id;
                let data = result.block.data;
                if (data && data.txs != null) {
                    let txs = data.txs;
                    if(txs != null){
                            var tx = txs[0];
                            var transactionObject = transaction.decode(Buffer.from(tx, 'base64'));
                            console.log("HEIGHT :" + i + "operation : " + transactionObject.operation);

                            let operation = transactionObject.operation;
                            switch (operation) {

                                case "create_account":

                                    //add account to accounts col
                                    db.accounts.create({
                                        public_key: transactionObject.params.address,
                                    });
                                    break;

                                case "post":
                                    try {
                                        let content = PlainTextContent.decode(transactionObject.params.content);
                                        transactionObject.params.content = content;
                                    }
                                    catch (err) {
                                        //console.log('post err data')
                                    }

                                    break;

                                case "update_account":
                                    let key = transactionObject.params.key;
                                    let value = transactionObject.params.value;
                                    //console.log(key);
                                    switch (key) {
                                        case "name":
                                            //console.log("name");
                                            transactionObject.params.value = value.toString('utf-8');
                                            break;
                                        case "picture":
                                            //console.log("picture");
                                            break;
                                        case "followings":
                                            //console.log("followings");
                                            var followings = Followings.decode(value);
                                            var addressesBuffer = followings.addresses;
                                            var addresses = [];
                                            for (var addressIndex = 0; addressIndex < addressesBuffer.length; addressIndex++) {
                                                var address = base32.encode(addressesBuffer[addressIndex]);
                                                addresses.push(address);
                                            }
                                            transactionObject.params.address = addresses;
                                            break;
                                        default:
                                            break;
                                    }
                                    break;

                                case "payment":
                                    //console.log(payment);
                                    break;
                                default:
                                    break;
                            }
                        db.blockChainInfos.create({
                            operation: transactionObject.operation,
                            block_id: block_id,
                            block:transactionObject,
                            height: i,
                        });
                    }
                }

            }
        }
        catch(err)
        {
            console.error('error');
        }
    }

}

async function  connectNode(){
    client.abciInfo().then(res => {
        let height = res.response.last_block_height;
        getListBlockByHeight(height);

    });
};

//connectNode();



app.get('/',function (req,res) {

});

async function getAccountInfoByKey(acoountPublicKey){
    try {
        var result = await client.txSearch({
            query: "account=GBH6HEN6KMDTI3TDD4EINUYJCG3AS6N5YROE2XNBETY2SSOWB3CYRH7S",
        });
        console.log(result);
    }
    catch (e) {
        console.log('errr');
    }
}

getAccountInfoByKey();

async function getFriendPosts(){

    return new Promise(function (resolve,reject) {
        try {
            db.blockChainInfos.find({operation : 'post'},function (err, items) {
                var posts = [];
                for(var itemIndex = 0; itemIndex < items.length; itemIndex ++){
                    let transaction = items[itemIndex].block[0];

                    posts.push({

                        content: transaction.params.content
                    })
                }
                return resolve(posts)
            });
        }
        catch (e) {
            return reject(e);
        }

    });
}

app.get('/posts',function (req,res) {
    getFriendPosts().then(resutl => {
        res.send(resutl);
    });

});



app.get('/create_account', function (req, res) {
    var getLastSequcencePromise =  getLastSequence();
    getLastSequcencePromise.then(function (lastSequence) {
        createAccount(lastSequence).then(result =>{
            console.log(result);
            res.send(result);
        })
    });
});

app.get('/payment', function (req, res) {
    var getLastSequcencePromise =  getLastSequence();
    getLastSequcencePromise.then(function (lastSequence) {
        payment(lastSequence).then(result =>{
            res.send(result);
        })
    });
});

app.get('/post', function (req, res) {
    var getLastSequcencePromise =  getLastSequence();
    getLastSequcencePromise.then(function (lastSequence) {
        postConent(lastSequence).then(result =>{
            res.send(result);
        })
    });}
    );
app.get('/update_account', function (req,res) {
    var getLastSequcencePromise =  getLastSequence();
    getLastSequcencePromise.then(function (lastSequence) {
        updateAccount(lastSequence).then(result =>{
            res.send(result);
        })
    });
});


function createAccount(lastSequence){
    const key = Keypair.random();
    let address = key.publicKey();

    let tx = {
        version: 1,
        sequence: lastSequence + 1,
        memo: Buffer.from('memo test'),
        operation: 'create_account',
        params: {
            address:address,
        }
    };

    transaction.sign(tx, 'SB4BGT5YZY3FIRAGTYMHYKHPUTUY4BWNHAPMVJVFHRQDTSQBWIVMY6CR');
    transaction.sign(tx,ACCOUNT_SECRET_KEY);
    var data_encoding = '0x' + transaction.encode(tx).toString('hex');
    var url = 'https://komodo.forest.network/broadcast_tx_commit?tx=' + data_encoding;

    return new Promise((resolve, reject) =>{
            axios.get(url).then(response=>{
                resolve(response.data);
            }).catch(err =>
                reject(err)
            )
        }
    );
}
function payment(lastSequence){
    let tx = {
        version: 1,
        sequence: lastSequence + 1,
        memo: Buffer.from('Chuyển tiền cho bên '),
        operation: 'payment',
        params: {
            address: PAYMENT_ADDRESS_FRIEND_TEST,
            amount: 100,
        }
    };

    transaction.sign(tx, 'SB4BGT5YZY3FIRAGTYMHYKHPUTUY4BWNHAPMVJVFHRQDTSQBWIVMY6CR');
    transaction.sign(tx,ACCOUNT_SECRET_KEY);
    var data_encoding = '0x' + transaction.encode(tx).toString('hex');
    var url = 'https://komodo.forest.network/broadcast_tx_commit?tx=' + data_encoding;

    return new Promise((resolve, reject) =>{
            axios.get(url).then(response=>{
                resolve(response.data);
            }).catch(err =>
                reject(err)
            )
        }
    );
}
function getLastSequence(){
    return new Promise(((resolve, reject) =>
            axios.get('https://komodo.forest.network/tx_search?query=%22account=%27' + ACCOUNT_PUBLIC_KEY + '%27%22')
                .then(function (response) {
                    let txs = response.data.result.txs;
                    let lastTx = txs[txs.length -1].tx;
                    let lastTransaction = transaction.decode(Buffer.from(lastTx,'base64'));

                    resolve(lastTransaction.sequence);
                }).catch(err =>{
                reject(err);
            })
    ));

}
function postConent(lastSequence){
    const PlainTextContent = vstruct([
        { name: 'type', type: vstruct.UInt8 },
        { name: 'text', type: vstruct.VarString(vstruct.UInt16BE) },
    ]);


    let tx = {
        version: 1,
        sequence: lastSequence + 1,
        memo: Buffer.from('Đăng bài'),
        operation: 'post',
        params: {
            content: PlainTextContent.encode({
                type: 1,
                text: 'pham anh tuan',
            }),
            keys:[]
        }
    };

    //PostParams.encode(tx.params);

    transaction.sign(tx, 'SB4BGT5YZY3FIRAGTYMHYKHPUTUY4BWNHAPMVJVFHRQDTSQBWIVMY6CR');
    transaction.sign(tx,ACCOUNT_SECRET_KEY);
    var data_encoding = '0x' + transaction.encode(tx).toString('hex');
    var url = 'https://komodo.forest.network/broadcast_tx_commit?tx=' + data_encoding;

    return new Promise((resolve, reject) =>{
            axios.get(url).then(response=>{
                resolve(response.data);
            }).catch(err =>
                reject(err)
            )
        }
    );
}
function updateAccount(lastSequence){
    let tx = {
        version: 1,
        sequence: lastSequence + 1,
        memo: Buffer.from('Cập nhật tài khoản'),
        operation: 'update_account',
        params:{
            key:'name',
            value: Buffer.from('1512639_1512651', 'utf-8')
        }
    };

    //UpdateAccountParams.encode(tx.params);

    transaction.sign(tx, 'SB4BGT5YZY3FIRAGTYMHYKHPUTUY4BWNHAPMVJVFHRQDTSQBWIVMY6CR');
    transaction.sign(tx,ACCOUNT_SECRET_KEY);
    var data_encoding = '0x' + transaction.encode(tx).toString('hex');
    var url = 'https://komodo.forest.network/broadcast_tx_commit?tx=' + data_encoding;

    return new Promise((resolve, reject) =>{
            axios.get(url).then(response=>{
                resolve(response.data);
            }).catch(err =>
                reject(err)
            )
        }
    );
}


