const http = require('http');
const express = require('express');
const app = express();
app.get('/', (req, res) => {
    console.log(Date.now() + ' Ping Recieved');
    res.sendStatus(200);
});

setInterval(() => {
    http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`)
}, 280000);



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
    UAH_WMZ: mongoose.model('UAH_WMR', Transaction),
    ERUB_EWMR: mongoose.model('ERUB_EWMR', Transaction),
    ERUB_EWMZ: mongoose.model('ERUB_EWMZ', Transaction)
}
app.use(express.static('public'));
requestCurrenciesData();

setInterval(() => {
    requestCurrenciesData();

    console.log('data has been added to database');
}, 300000);

app.get('/history/rub-wmr/api', async (req, res) => {
    const data = (await history.RUB_WMR.find()).reverse();
    
    res.send(dataByDays(data, req.query.time));
} );
app.get('/history/rub-wmz/api', async (req, res) => {
    const data = (await history.RUB_WMZ.find()).reverse();
    res.send(dataByDays(data, req.query.time));
});
app.get('/history/uah-wmr/api', async (req, res) => {
    const data = (await history.UAH_WMR.find()).reverse();
    res.send(dataByDays(data, req.query.time)); 
});
app.get('/history/uah-wmz/api', async (req, res) => {
    const data = (await history.UAH_WMZ.find()).reverse();
    res.send(dataByDays(data, req.query.time));
});
app.get('/history/erub-ewmr/api', async (req, res) => {
    const data = (await history.ERUB_EWMR.find()).reverse();
    res.send(dataByDays(data, req.query.time));
});
app.get('/history/erub-ewmz/api', async (req, res) => {
    const data = (await history.ERUB_EWMZ.find()).reverse();
    res.send(dataByDays(data, req.query.time));
});

app.listen(port, () => {
    console.log(`istening on port ${port}!`);
    mongoose.connect(process.env.mongo_uri, {useNewUrlParser: true})
    .then(res => console.log('Connected to db'));
});

function getCurrencyData(section, id, currency) {
    request(`https://exchanger.money/${section}/bids/bidshistorylist?Id=${id}`, (err, res, body) => {
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
    getCurrencyData('cards', 2, 'RUB_WMR');
    getCurrencyData('cards', 67,'RUB_WMZ');
    getCurrencyData('cards', 73,'UAH_WMR');
    getCurrencyData('cards', 69,'UAH_WMZ');

    getCurrencyData('emoney', 68, 'ERUB_EWMZ');
    getCurrencyData('emoney', 1, 'ERUB_EWMR');
}
function dataByDays(data, time) {
    let date = new Date(new Date().toLocaleDateString());
    
    if (time === 'today') return specificData(data, date);
    else if (time === 'threedays') {
        date = new Date(date - 86400000 * 2);
        
        return specificData(data, date);
    }
    else if (time === 'week') {
        date = new Date(date - 86400000 * 6);
        return specificData(data, date);
    }
    else if (time === 'month') {
        date = new Date(date - 86400000 * 30);

        return specificData(data, date);
    }
    else return data;
}
function specificData(data, date) {
    const arr = [];

    for (let i = 0; i < data.length; i++) {
        if (new Date(data[i].FinishedAt.substring(0, 10).split('.').reverse().join('-')) >= date) arr.push(data[i]);
        else break;
    }

    return arr;
}