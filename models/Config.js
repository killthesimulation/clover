const mongoose = require('mongoose');
require('mongoose-long')(mongoose);
const {Types: {Long}} = mongoose;


const ConfigSchema = new mongoose.Schema({
    clvPriceUsd: {
        type: Number,
        default: 0
    },
    referralPercent: {
        type: Number,
        default: 0
    },
    referralPercent2: {
        type: Number,
        default: 0
    },
    referralPercent3: {
        type: Number,
        default: 0
    },
    defaultBonusCap: {
        type: Number,
        default: 0
    },
  
})

const Config = mongoose.model('Config', ConfigSchema);

module.exports = Config;