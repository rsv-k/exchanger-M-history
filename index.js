require('dotenv').config();
const request = require('request');
const http = require('http');
const express = require('express');
const app = express();
const routes = require('./routes');

// DB
const mongoose = require('mongoose');
const Transaction = require('./schema');
const collections = {
    'RUB_WMR': mongoose.model('RUB_WMR', Transaction),
    'RUB_WMZ': mongoose.model('RUB_WMZ', Transaction),
    'UAH_WMR': mongoose.model('UAH_WMR', Transaction),
    'UAH_WMZ': mongoose.model('UAH_WMZ', Transaction),
    'ERUB_EWMZ': mongoose.model('ERUB_EWMZ', Transaction),
    'ERUB_EWMR': mongoose.model('ERUB_EWMR', Transaction)
}


app.use(express.static('public'));
app.use('/api/history', routes);
requestCurrenciesData();

// Check every 15 minutes if new data appeared on echanger money api
setInterval(() => {
    requestCurrenciesData();

    console.log('data has been added to database');
}, 300000);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`istening on port ${port}!`);

    mongoose.connect(process.env.mongo_uri, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(res => console.log('Connected to db'));
});

/*==============================
 FETCH DATA FROM EXCHANGER MONEY
===============================*/
// fetch data from site
function getCurrencyData(section, id, currency) {
    request(`https://exchanger.money/${section}/bids/bidshistorylist?Id=${id}`, (err, res, body) => {
        if (err) return console.error(err);
        const data = JSON.parse(body).Bids;
        
        saveData(data, currency);
    });
}
// Fetch many
async function requestCurrenciesData() {
    getCurrencyData('cards', 2, 'RUB_WMR');
    getCurrencyData('cards', 67,'RUB_WMZ');
    getCurrencyData('cards', 73,'UAH_WMR');
    getCurrencyData('cards', 69,'UAH_WMZ');

    getCurrencyData('emoney', 68, 'ERUB_EWMZ');
    getCurrencyData('emoney', 1, 'ERUB_EWMR');
}
// Save fetched
async function saveData(data, toWhere) {
    const transactions = [];
    const db = collections[toWhere];

    for (let i = 0; i < data.length; i++) {
        if (await db.exists(data[i])) continue;
        
        transactions.unshift(data[i]);
    }

    if (transactions.length) {
        db.collection.insertMany(transactions, (err, res) => {
            if (err) console.error(err);
        });
    }
}

setInterval(() => {
    http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`)
}, 280000);