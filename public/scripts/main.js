const currencyButtons = [...document.querySelectorAll('.btn__top')];
const tbody = document.querySelector('.table>tbody');
const pageNumber = document.querySelector('.pagination__current');

const currentActive = {
    wm: 'WMR',
    rl: 'RUB'
}
let global = {
    data: [],
    pages: 0,
    activeTable: null
};

// Display at the beginning
getTransactionsData('RUB', 'WMR');

currencyButtons.forEach(btn => { btn.addEventListener('click', onClickActive) });

function onClickActive(e) {
    const elem = e.currentTarget;
    if (elem.innerText === currentActive.rl || elem.innerText === currentActive.wm) return;

    changeActive(elem);
    
    const typeActive = elem.className.includes('wmBtn') ? 'wm' : 'rl';
    currentActive[typeActive] = elem.innerText;
    
    getTransactionsData(currentActive.rl, currentActive.wm);
    
    pageNumber.innerText = 1;
}

async function getTransactionsData(rl, wm) {
    const response = (await axios.get(`/history/${rl}-${wm}/api`.toLowerCase())).data;
    
    global.data = response;
    global.pages = Math.ceil(response.length / 20);
    
    changeColumns();
    addToTable(global.data.slice(0, 20));
}

function addToTable(data) {
    tbody.innerHTML = '';

    for (let i = 0; i < data.length; i++) {
        makeRatePrecise(data[i]);
        tbody.innerHTML += createRow(data[i]);
    }
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
            <img src = '${data.CardIcon || data.Provider.Icon}' class = 'img'/>
            <span class = 'bank__title'>${data.BankName || data.Provider.Name}</span>
        </td>
        <td class = 'center rate'>${currentActive.wm === 'WMR' && currentActive.rl === 'RUB' ? data.RateFormatted + '%' : data.Rate}</td>
    </tr>`;
}
function changeColumns() {
    const currencyAmounts = document.querySelectorAll('.table__currencyAmount');
    currencyAmounts[0].innerText = `Количество ${currentActive.wm}`;
    currencyAmounts[1].innerText = `Количество ${currentActive.rl}`;
}

const pages = document.querySelector('.pagination');
pages.addEventListener('click', e => {
    e.preventDefault();
    const btn = e.target;
    if(!btn.className.includes('pagination__btn')) return;
    
    if (btn.className.includes('first')) pageNumber.innerText = 1;
    else if (btn.className.includes('prev')) {
        if (pageNumber.innerText - 1 < 1) return;
        pageNumber.innerText--;
    }
    else if (btn.className.includes('next')) {
        if (+pageNumber.innerText + 1 > global.pages) return;
        pageNumber.innerText++;
    }
    else if (btn.className.includes('last')) pageNumber.innerText = global.pages;

    pageChange();
});

function pageChange() {
    const option = global.activeTable || global.data;

    const from = (pageNumber.innerText - 1) * 20;
    const to = from + 20;
    const data = option.slice(from, to);

    addToTable(data);
}

function makeRatePrecise(data) {
    if (data.RateFormatted.includes("+") || data.RateFormatted.includes("-")) return;

    let preciseRate = (data.Amount.replace(',', '.') / data.AmountWm.replace(',', '.')).toFixed(4);
    if (data.Rate === preciseRate) return;

    data.Rate = preciseRate;
}

tbody.addEventListener('click', e => {
    const elem = e.target;
    const type = elem.className.split(' ')[0];

    if (elem.className.includes('type')) displaySpecificData('BidsHistoryType', type);
    else if (elem.className.includes('bank__title')) displaySpecificData('BankName', elem.innerText);
});
function displaySpecificData(property, value) {
    global.activeTable = global.activeTable === null ? getSpecificType(property, value) : null;
    const data = global.activeTable || global.data;

    global.pages = Math.ceil(data.length / 20);

    addToTable(data.slice(0, 20));
    pageNumber.innerText = 1;
}

function getSpecificType(property, value) {
    let specific = [];
    let data = global.data;
    for (let i = 0; i < data.length; i++) {
        if (property === 'BankName' && document.querySelector('.e-top').className.includes('active') && data[i].Provider.Name === value) specific.push(data[i]);
        else if (data[i][property] === value) specific.push(data[i]);
    }

    return specific;
}

const buttons = document.querySelectorAll('.buttons')[1];
buttons.addEventListener('click', e => {
    let elem = e.target;
    if (elem.className.includes('e-top')) {
        currencyButtons.forEach(btn => btn.classList.remove('active'));

        const e_bottom = document.querySelector('.first');
        elem.classList.add('active');
        e_bottom.classList.add('active');

        currentActive['rl'] = 'RUB';
        currentActive['wm'] = 'WMR';

        pageNumber.innerText = 1;
        getTransactionsData('ERUB', 'E' + currentActive.wm);
    }
    else if (elem.className.includes('e-bottom') || elem.parentElement.className.includes('e-bottom')) {
        if (elem.parentElement.className.includes('e-bottom')) elem = elem.parentElement;

        currencyButtons.forEach(btn => btn.classList.remove('active'));
        const e_top = document.querySelector('.e-top');
        const e_bottom = document.querySelectorAll('.e-bottom');
        e_bottom.forEach(btn => btn.classList.remove('active'));

        elem.classList.add('active');
        e_top.classList.add('active');
        currentActive['rl'] = 'RUB';
        if (elem.className.includes('first')) currentActive['wm'] = 'WMR';
        else currentActive['wm'] = 'WMZ';
        pageNumber.innerText = 1;

        getTransactionsData('ERUB', 'E' + currentActive.wm);

    }

});