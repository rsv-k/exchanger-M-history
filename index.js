const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Transaction = new Schema({
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

const request = require('request');
const history = {
    RUB_WMR: mongoose.model('RUB_WMR', Transaction),
    RUB_WMZ: mongoose.model('RUB_WMZ', Transaction),
    UAH_WMR: mongoose.model('UAH_WMZ', Transaction),
    UAH_WMZ: mongoose.model('UAH_WMR', Transaction)
}

app.use(express.static('public'));

requestCurrenciesData();

setInterval(() => {
    requestCurrenciesData();

    console.log('data has been added to database');
}, 300000);

app.get('/history/rub-wmr/api', async (req, res) => res.send(await history.RUB_WMR.find()) );
app.get('/history/rub-wmz/api', async (req, res) => res.send(await history.RUB_WMZ.find()) );
app.get('/history/uah-wmr/api', async (req, res) => res.send(await history.UAH_WMR.find()) );
app.get('/history/uah-wmz/api', async (req, res) => res.send(await history.UAH_WMZ.find()) );

app.listen(port, () => {
    console.log(`istening on port ${port}!`);
    mongoose.connect(process.env.mongo_uri, {useNewUrlParser: true})
    .then(res => console.log('Connected to db'));
});

function getCurrencyData(id, currency) {
    request(`https://exchanger.money/cards/bids/bidshistorylist?Id=${id}`, (err, res, body) => {
        if (err) return console.error(err);
        const data = JSON.parse(body).Bids;
        
        saveData(data, currency);
    });
}

async function saveData(data, toWhere) {
    const transactions = [];
    for (let i = 0; i < data.length; i++) {
        if (await history[toWhere].exists(data[i])) continue;
        
        transactions.unshift(data[i]);
    }
    if (transactions.length) {
        history[toWhere].collection.insertMany(transactions, (err, res) => {
            if (err) console.error(err);
        });
    }
}
async function requestCurrenciesData() {
    getCurrencyData(2,  'RUB_WMR');
    getCurrencyData(67, 'RUB_WMZ');
    getCurrencyData(73, 'UAH_WMR');
    getCurrencyData(69, 'UAH_WMZ');
}
