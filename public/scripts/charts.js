const currentActive = {
    wm: 'WMR',
    rl: 'RUB'
}
const chartsContainer = document.querySelector('.charts');
const buttons = [...document.querySelectorAll('.btn__top')];
const ctx_lineBuy = document.getElementById('myChart_line_buy').getContext('2d');
const ctx_lineSale = document.getElementById('myChart_line_sale').getContext('2d');
const ctx_days = document.getElementById('myChart_days').getContext('2d');
const ctx_weeks = document.getElementById('myChart_weeks').getContext('2d');
const charts = {
    bar: {
        days: null,
        weeks: null,
        months: null
    },
    line: {
        buy: null,
        sale: null
    }
}

buttons.forEach(btn => btn.addEventListener('click', currentCurrency))
displayCharts(currentActive.rl, currentActive.wm, 'today');

function currentCurrency(e) {
    const elem = e.currentTarget;
    const ebtn = document.querySelector('.e-top').className.includes('active');

    if ( !ebtn && (elem.innerText === currentActive.rl || elem.innerText === currentActive.wm)) return;
    if (ebtn) {
        const ebuttons = [...document.querySelectorAll('.e-btn')];
        ebuttons.forEach(btn => btn.classList.remove('active'));

        if (elem.className.includes('rlBtn')) {
            const wmcurrency = document.querySelector('.wmcurrencies').children;
            wmcurrency[0].classList.add('active');
            currentActive.wm = 'WMR';
        }
        else {
            const rlcurrency = document.querySelector('.realcurrencies').children;
            rlcurrency[0].classList.add('active');
            currentActive.rl = 'RUB';
        }
    }

    changeActive(elem);
    
    const typeActive = elem.className.includes('wmBtn') ? 'wm' : 'rl';
    currentActive[typeActive] = elem.innerText
    displayCharts(currentActive.rl, currentActive.wm, 'today');
}
const Ebuttons = document.querySelectorAll('.buttons')[1];
Ebuttons.addEventListener('click', e => {
    let elem = e.target;
    if (elem.className.includes('e-top')) {
        buttons.forEach(btn => btn.classList.remove('active'));

        const e_bottom = document.querySelector('.first');
        elem.classList.add('active');
        e_bottom.classList.add('active');

        currentActive['rl'] = 'RUB';
        currentActive['wm'] = 'WMR';
        displayCharts('ERUB', 'E' + currentActive.wm);
    }
    else if (elem.className.includes('e-bottom') || elem.parentElement.className.includes('e-bottom')) {
        if (elem.parentElement.className.includes('e-bottom')) elem = elem.parentElement;

        buttons.forEach(btn => btn.classList.remove('active'));
        const e_top = document.querySelector('.e-top');
        const e_bottom = document.querySelectorAll('.e-bottom');
        e_bottom.forEach(btn => btn.classList.remove('active'));

        elem.classList.add('active');
        e_top.classList.add('active');
        currentActive['rl'] = 'RUB';
        if (elem.className.includes('first')) currentActive.wm = 'WMR';
        else currentActive.wm = 'WMZ';
        displayCharts('ERUB', 'E' + currentActive.wm);
    }
});

