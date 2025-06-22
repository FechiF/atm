'use strict';

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// BANKIST APP

// Data
const account1 = {
  owner: 'Juan dela Cruz',
  movements: [200, 455.23, -306.5, 25000, -642.21, -133.9, 79.97, 1300],
  interestRate: 1.2, // %
  pin: 1111,

  movementsDates: [
    '2019-11-18T21:31:17.178Z',
    '2019-12-23T07:42:02.383Z',
    '2025-01-28T09:15:04.904Z',
    '2025-04-16T10:17:24.185Z',
    '2020-05-08T14:11:59.604Z',
    '2025-04-10T17:01:17.194Z',
    new Date().toISOString(),
    '2020-08-01T10:51:36.790Z',
  ],
  currency: 'PHP',
  locale: 'en-PH', // de-DE
};

const account2 = {
  owner: 'Mary Grace Piattos',
  movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
  interestRate: 1.5,
  pin: 2222,

  movementsDates: [
    '2019-11-01T13:15:33.035Z',
    '2019-11-30T09:48:16.867Z',
    '2019-12-25T06:04:23.907Z',
    '2020-01-25T14:18:46.235Z',
    '2020-02-05T16:33:06.386Z',
    '2020-04-10T14:43:26.374Z',
    '2020-06-25T18:49:59.371Z',
    '2020-07-26T12:01:20.894Z',
  ],
  currency: 'USD',
  locale: 'en-PH',
};

const accounts = [account1, account2];

let currentAccount = {};
let logoutTimer;
// Elements
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');

const btnLogin = document.querySelector('.login__btn');
const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');

const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// LECTURES

const currencies = new Map([
  ['USD', 'United States dollar'],
  ['EUR', 'Euro'],
  ['GBP', 'Pound sterling'],
  ['PHP', 'Philippine Peso'],
]);

const movements = [200, 450, -400, 3000, -650, -130, 70, 1300];

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// Functions

const login = () => {
  // currentAccount = checkCredentials();

  currentAccount?.userName !== undefined && showUI();
  startLogoutTimer();
};

const checkCredentials = () => {
  for (const account of accounts) {
    if (
      account.userName == inputLoginUsername.value &&
      account.pin == Number(inputLoginPin.value)
    ) {
      return account;
    }
  }
};

const transferMoney = () => {
  // deduct from current
  const transferTo = accounts.find(
    acc => acc.userName === inputTransferTo.value
  );
  const amt = Number(inputTransferAmount.value);
  if (
    transferTo &&
    transferTo !== currentAccount &&
    amt > 0 &&
    calcDisplayBalance() - amt >= 0
  ) {
    const transactionDate = new Date().toISOString();

    transferTo.movements.push(amt);
    transferTo.movementsDates.push(transactionDate);

    currentAccount.movements.push(amt * -1);
    currentAccount.movementsDates.push(transactionDate);
    updateUIDate(transactionDate);
    updateUI();
  }

  updateUI();
};

const requestLoan = () => {
  //any deposit >10% of request?
  const request = Number(inputLoanAmount.value);
  console.log(3000 > request * 0.1);

  if (currentAccount.movements.some(mov => mov > request * 0.1)) {
    const transactionDate = new Date().toISOString;
    currentAccount.movements.push(request * -1);
    currentAccount.movementsDates.push(transactionDate);
    updateUIDate(transactionDate);
    updateUI();
  }
};

const closeAccount = () => {
  const index = accounts.findIndex(
    acc =>
      acc.userName === inputCloseUsername.value &&
      acc.pin === Number(inputClosePin.value)
  );

  if (index > -1) {
    accounts.splice(index, 1);
    console.log(accounts);

    logout();
  }
};

const filterPositive = () => currentAccount.movements.filter(mov => mov > 0);
const filterNegative = () => currentAccount.movements.filter(mov => mov < 0);

const sortMovements = () => {
  currentAccount.movements.sort((a, b) => (a > b ? 1 : -1));
  displayMovements();
};

//calculations
const convertCurrency = () => {};

const calcDisplayBalance = () => {
  const bal = currentAccount.movements.reduce((acc, mov) => (acc += mov));
  labelBalance.textContent = formatCurrency(bal);
  return bal;
};
const calcDisplaySummary = () => {
  const positives = filterPositive();
  const negatives = filterNegative();
  const income = positives.length
    ? positives.reduce((acc, mov) => (acc += mov))
    : 0;
  const expense = negatives.length
    ? negatives.reduce((acc, mov) => (acc += mov))
    : 0;

  labelSumIn.textContent = formatCurrency(income);
  labelSumOut.textContent = formatCurrency(expense);

  labelSumInterest.textContent = formatCurrency(
    (income + expense) * (currentAccount.interestRate / 100)
  );
};

