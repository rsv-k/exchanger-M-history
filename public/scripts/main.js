const currencyButtons = [...document.querySelectorAll('.btn')];
let current_rlActive = 'RUB';
let current_wmActive = 'WMR';
let dataLength = 0;
let amount = 0;

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

function getTransactionsData(RLcurrency, WMcurrency) {
    axios.get(`/history/${RLcurrency}-${WMcurrency}/api`.toLocaleLowerCase())
    .then(response => { 
        
        dataLength = response.data.length;
        addToTable(response.data, WMcurrency, RLcurrency)
    })
    .catch(err => console.error(err));
}

function addToTable(data, WMcurrency, RLcurrency) {
    data = data.reverse();
    let until = amount + 20;

    if (until >= data.length) until = data.length;
    
    const table = document.querySelector('.table');
    let rows = `<thead>
                    <tr>
                        <th>Завершено</th>
                        <th>Тип</th>
                        <th>Количество ${WMcurrency}</th>
                        <th>Количество ${RLcurrency}</th>
                        <th>Банк</th>
                        <th>Курс</th>
                    </tr>
                </thead>`;

    rows += '<tbody>';
    for(let i = amount; i < until; i++) {
        makeRatePrecise(data[i]);
        rows += `
            <tr>
                <td>${data[i].FinishedAt}</td>
                <td class = '${data[i].BidsHistoryType} center'>
                ${data[i].BidsHistoryType === 'sale' ? 'продажа' : 'покупка'}
                </td>
                <td>${data[i].AmountWm}</td>
                <td>${data[i].Amount}</td>
                <td class = bank>
                    <img src = '${data[i].CardIcon}' class = 'img'/>
                    <span class = 'bank__title'>${data[i].BankName}</span>
                </td>
                <td class = center>${data[i].RateFormatted.includes('+') || data[i].RateFormatted.includes('-') ? data[i].RateFormatted + '%' : data[i].Rate}</td>
            </tr>
        `;
    }
    rows += '</tbody>';
    table.innerHTML = rows;

    const pageNumber = document.querySelector('.pagination__current');
    pageNumber.innerText = Math.floor(amount / 10 + 1);
}
function removeActive(type) {
    const pageNumber = document.querySelector('.pagination__current');
    pageNumber.innerText = 1;

    amount = 0;
    const buttons = [...document.querySelectorAll(`.${type}Btn`)];

    buttons.forEach(item => item.classList.remove('active'));
}

const pagination = document.querySelectorAll('.pagination__btn');
pagination[2].addEventListener('click', (e) => onPageChange(e, amount + 20) );
pagination[3].addEventListener('click', (e) => onPageChange(e, ~~(dataLength / 20) * 20) );
pagination[1].addEventListener('click', (e) => onPageChange(e, amount - 20) );
pagination[0].addEventListener('click', (e) => onPageChange(e, 0) );

function onPageChange(e, value) {
    e.preventDefault();
    if (value >= dataLength || value < 0) return;
    
    amount = value;
    
    getTransactionsData(current_rlActive, current_wmActive);
}
function makeRatePrecise(data) {
    if (data.RateFormatted.includes("+") || data.RateFormatted.includes("-")) return;

    let preciseRate = (data.Amount.replace(',', '.') / data.AmountWm.replace(',', '.')).toFixed(4);
    if (data.Rate === preciseRate) return;

    data.Rate = preciseRate;
}