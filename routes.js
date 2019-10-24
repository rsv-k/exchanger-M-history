const express = require('express');
const router = express.Router();
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

router.get('/*/buys/page/:number', async (req, res) => {
    const db = collections[req.params['0']];
    
    if ( !(await db.exists()) ) {
        return res.status(400).send('DB does not exist');
    }

    const pagesAmount = await db.countDocuments({BidsHistoryType: 'buy'});
    const data = (await db.find({BidsHistoryType: 'buy'}).sort({"_id": -1}).skip((req.params.number - 1) * 20).limit(20));
    res.send({data, pagesAmount});
});

router.get('/*/sales/page/:number', async (req, res) => {
    const db = collections[req.params['0']];
    if ( !(await db.exists()) ) {
        return res.status(400).send('DB does not exist');
    }

    const pagesAmount = await db.countDocuments({BidsHistoryType: 'sale'});
    const data = (await db.find({BidsHistoryType: 'sale'}).sort({"_id": -1}).skip((req.params.number - 1) * 20).limit(20));
    res.send({data, pagesAmount});
});

router.get('/*/banks/:bank/page/:number/', async (req,res) => {
    const db = collections[req.params['0']];
    if ( !(await db.exists()) ) {
        return res.status(400).send('DB does not exist');
    }

    let pagesAmount = await db.countDocuments({BankName: req.params.bank});
    
    let data = (await db.find({BankName: req.params.bank}).sort({'_id': -1}).skip((req.params.number - 1) * 20).limit(20));

    if (data.length === 0) {
        pagesAmount = await db.countDocuments({'Provider.Name': req.params.bank});
        data = (await db.find({'Provider.Name': req.params.bank }).sort({'_id': -1}).skip((req.params.number - 1) * 20).limit(20));
    }

    res.send({data, pagesAmount});
});

router.get('/*/page/:number', async (req, res) => {
    const db = collections[req.params['0']];

    if ( !(await db.exists()) ) {
        return res.status(400).send('DB does not exist');
    }

    const pagesAmount = await db.countDocuments();
    const data = (await db.find().skip(pagesAmount - req.params.number * 20).limit(20)).reverse();
    res.send({data, pagesAmount});
});

router.get('/*/sales', async (req, res) => {
    const db = collections[req.params['0']];
    if ( !(await db.exists()) ) {
        return res.status(400).send('DB does not exist');
    }

    const data = (await db.find({BidsHistoryType: 'sale'}).sort({"_id": -1}));
    const pagesAmount = await db.countDocuments();
    res.send(data);
});

router.get('/*/buys', async (req, res) => {
    const db = collections[req.params['0']];
    if ( !(await db.exists()) ) {
        return res.status(400).send('DB does not exist');
    }

    const data = (await db.find({BidsHistoryType: 'buy'}).sort({"_id": -1}));
    const pagesAmount = await db.countDocuments();
    res.send(data);
});

router.get('/*/time/:time', async (req, res) => {
    console.log(req.params);
    const db = collections[req.params['0']];
    if ( !(await db.exists()) ) {
        return res.status(400).send('DB does not exist');
    }    
    
    const doc = await db.find().skip(await db.countDocuments() - 1);
    const finishedAt = doc[0].FinishedAt.slice(0, 10).split('.');
    if (req.params.time === 'today') {
        const regex = new RegExp(finishedAt.join('.') + ' .*');
        const data = await db.find({FinishedAt: regex}).sort({'_id': -1});
        return res.send(data);
    }

    [finishedAt[0], finishedAt[1]] = [finishedAt[1], finishedAt[0]];
    
    const date = Date.parse(new Date(finishedAt.join('.')));
    
    const dates = {
        'today': 0,
        'three': 3,
        'week': 7,
        'month': 30
    }
    if (!dates[req.params.time] && req.params.time !== 'today') {
        return res.status(400).send('Incorrect time provided');
    }
    
    const days = [];
    for (let i = 0; i < dates[req.params.time]; i++) {
        let newDate =  new Date(date - 86400000 * i);
        let day = newDate.getDate();
        let month = newDate.getMonth() + 1;
        let regex = new RegExp((day < 10 ? '0' + day : day) + '.' 
                        + (month < 10 ? '0' + month : month) 
                        + '.' + newDate.getFullYear() + '.*');

        days.push(regex);
    }

    const data = await db.find({FinishedAt: { $in: days }}).sort({'_id': -1});

    res.send(data);
});

router.get('/*', async (req, res) => {
    const db = collections[req.params['0']];
    if ( !(await db.exists()) ) {
        return res.status(400).send('DB does not exist');
    }

    const data = (await db.find().sort({"_id": -1}));
    const pagesAmount = await db.countDocuments();
    res.send(data);
});


module.exports = router;