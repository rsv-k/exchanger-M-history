const currencyButtons = [...document.querySelectorAll('.btn__top')];
const tbody = document.querySelector('.table>tbody');
const pageNumber = document.querySelector('.pagination__current');

const currentActive = {
    wm: 'WMR',
    rl: 'RUB'
}
let global = {
    data: [],
    pages: 1,
    lastPage: undefined,
    activeTable: null,
    size: undefined,
    activeData: 'common',
    bank: null
};

// Display table with data in the beginning
getTransactionsData(currentActive.rl, currentActive.wm);

currencyButtons.forEach(btn => { btn.addEventListener('click', onClickActive) });

function onClickActive(e) {
    const elem = e.currentTarget;
    const ebtn = document.querySelector('.e-top').className.includes('active');
    if (!ebtn && (elem.innerText === currentActive.rl || elem.innerText === currentActive.wm)) return;

    if (ebtn) {
        const ebuttons = [...document.querySelectorAll('.e-btn')];
        ebuttons.forEach(btn => btn.classList.remove('active'));

        if (e.currentTarget.className.includes('rlBtn')) {
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
    currentActive[typeActive] = elem.innerText;
    global.pages = 1;
    
    getTransactionsData(currentActive.rl, currentActive.wm);
    
    pageNumber.innerText = 1;
}

async function getTransactionsData(rl, wm) {
    global.activeData = 'common';
    const response = (await axios.get(`/api/history/${rl}_${wm}/page/${global.pages}`)).data;
    
    global.data = response.data;
    global.size = Math.floor(response.pagesAmount / 20);

    changeColumns();
    addToTable(global.data);
}
async function getBuysData(rl, wm) {
    global.activeData = 'buys';
    const response = (await axios.get(`/api/history/${rl}_${wm}/buys/page/${global.pages}`)).data;

    global.data = response.data;
    global.size = Math.floor(response.pagesAmount / 20);

    changeColumns();
    addToTable(global.data);
}
async function getSalesData(rl, wm) {
    global.activeData = 'sales';
    const response = (await axios.get(`/api/history/${rl}_${wm}/sales/page/${global.pages}`)).data;

    global.data = response.data;
    global.size = Math.floor(response.pagesAmount / 20);

    changeColumns();
    addToTable(global.data);
}

async function getBanksData(rl, wm) {
    global.activeData = 'banks';
    const response = (await axios.get(`/api/history/${rl}_${wm}/banks/${global.bank}/page/${global.pages}`)).data;

    global.data = response.data;
    global.size = Math.floor(response.pagesAmount / 20);

    changeColumns();
    addToTable(global.data);
}

function addToTable(data) {
    tbody.innerHTML = '';

    for (let i = 0; i < data.length; i++) {
        makeRatePrecise(data[i]);
        tbody.innerHTML += createRow(data[i]);
    }
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
        if (+pageNumber.innerText + 1 > global.size) return;

        pageNumber.innerText++;
    }
    else if (btn.className.includes('last')) pageNumber.innerText = global.size;

    global.pages = pageNumber.innerText;

    pageChange();
});

function pageChange() {
    if (global.activeData === 'common') {
        getTransactionsData(currentActive.rl, currentActive.wm);
    }
    else if (global.activeData === 'buys') getBuysData(currentActive.rl, currentActive.wm);
    else if (global.activeData === 'sales') getSalesData(currentActive.rl, currentActive.wm);
    else if (global.activeData === 'banks') getBanksData(currentActive.rl, currentActive.wm);
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

    if (elem.className.includes('type')) {
        if (elem.innerText === 'продажа') {
            if (global.activeData !== 'common') return getTransactionsData(currentActive.rl, currentActive.wm);

            getSalesData(currentActive.rl, currentActive.wm);
        }
        else {
            if (global.activeData !== 'common') return getTransactionsData(currentActive.rl, currentActive.wm);

            getBuysData(currentActive.rl, currentActive.wm);
        }
        global.pages = 1;
    }
    else if (elem.className.includes('bank__title')) {
        if (global.activeData !== 'common') return getTransactionsData(currentActive.rl, currentActive.wm);

        global.pages = 1;
        global.bank = elem.innerText;
        getBanksData(currentActive.rl, currentActive.wm);
    }
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

        currentActive['rl'] = 'ERUB';
        currentActive['wm'] = 'EWMR';

        pageNumber.innerText = 1;
        getTransactionsData(currentActive.rl, currentActive.wm);
    }
    else if (elem.className.includes('e-bottom') || elem.parentElement.className.includes('e-bottom')) {
        if (elem.parentElement.className.includes('e-bottom')) elem = elem.parentElement;

        currencyButtons.forEach(btn => btn.classList.remove('active'));
        const e_top = document.querySelector('.e-top');
        const e_bottom = document.querySelectorAll('.e-bottom');
        e_bottom.forEach(btn => btn.classList.remove('active'));

        elem.classList.add('active');
        e_top.classList.add('active');
        currentActive['rl'] = 'ERUB';
        if (elem.className.includes('first')) currentActive['wm'] = 'EWMR';
        else currentActive['wm'] = 'EWMZ';
        pageNumber.innerText = 1;

        getTransactionsData(currentActive.rl, currentActive.wm);
    }
});

/*======================== 
TABLE CREATION AND CHANGES
========================*/

// Create row in a table with information in columns
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
// Change currency in main columns' name
function changeColumns() {
    const currencyAmounts = document.querySelectorAll('.table__currencyAmount');
    currencyAmounts[0].innerText = `Количество ${currentActive.wm}`;
    currencyAmounts[1].innerText = `Количество ${currentActive.rl}`;
}