const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    FinishedAt: String,
    BidsHistoryType: String,
    AmountWm: String,
    Amount: String,
    Rate: Number,
    RateFormatted: String,
    IsUnitPrice: Boolean,
    Period: {
        Max: Number,
        Percents: Number,
        Value: Number
    },
    BankName: String,
    CardIcon: String
});

module.exports = Schema;