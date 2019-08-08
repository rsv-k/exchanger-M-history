const express = require('express');
const app = express();
const fs = require('fs');
const port = 3000;

const request = require('request');
const history = {
    RUB_WMR: [],
    RUB_WMZ: [],
    UAH_WMR: [],
    UAH_WMZ: []
}

app.use(express.static('public'));

reqeustCurrenciesData();

setInterval(() => {
    reqeustCurrenciesData();

    console.log('files have been saved');
}, 300000);

app.get('/history/rub-wmr/api', (req, res) => res.send(JSON.stringify(history.RUB_WMR)) );
app.get('/history/rub-wmz/api', (req, res) => res.send(JSON.stringify(history.RUB_WMZ)) );
app.get('/history/uah-wmr/api', (req, res) => res.send(JSON.stringify(history.UAH_WMR)) );
app.get('/history/uah-wmz/api', (req, res) => res.send(JSON.stringify(history.UAH_WMZ)) );

app.listen(port, () => console.log(`istening on port ${port}!`));

function getCurrencyData(id, currency) {
    request(`https://exchanger.money/cards/bids/bidshistorylist?Id=${id}`, (err, res, body) => {
        if (err) return console.error(err);
        const data = JSON.parse(body).Bids;

        saveData(data, currency);
    });
}

function saveData(data, toWhere) {
    let filePath = `./${toWhere.toLowerCase()}.json`;

    if (fs.statSync(filePath).size !== 0) 
        history[toWhere] = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (let i = data.length - 1; i >= 0; i--) {
        if (JSON.stringify(history[toWhere]).includes(JSON.stringify(data[i]))) continue;
        history[toWhere] = [data[i], ...history[toWhere]];
    }
    
    fs.writeFile(filePath, JSON.stringify(history[toWhere], null, 4), err => {
        if (err) return console.log(err);
    });
}
function reqeustCurrenciesData() {
    getCurrencyData(2,  'RUB_WMR');
    getCurrencyData(67, 'RUB_WMZ');
    getCurrencyData(73, 'UAH_WMR');
    getCurrencyData(69, 'UAH_WMZ');
}