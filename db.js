const mongoose = require('mongoose');

//connect
mongoose.connect('mongodb://localhost/BlockChainDatabase');

//tạo Schema
const blockChainInfosSchema = new mongoose.Schema({
    operation: String,
    height: Number,
    block_id: Object,
    block: [],
});

const accountsSchema = new mongoose.Schema({
    public_key: String
});

const nodeInfosSchema = new mongoose.Schema({
    height: Number,
});

var blockChainInfos = mongoose.model('BlockChainInfos', blockChainInfosSchema);
var accounts = mongoose.model('Accounts', accountsSchema);
var nodeInfos = mongoose.model('NodeInfos', nodeInfosSchema);

module.exports = {
    blockChainInfos,
    accounts,
    nodeInfos,
};
