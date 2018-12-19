var express = require('express');
var transaction = require('./lib/transaction/index');
var {RpcClient}  = require('tendermint');
var  app = express();
var axios = require('axios');
const { Keypair } = require('stellar-base');


const ACCOUNT_INFO_API = 'tx_search?query=%22account=%27GBH6HEN6KMDTI3TDD4EINUYJCG3AS6N5YROE2XNBETY2SSOWB3CYRH7S%27%22';
const ACCOUNT_PUBLIC_KEY = 'GBH6HEN6KMDTI3TDD4EINUYJCG3AS6N5YROE2XNBETY2SSOWB3CYRH7S';
const ACCOUNT_SECRET_KEY          = 'SB4BGT5YZY3FIRAGTYMHYKHPUTUY4BWNHAPMVJVFHRQDTSQBWIVMY6CR';
const PAYMENT_ADDRESS_FRIEND_TEST = 'GALFOH6JQ3KCEVCPVFXI4CKXXUAOZBIYHD2LVGYSO4MXBFGNC6IC652D';
const PUBLIC_NODE_URL = "https://komodo.forest.network/";
app.listen(3000);

app.get('/',function (req,res) {
    res.send({"code" : 1});

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
    });});


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
    let tx = {
        version: 1,
        sequence: lastSequence + 1,
        memo: Buffer.from('Đăng bài'),
        operation: 'post',
        params: {
            content:{
                type: 1,
                text: '',
            },
            key:[]
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


