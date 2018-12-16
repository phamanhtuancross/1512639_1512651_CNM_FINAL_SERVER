var express = require('express');
var transaction = require('./lib/transaction/index');
var {RpcClient}  = require('tendermint');
var  app = express();
var axios = require('axios');


const ACCOUNT_INFO_API = 'tx_search?query=%22account=%27GBH6HEN6KMDTI3TDD4EINUYJCG3AS6N5YROE2XNBETY2SSOWB3CYRH7S%27%22';
const ACCOUNT_PUBLIC_KEY = 'GBH6HEN6KMDTI3TDD4EINUYJCG3AS6N5YROE2XNBETY2SSOWB3CYRH7S';
const ACCOUNT_SECRET_KEY = 'SB4BGT5YZY3FIRAGTYMHYKHPUTUY4BWNHAPMVJVFHRQDTSQBWIVMY6CR';
const PUBLIC_NODE_URL = "https://komodo.forest.network/";
app.listen(3000);
app.get('/',function (req,res) {


});

app.get('/create_account', function (req, res) {
    let tx = {
        version: 1,
        sequence: 1,
        memo: Buffer.from('memo test'),
        operation: 'create_account',
        params: {
            address: 'GBH6HEN6KMDTI3TDD4EINUYJCG3AS6N5YROE2XNBETY2SSOWB3CYRH7S',
        }
    };


    transaction.sign(tx, 'SB4BGT5YZY3FIRAGTYMHYKHPUTUY4BWNHAPMVJVFHRQDTSQBWIVMY6CR');
   transaction.sign(tx,ACCOUNT_SECRET_KEY);
 var data_encoding = '0x' + transaction.encode(tx).toString('hex');

 var url = URL

});

app.get('/test', function (req,res) {
    const  axios = require('axios');
    axios.get("https://komodo.forest.network/tx_search?query=%22account=%27GAO4J5RXQHUVVONBDQZSRTBC42E3EIK66WZA5ZSGKMFCS6UNYMZSIDBI%27%22")
        .then(function (response) {
            var txs = response.data.result.txs;
            var transactions = [];
            for(var txIndex = 0; txIndex < txs.length; txIndex++){
                var tx = txs[txIndex];
                var transactionObject = transaction.decode(Buffer.from(tx.tx, 'base64'));
                transactions.push(transactionObject);
            }
            res.send(transactions);
        })
});

