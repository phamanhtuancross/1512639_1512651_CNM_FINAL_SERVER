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
const HashSet = require('hashset');
const moment = require('moment');



const MAX_CELLULOSE = Number.MAX_SAFE_INTEGER;
const OXYGEN = 1;
const MAX_BLOCK_SIZE = 22020096;
const RESERVE_RATIO = 1;
const BANDWIDTH_PERIOD = 86400;
const NETWORK_BANDWIDTH = RESERVE_RATIO * MAX_BLOCK_SIZE * BANDWIDTH_PERIOD;

let client = RpcClient('wss://dragonfly.forest.network:443');


const PlainTextContent = vstruct([
    { name: 'type', type: vstruct.UInt8 },
    { name: 'text', type: vstruct.VarString(vstruct.UInt16BE) },
]);

const Followings = vstruct([
    { name: 'addresses', type: vstruct.VarArray(vstruct.UInt16BE, vstruct.Buffer(35)) },
]);
async function getListBlockByHeight(height){

    let nodeInfo = await db.nodeInfos.find({});
    let currentHeight = nodeInfo!=null && nodeInfo.length > 0 ? nodeInfo[0].height : 0;

    if(currentHeight <  height) {
        db.nodeInfos.update(
            {_id: nodeInfo[0]._id},
            {height: height},
            {multi: true},
            (err,doc) =>{
               console.log('update ok');
            });


        console.log("current height :" + currentHeight);
        console.log("height :" + height);

        for (var i = currentHeight + 1; i <= height; i++) {
            try {

                var result = await client.block({height: i});
                if (result !== null) {

                    let block_id = result.block_meta.block_id;
                    let data = result.block.data;

                   updateBandwith(result.block);
                    if (data && data.txs != null) {
                        let txs = data.txs;


                        if (txs != null) {
                            var tx = txs[0];
                            var transactionObject = transaction.decode(Buffer.from(tx, 'base64'));
                            console.log("HEIGHT :" + i + "operation : " + transactionObject.operation);

                            let operation = transactionObject.operation;
                            switch (operation) {

                                case "create_account":

                                    //add account to accounts col
                                    db.accounts.create({
                                        public_key: transactionObject.params.address,
                                        bandwidth: 0,
                                        bandwidthTime: 0,
                                        balance: 0,
                                    });
                                    break;

                                case "post":
                                    try {
                                        let content = PlainTextContent.decode(transactionObject.params.content);
                                        transactionObject.params.content = content;

                                        var account = await db.accounts.findOne({public_key: transactionObject.account});
                                        if (account) {
                                            account.posts = account.posts.concat(content);
                                            await  account.save();
                                        }
                                    }
                                    catch (err) {
                                        console.log(err)
                                    }

                                    break;

                                case "update_account":
                                    let key = transactionObject.params.key;
                                    let value = transactionObject.params.value;
                                    //console.log(key);
                                    switch (key) {
                                        case "name":
                                            try {
                                                db.accounts.findOne({public_key: transactionObject.account}, (err, doc) => {
                                                    if (doc != null) {
                                                        console.log("UPDATE NAME :");
                                                        transactionObject.params.value = value.toString('utf-8');

                                                        var conditions = {public_key: transactionObject.account};
                                                        var update = {displayName: value.toString('utf-8')};
                                                        var options = {multi: true};

                                                        db.accounts.update(conditions, update, options, (err, numAffected) => {
                                                        });
                                                    }
                                                });
                                                //console.log("name");

                                            }
                                            catch (e) {
                                                console.log(e);
                                            }
                                            break;
                                        case "picture":
                                            //console.log("picture");
                                            try {
                                                var conditions = {public_key: transactionObject.account};
                                                var update = {avatar: value};
                                                var options = {multi: true};

                                                db.accounts.update(conditions, update, options, (err, numAffected) => {
                                                });
                                            }
                                            catch (e) {
                                                console.log(e);
                                            }
                                            break;
                                        case "followings":
                                            //console.log("followings");
                                            try {
                                                var followings = Followings.decode(value);
                                                var addressesBuffer = followings.addresses;
                                                var addresses = [];
                                                for (var addressIndex = 0; addressIndex < addressesBuffer.length; addressIndex++) {
                                                    var address = base32.encode(addressesBuffer[addressIndex]);
                                                    addresses.push(address);
                                                }
                                                followings.addresses = addresses;
                                                transactionObject.params.value = followings;

                                                db.accounts.findOne({public_key: transactionObject.account}, (err, doc) => {
                                                    if (doc != null) {
                                                        let currentFollowings = doc.followings;
                                                        let addingFolowings = transactionObject.params.value;

                                                        let items = currentFollowings.concat(addingFolowings);
                                                        let newFollowings = new HashSet();

                                                        for (var i = 0; i < items.length; i++) {
                                                            newFollowings.add(items[i]);
                                                        }

                                                        console.log(newFollowings.toArray());
                                                        var conditions = {public_key: transactionObject.account};
                                                        var update = {followings: newFollowings.toArray()};
                                                        var options = {multi: true};

                                                        db.accounts.update(conditions, update, options, (err, numAffected) => {
                                                        });
                                                    }
                                                });
                                            }
                                            catch (e) {
                                                console.log(e);
                                            }
                                            break;
                                        default:
                                            break;
                                    }
                                    break;

                                case "payment":
                                    try {
                                        var paymentAccount = await db.accounts.findOne({public_key: transactionObject.account});
                                            if (paymentAccount != null) {
                                                paymentAccount.payments = paymentAccount.payments.concat(transactionObject.params);
                                                paymentAccount.balance =  paymentAccount.balance - transactionObject.params.amount;
                                                await paymentAccount.save();
                                            }

                                        var recivedAccount = await db.accounts.findOne({public_key: transactionObject.params.address});
                                        if (recivedAccount != null) {
                                            recivedAccount.payments = recivedAccount.payments.concat(transactionObject.params);
                                            recivedAccount.balance =  recivedAccount.balance + transactionObject.params.amount;
                                            await recivedAccount.save();
                                        }

                                    }
                                    catch (e) {
                                        console.log(e);
                                    }
                                    break;
                                default:
                                    break;
                            }

                            db.blockChainInfos.create({
                                operation: transactionObject.operation,
                                block_id: block_id,
                                block: transactionObject,
                                height: i,
                            });
                        }
                    }

                }
            }
            catch (err) {
                console.error('error');
            }
        }
    }

}

