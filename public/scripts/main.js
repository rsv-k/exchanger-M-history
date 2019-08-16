const currencyButtons = [...document.querySelectorAll('.btn')];
const tbody = document.querySelector('.table>tbody');
const pageNumber = document.querySelector('.pagination__current');
let current_rlActive = 'RUB';
let current_wmActive = 'WMR';
let global = {
    data: [],
    buy: [],
    sale: [],
    currentLength: null,
    buyLength: null,
    saleLength: null,
    amount: 0,
    activeTable: null
};

// Display at the beginning
getTransactionsData('RUB', 'WMR');

currencyButtons.forEach(btn => { btn.addEventListener('click', onClickActive) });

function onClickActive(e) {
    const elem = e.currentTarget;
    if (elem.innerText === current_rlActive || elem.innerText === current_wmActive) return;

    const typeActive = elem.className.includes('wmBtn') ? 'wm' : 'rl';
    removeActive(typeActive);

    typeActive === 'wm' ? current_wmActive = elem.innerText : current_rlActive = elem.innerText;
    
    getTransactionsData(current_rlActive, current_wmActive);
    elem.classList.add('active');
}

async function getTransactionsData(RLcurrency, WMcurrency) {
    const response = await axios.get(`/history/${RLcurrency}-${WMcurrency}/api`.toLowerCase());
    
    global.data = response.data.reverse();
    global.currentLength = global.data.length;
    global.buy = getSpecificType('buy');
    global.sale = getSpecificType('sale');

    addToTable(global.data, WMcurrency, RLcurrency);
}

function addToTable(data, WMcurrency, RLcurrency) {
    let until = Math.min(global.amount + 20, data.length);

    changeColumns(WMcurrency, RLcurrency);
    let rows = ``;

    for (let i = global.amount; i < until; i++) {
        makeRatePrecise(data[i]);
        rows += createRow(data[i]);
    }
    tbody.innerHTML = rows;
    pageNumber.innerText = Math.floor(global.amount / 20 + 1);
}
function createRow(data) {
    return `<tr class = "table__row">
        <td>${data.FinishedAt}</td>
        <td class = '${data.BidsHistoryType} center type'>
        ${data.BidsHistoryType === 'sale' ? 'продажа' : 'покупка'}
        </td>
        <td>${data.AmountWm}</td>
        <td>${data.Amount}</td>
        <td class = bank>
            <img src = '${data.CardIcon}' class = 'img'/>
            <span class = 'bank__title'>${data.BankName}</span>
        </td>
        <td class = 'center rate'>${current_wmActive === 'WMR' && current_rlActive === 'RUB' ? data.RateFormatted + '%' : data.Rate}</td>
    </tr>`;
}
function changeColumns(WMcurrency, RLcurrency) {
    const currencyAmounts = document.querySelectorAll('.table__currencyAmount');
    currencyAmounts[0].innerText = `Количество ${WMcurrency}`;
    currencyAmounts[1].innerText = `Количество ${RLcurrency}`;
}
function removeActive(type) {
    const pageNumber = document.querySelector('.pagination__current');
    pageNumber.innerText = 1;

    global.amount = 0;
    const buttons = [...document.querySelectorAll(`.${type}Btn`)];

    buttons.forEach(item => item.classList.remove('active'));
}

const pages = document.querySelector('.pagination');
pages.addEventListener('click', e => {
    e.preventDefault();
    const btn = e.target;
    
    if (btn.className.includes('first')) onPageChange(0);
    else if (btn.className.includes('prev')) onPageChange(global.amount - 20);
    else if (btn.className.includes('next')) onPageChange(global.amount + 20);
    else if (btn.className.includes('last')) onPageChange(Math.floor(global.currentLength / 20) * 20);
});

function onPageChange(value) {
    if (value >= global.currentLength || value < 0) return;
    global.amount = value;
    
    addToTable(global[global.activeTable] || global.data, current_wmActive, current_rlActive);
}
function makeRatePrecise(data) {
    if (data.RateFormatted.includes("+") || data.RateFormatted.includes("-")) return;

    let preciseRate = (data.Amount.replace(',', '.') / data.AmountWm.replace(',', '.')).toFixed(4);
    if (data.Rate === preciseRate) return;

    data.Rate = preciseRate;
}

tbody.addEventListener('click', e => {
    const elem = e.target.className;
    if (!elem.includes('type')) return;
    const type = elem.split(' ')[0];
    global.activeTable = global.activeTable === null ? type : null;
    global.currentLength = global[global.activeTable] ? global[global.activeTable].length : global.data.length;

    addToTable(global[global.activeTable] || global.data, current_rlActive, current_wmActive);
});

function getSpecificType(type) {
    let specific = [];
    let data = global.data;
    for (let i = 0; i < data.length; i++) {
        if (data[i].BidsHistoryType === type) specific.push(data[i]);
    }

    return specific;
}