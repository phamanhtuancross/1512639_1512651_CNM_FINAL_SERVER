const mongoose = require('mongoose');

//connect
mongoose.connect('mongodb://localhost/BlockChainDatabase');

//tạo Schema
const blockChainInfosSchema = new mongoose.Schema({
    height: Number,
    block: Object,
});

const accountsSchema = new mongoose.Schema({
    public_key: String,
    displayName: String,
    posts: [Object],
    followings: [Object],
    followers: [Object],
    avatar: Buffer,
    payments:[Object],
    bandwidth: Number,
    bandwidthTime: Number,
    balance: Number,
    sequence: Number,
});

const nodeInfosSchema = new mongoose.Schema({
    height: Number,
});

var blockChainInfos = mongoose.model('BlockChainInfos', blockChainInfosSchema);
var accounts = mongoose.model('Accounts', accountsSchema);
var nodeInfos = mongoose.model('NodeInfos', nodeInfosSchema);

const initGeneris = () => {
    accounts.create({
        public_key: 'GA6IW2JOWMP4WGI6LYAZ76ZPMFQSJAX4YLJLOQOWFC5VF5C6IGNV2IW7',
        balance: Number.MAX_SAFE_INTEGER,
        sequence: 0,
        bandwidth: 0,
    });

    nodeInfos.create({
        height: 0,
    });
};
//
//initGeneris();

module.exports = {
    blockChainInfos,
    accounts,
    nodeInfos,
};
