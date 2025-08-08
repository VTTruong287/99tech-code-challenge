// 1. Using a for loop (array.reduce)
const sum_to_n_a = function(n) {
    return Array.from({ length: n }, (_, i) => i + 1).reduce((number, current) => number + current, 0);
};

// 2. Using algorithm sum to n = (1 + 2 + 3 + ... + n) = (n + 1) * n / 2
const sum_to_n_b = function(n) {
    return n * (n + 1) / 2;
};

// 3. Using recursion (n + (n - 1) + (n - 2) + ... + 1)
const sum_to_n_c = function(n) {
    if (n <= 0) return 0;
    if (n === 1) return 1;
    return n + sum_to_n_c(n - 1);
};

// Validate input value is integer
const validateInputValue = (value) => {
    if (value === '') {
        alert('Input value is empty');
        return false;
    }

    if (isNaN(value)) {
        alert('Input value is not a integer');
        return false;
    }

    if (value % 1 !== 0) {
        alert('Input value is not a integer');
        return false;
    }

    return true;
}

// Bind data to input element
const bindDataToInputElement = (selector, value) => {
    const selectorEl = document.querySelector(selector);
    if (!selectorEl) {
        alert(`Element ${selector} not found`);
        return;
    }

    selectorEl.value = value;
}

// Init event listener
document.querySelector('#sum_a_btn').addEventListener('click', () => {
    const n = document.querySelector('#input_n').value;
    if (!validateInputValue(n)) {
        return;
    }
    bindDataToInputElement('#sum_a', sum_to_n_a(Number(n)));
});

document.querySelector('#sum_b_btn').addEventListener('click', () => {
    const n = document.querySelector('#input_n').value;
    if (!validateInputValue(n)) {
        return;
    }
    bindDataToInputElement('#sum_b', sum_to_n_b(Number(n)));
});

document.querySelector('#sum_c_btn').addEventListener('click', () => {
    const n = document.querySelector('#input_n').value;
    if (!validateInputValue(n)) {
        return;
    }
    bindDataToInputElement('#sum_c', sum_to_n_c(Number(n)));
});