// UI
const updateUI = () => {
  calcDisplayBalance();
  calcDisplaySummary();
  displayMovements();
};

const updateUIDate = date => {
  const options = {
    hour: 'numeric',
    minute: 'numeric',
    day: 'numeric',
    month: 'long', // can be 2 digit for 03
    year: 'numeric',
    weekday: 'long',
  };
  labelDate.textContent = new Intl.DateTimeFormat(
    currentAccount.locale,
    options
  ).format(date);
};

const calcDaysPassed = (date1, date2) => {
  return Math.abs(date2 - date1) / (1000 * 60 * 60 * 24);
};

const formatCurrency = amount => {
  return Intl.NumberFormat(currentAccount.locale, {
    style: 'currency',
    currency: currentAccount.currency,
  }).format(amount);
};

const formatDate = date => {
  const options = {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  };

  let dateString = new Intl.DateTimeFormat(
    currentAccount.locale,
    options
  ).format(date);

  const daysAgo = calcDaysPassed(date, new Date());

  if (daysAgo <= 1) {
    dateString = `today`;
  } else if (daysAgo < 2) {
    dateString = `yesterday`;
  } else if (daysAgo < 7) {
    dateString = `${Math.round(daysAgo, 0)} days ago`;
  } else if (daysAgo < 14) {
    dateString = 'More than a week ago';
  }

  return dateString;
};

const displayMovements = () => {
  containerMovements.innerHTML = '';

  for (const [index, amount] of currentAccount.movements.entries()) {
    const dateString = formatDate(
      new Date(currentAccount.movementsDates[index])
    );

    const movementsType = amount > -1 ? 'deposit' : 'withdrawal';
    const html = `<div class="movements__row">
          <div class="movements__type movements__type--${movementsType}">${index} ${movementsType}</div>
          <div class="movements__date">${dateString}</div>
          <div class="movements__value">${formatCurrency(amount)}</div>
        </div>`;

    containerMovements.insertAdjacentHTML('afterBegin', html);
  }
};

const startLogoutTimer = () => {
  let time = 60 * 5; // seconds
  logoutTimer = setInterval(() => {
    const minute = `${Math.trunc(time / 60)}`.padStart(2, 0),
      seconds = `${Math.trunc(time % 60)}`.padStart(2, 0);

    labelTimer.textContent = `${minute}:${seconds}`;

    if (time === 0) {
      logout();
    }
    time--;
  }, 1000);
};

const logout = () => {
  clearInterval(logoutTimer);
  containerMovements.innerHTML = '';
  currentAccount = {};
  labelWelcome.textContent = 'Log in to get started';
  containerApp.classList.remove('show');
};
const showUI = () => {
  const owner = currentAccount.owner;
  labelWelcome.innerHTML = `<p>Welcome back, ${owner.slice(
    0,
    owner.indexOf(' ')
  )}!</p>`;
  updateUIDate(new Date());
  updateUI();
  containerApp.classList.add('show');
  //set timer
};

// event listeners

btnLogin.addEventListener('click', function (e) {
  e.preventDefault();
  login();
});

btnSort.addEventListener('click', sortMovements);

// add username to accounts
for (const account of accounts) {
  const names = account.owner.split(' ').map(name => name.slice(0, 1));
  account.userName = names.join('').toUpperCase();
}

btnTransfer.addEventListener('click', function (e) {
  e.preventDefault();
  transferMoney();
});
btnLoan.addEventListener('click', function (e) {
  e.preventDefault();
  requestLoan();
});
btnClose.addEventListener('click', function (e) {
  e.preventDefault();
  closeAccount();
});

currentAccount = account1;
login();

console.log(navigator.language);
const num = 3884764.23;
const options = {
  style: 'unit', //unit percent or currency
  unit: 'mile-per-hour', //celsius etc only for style unit,
  currency: 'EUR', // cannot be gleaned from locale only for style currency
};

console.log('US:      ', new Intl.NumberFormat('en-US', options).format(num));
console.log('Germany: ', new Intl.NumberFormat('de-DE', options).format(num));
console.log('Syria:   ', new Intl.NumberFormat('ar-SY', options).format(num));
console.log(
  navigator.language,
  new Intl.NumberFormat(navigator.language, options).format(num)
);