async function  connectNode(){
    try {
        client.abciInfo().then(res => {
            console.log(res);
            let height = res.response.last_block_height;
            console.log('heigth' + height);
            getListBlockByHeight(height);

        });
    }
    catch (e) {
        console.log('err');
    }
}

const listenForNewBlockFromNode = () =>{
    client.subscribe({ query: 'tm.event = \'NewBlock\'' }, (data) => {
        let blockHeight = data.block.header.height;
        console.log('blockHeight :' + blockHeight);
        getListBlockByHeight(blockHeight);
    })
};

const updateBandwith = async (currentBlock) =>{
    if (currentBlock) {

        console.log(currentBlock.header.time);
        var txs = currentBlock.data.txs;
        if(txs) {
            var tx = txs[0];
            var txBuffer = (Buffer.from(tx, 'base64'));
            var txSize = txBuffer.length;

            var txObj = transaction.decode(txBuffer);
            var account = await db.accounts.findOne({public_key: txObj.account});
            if (account) {
                const diff = account.bandwidthTime
                    ? moment(currentBlock.header.time).unix() - account.bandwidthTime
                    : BANDWIDTH_PERIOD;

                //tính mức năng lượng tối đa mà tài khoản có thể sử dụng (phụ thuộc vào độ giàu của tài khoản)
                const bandwidthLimit = account.balance / MAX_CELLULOSE * NETWORK_BANDWIDTH;

                // cập nhật mức năng lượng đã sử dụng mới (sau khi cộng thêm txSize)
                account.bandwidth = Math.ceil(Math.max(0, (BANDWIDTH_PERIOD - diff) / BANDWIDTH_PERIOD) * account.bandwidth + txSize);
                //kiểm tra năng lượng đã sử dụng mới có vượt quá mức năng lượng tối đa mà tài khoản có thể sử dụng
                console.log("BANDWIDTH :"); console.log(account.bandwidth);
                console.log("BANDWIDTH LIMIT :"); console.log(bandwidthLimit);
                if (account.bandwidth > bandwidthLimit) {
                    throw Error('Bandwidth limit exceeded');
                }

                // Mọi thứ đều thỏa, cập nhật lần gần nhất sử dụng năng lượng và lưu vào db
                account.bandwidthTime =  moment(currentBlock.header.time).unix();
                account.sequence =  txObj.sequence;
                await account.save();
            }
        }
    }
};

const init = () =>{
  connectNode();
  listenForNewBlockFromNode();
};


module.exports = {init};