async function requestData(rl, wm, time) {
    return (await axios.get(`/history/${rl}-${wm}/api?time=${time}`.toLowerCase())).data;
}
function calculateRate(item) {
    return currentActive.rl === 'RUB' && currentActive.wm === 'WMR' ? item.Rate : 
    (item.Amount.replace(',', '.') / item.AmountWm.replace(',', '.')).toFixed(4);
}
function fillAxes(dates, amountWm, response) {
    const item = response;
    const date = item.FinishedAt.substring(0, 10);
    const type = item.BidsHistoryType;
    
    if (!dates.labels.includes(date)) dates.labels.unshift(date);

    const rate = calculateRate(item);

    amountWm[type].unshift(+item.AmountWm.replace(',', '.'));
    dates[`lineRates_${type}`].unshift(rate);
    dates[`lineLabels_${type}`].unshift(item.FinishedAt + '\n' + 'Количество: ' + item.AmountWm);
    
    dates[type][date] = +((dates[type][date]  || 0 ) + (+item.AmountWm.replace(',', '.'))).toFixed(1);
}
async function displayCharts(rl, wm, time) {
    const response = await requestData(rl, wm, time);
    const dates = { 
        labels: [],
        buy: {},
        sale: {},
        lineLabels_buy: [], 
        lineLabels_sale: [],
        lineRates_buy: [], 
        lineRates_sale: [], 
        colorsBuy: [], 
        colorsSale: [] 
    };
    const amountWm = {
        buy: [],
        sale: []
    }

    for (let i = 0; i < response.length; i++) {
        fillAxes(dates, amountWm, response[i]);
    }

    const colors = { buy: [], sale: [] }

    let divisor = currentActive.wm === 'WMR' ? 50000 : 500;
    // let min = currentActive.wm === 'WMR' ? 1000 : 100;

    for (let i = 0; i < Math.max(amountWm.buy.length, amountWm.sale.length); i++) {
        if (amountWm.buy[i]) colors.buy.push(`rgb(255, ${20 + Math.min(100, Math.floor((amountWm.buy[i] / divisor) * 100))}, 0)`);
        if (amountWm.sale[i]) colors.sale.push(`rgb(255, ${155 + Math.min(100, Math.floor((amountWm.sale[i] / divisor) * 100))}, 0)`);
    }
        
    const line = {
        ctx: ctx_lineBuy,
        chart: 'buy',
        labels: dates.lineLabels_buy,
        rates: dates.lineRates_buy,
        title: 'Покупка',
        colors: colors.buy,
        type: 'line',
        text: 'покупки'
    }
    const bar = {
        ctx: ctx_days,
        chart: 'days',
        labels: dates.labels,
        buy: Object.values(dates.buy).reverse(),
        sale: Object.values(dates.sale).reverse(),
        title: 'Дни',
        type: 'bar',
    }
    
    createChart(line);
    line.ctx = ctx_lineSale;
    line.chart = 'sale';
    line.labels = dates.lineLabels_sale;
    line.rates = dates.lineRates_sale;
    line.title = 'Продажа';
    line.colors = colors.sale;
    line.text = 'продажи';
    createChart(line);
    createChart(bar);

    const weeks = {
        buy: [],
        sale: [],
        labels: []
    }

    const maxLen = Math.max(bar.buy.length, bar.sale.length);
        
    for (let i = 0, p = 0; i < maxLen; i++) {
        if (i !== 0 && i % 7 === 0) p++;

        if (bar.sale[i]) weeks.sale[p] = +((weeks.sale[p] || 0) + bar.sale[i]).toFixed(1);
        if (bar.buy[i]) weeks.buy[p] = +((weeks.buy[p] || 0 ) + bar.buy[i]).toFixed(1);
    }
        
    for (let i = 0; i < dates.labels.length; i += 7) {
        weeks.labels.unshift(`${dates.labels[i]} - ${dates.labels[i + 6] || dates.labels[dates.labels.length - 1]}`);
    }

    if (time === 'month' || time === 'all') {
        bar.ctx = ctx_weeks;
        bar.labels = weeks.labels;
        bar.buy = weeks.buy;
        bar.sale = weeks.sale;
        bar.chart = 'weeks';
        bar.title = 'Недели';
        createChart(bar);
    }
}

document.querySelector('.chart__buttons').addEventListener('click', e => {
    const elem = e.target;
    if (elem.className.includes('active')) return;
    let rl = currentActive.rl;
    let wm = currentActive.wm;
    if (document.querySelector('.e-top').className.includes('active')) {
        rl = 'E' + rl;
        wm = 'E' + wm;
    }

    if (elem.className.includes('today')) displayCharts(rl, wm, 'today');
    else if (elem.className.includes('threedays')) displayCharts(rl, wm, 'threedays');
    else if (elem.className.includes('week')) displayCharts(rl, wm, 'week');
    else if (elem.className.includes('month')) displayCharts(rl, wm, 'month');
});














function updateLine(chart) {
    charts.line[chart.chart].data.labels = chart.labels;
    charts.line[chart.chart].data.datasets[0].data = chart.rates;
    charts.line[chart.chart].data.datasets[0].backgroundColor = chart.colors;
    charts.line[chart.chart].update();
}

function updateBar(chart) {
    charts.bar[chart.chart].data.labels = chart.labels;
    charts.bar[chart.chart].data.datasets[0].data = chart.buy;
    charts.bar[chart.chart].data.datasets[1].data = chart.sale;
    charts.bar[chart.chart].update();
}


function createChart(chart) {
let options = null;
let data = null;

if (chart.type === 'bar') {
    if (charts[chart.type][chart.chart]) return updateBar(chart);
    options = {
        title: {
            display: true,
            text: chart.title,
            fontSize: 25,
            fontColor: '#fff'
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    fontColor: '#fff'
                }
            }],
            xAxes: [{
                ticks: {
                    fontColor: '#fff'
                }
            }]
        }
    }
    data = {
        labels: chart.labels,
        datasets: [
            {
                label: 'Покупка',
                data: chart.buy,
                backgroundColor: '#00C0EF'
            },
            {
                label: 'Продажа',
                data: chart.sale,
                backgroundColor: '#00A65A'
            }
        ]
    }
}
else if (chart.type === 'line') {
    if (charts[chart.type][chart.chart]) return updateLine(chart);
    options = {
        title: {
            display: true,
            fontSize: 25,
            fontColor: '#fff',
            text: 'Курс каждой ' + chart.text,
        },
        elements: {
            line: {
                fill: false,
                borderColor: 'rgba(0, 192, 239, 0.2)',
                tension: 0
            },
            point: {
                radius: 5
            }
        },
        scales:{
            xAxes: [{
                display: false,
            }],
            yAxes: [{
                ticks: {
                    fontColor: '#fff',
                }
            }]
        },
        layout: {
            padding: {
                right: 5
            }
        },
        legend: {
            display: false
        }
    }
    data = {
        labels: chart.labels,
        datasets: [{
            label: chart.title,
            data: chart.rates,
            backgroundColor: chart.colors,
        }]
    }
}

charts[chart.type][chart.chart] = new Chart(chart.ctx, {
    type: chart.type,
    data,
    options
});
}


chartsContainer.addEventListener('click', e => {
e.preventDefault();

if (!e.target.className.includes('chart__button')) return;

changeActive(e.target);
});