document.addEventListener('DOMContentLoaded', loadStoredData);

let entryCount = 0; // Лічильник записів

function loadStoredData() {
    fetch('/records')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            dataTable.innerHTML = ''; // Очищуємо таблицю перед завантаженням нових даних
            entryCount = 0; // Скидання лічильника
            data.forEach(record => addDataToTable(record));
            updateFooter();
        })
        .catch(error => console.error('There was a problem with the fetch operation:', error));
}

function addDataToTable(record) {
    const newRow = dataTable.insertRow();
    const dateCell = newRow.insertCell(0);
    const addressCell = newRow.insertCell(1);
    const amountCell = newRow.insertCell(2);
    const actionsCell = newRow.insertCell(3);

    dateCell.textContent = formatDateForDisplay(record[1]);
    addressCell.textContent = record[2];
    amountCell.textContent = record[3].toFixed(2);

    const paidButton = document.createElement('button');
    paidButton.className = 'paid';
    paidButton.textContent = 'Оплачено';
    paidButton.onclick = () => {
        const paymentDate = prompt('Введіть дату оплати (дд/мм/рррр):');
        if (paymentDate) {
            markAsPaid(newRow, paymentDate);
        }
        updateFooter();
    };

    const notPaidButton = document.createElement('button');
    notPaidButton.className = 'not-paid';
    notPaidButton.textContent = 'Не оплачено';
    notPaidButton.onclick = () => {
        markAsNotPaid(newRow);
        updateFooter();
    };

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete';
    deleteButton.textContent = 'Видалити';
    deleteButton.onclick = () => deleteEntry(record[0]);

    actionsCell.appendChild(paidButton);
    actionsCell.appendChild(notPaidButton);
    actionsCell.appendChild(deleteButton);

    // Додаємо рядок як "не оплачено" за замовчуванням
    markAsNotPaid(newRow);
    entryCount++;

    // Перевірка, якщо додано 5 записів
    if (entryCount % 5 === 0) {
        addSumRow();
    }
}

function formatDateForDisplay(dateString) {
    if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }
    return dateString;
}

function markAsPaid(row, paymentDate) {
    row.classList.add('paid-row');
    row.classList.remove('not-paid-row');
    const dateCell = row.cells[0];
    dateCell.textContent = dateCell.textContent.split(' (оплачено:')[0]; // Видаляємо попередню дату оплати, якщо вона була
    dateCell.textContent += ` (оплачено: ${paymentDate})`;
    row.setAttribute('data-paid', 'paid'); // Зберігаємо статус оплати у вигляді атрибуту
    row.setAttribute('data-payment-date', paymentDate); // Зберігаємо дату оплати у вигляді атрибуту
}

function markAsNotPaid(row) {
    row.classList.add('not-paid-row');
    row.classList.remove('paid-row');
    const dateCell = row.cells[0];
    dateCell.textContent = dateCell.textContent.split(' (оплачено:')[0]; // Видаляємо дату оплати, якщо запис знову позначено як "не оплачено"
    row.setAttribute('data-paid', 'not-paid'); // Зберігаємо статус як "не оплачено"
    row.removeAttribute('data-payment-date'); // Видаляємо атрибут дати оплати
}

function updateFooter() {
    const rows = Array.from(dataTable.rows);
    let paidSum = 0;
    let notPaidSum = 0;

    rows.forEach(row => {
        const amount = parseFloat(row.cells[2].textContent);
        if (row.classList.contains('paid-row')) {
            paidSum += amount;
        } else if (row.classList.contains('not-paid-row')) {
            notPaidSum += amount;
        }
    });

    document.getElementById('paid-sum').textContent = `Сума оплачених: ${paidSum.toFixed(2)} грн`;
    document.getElementById('not-paid-sum').textContent = `Сума неоплачених: ${notPaidSum.toFixed(2)} грн`;
}

function addSumRow() {
    const sum = Array.from(dataTable.rows)
        .slice(-5)
        .reduce((total, row) => {
            const amount = parseFloat(row.cells[2].textContent);
            return total + amount;
        }, 0);

    const sumRow = dataTable.insertRow();
    const sumCell = sumRow.insertCell(0);
    sumCell.colSpan = 2;
    sumCell.textContent = "Сума останніх 5 записів:";

    const totalCell = sumRow.insertCell(1);
    totalCell.textContent = sum.toFixed(2);

    const actionsCell = sumRow.insertCell(2);
    // Видалено кнопку "Оплачено" для рядка суми останніх 5 записів
}

function addRecord() {
    const date = document.getElementById('date').value;
    const address = document.getElementById('address').value;
    const amount = document.getElementById('amount').value;

    if (validateData(date, address, amount)) {
        const formattedDate = formatDateForStorage(date);
        const record = { date: formattedDate, address, amount: parseFloat(amount) };
        fetch('/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(record)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            loadStoredData();
            form.reset();
        })
        .catch(error => console.error('There was a problem with the fetch operation:', error));
    }
}

function deleteEntry(id) {
    fetch(`/delete/${id}`, { method: 'DELETE' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            loadStoredData();
            updateFooter();
        })
        .catch(error => console.error('There was a problem with the fetch operation:', error));
}

function validateData(date, address, amount) {
    if (!date || !address || !amount) {
        alert('Будь ласка, заповніть всі поля.');
        return false;
    }
    return true;
}

function formatDateForStorage(dateString) {
    if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month}-${day}`;
    }
    return dateString;
}

document.addEventListener('DOMContentLoaded', function() {
    loadStoredData();
    initializeAutoComplete();
});

function initializeAutoComplete() {
    const addressInput = document.getElementById('address');
    const storedAddresses = JSON.parse(localStorage.getItem('addresses')) || [];

    addressInput.addEventListener('input', function() {
        let match = storedAddresses.find(address => address.toLowerCase().startsWith(addressInput.value.toLowerCase()));
        if (match) {
            addressInput.value = match;
        }
    });

    document.getElementById('dataForm').addEventListener('submit', function() {
        const currentAddress = addressInput.value;
        if (!storedAddresses.includes(currentAddress)) {
            storedAddresses.push(currentAddress);
            localStorage.setItem('addresses', JSON.stringify(storedAddresses));
        }
    });
}
