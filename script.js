/////////////////////////////////////////////////////////////////////// Data

let db;

function openDatabase() {
    const request = indexedDB.open("MyDatabase", 2);

    request.onupgradeneeded = function (event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains('rows')) {
            db.createObjectStore('rows', { keyPath: 'id' });
        }
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        console.log("Database opened successfully");
        loadData();
        addTooltipToCellsContainingImages();
        // Load each tooltip data
        for (let i = 1; i <= 5; i++) {
            loadTooltip(`tooltip-${i}`);
        }
    };

    request.onerror = function (event) {
        console.error("Database error: " + event.target.errorCode);
    };
}

function loadData() {
    let transaction = db.transaction(['rows'], 'readonly');
    let store = transaction.objectStore('rows');
    let request = store.openCursor();

    request.onsuccess = function (event) {
        let cursor = event.target.result;
        if (cursor) {
            let data = cursor.value;

            if (data.id === 'initialCapital') {
                // Set the initial capital
                let initialCapitalInput = document.getElementById('initial-capital');
                document.getElementById('initial-capital').value = data.value || '';
                // Delay the event dispatch
                setTimeout(() => {
                    let event = new Event('input');
                    initialCapitalInput.dispatchEvent(event);
                }, 50); // Delay can be adjusted
            } else {
                let rowId = data.id;
                // Set values for the other inputs
                document.querySelector(`input[name="time-${rowId}"]`).value = data.time || '';
                document.querySelector(`input[name="play-${rowId}"]`).value = data.play || '';
                document.querySelector(`input[name="grade-${rowId}"]`).value = data.grade || '';
                document.querySelector(`input[name="ticker-${rowId}"]`).value = data.ticker || '';
                document.querySelector(`input[name="lev-${rowId}"]`).value = data.lev || '';
                document.querySelector(`input[name="size-${rowId}"]`).value = data.size || '';
                document.querySelector(`input[name="entry-${rowId}"]`).value = data.entry || '';
                document.querySelector(`input[name="stop-${rowId}"]`).value = data.stop || '';
                document.querySelector(`input[name="exit-${rowId}"]`).value = data.exit || '';
                document.querySelector(`input[name="balance-${rowId}"]`).value = data.balance || '';
                document.querySelector(`input[name="close-${rowId}"]`).value = data.close || '';
                document.querySelector(`textarea[name="error-${rowId}"]`).value = data.errorLog || '';

                // Set state for checkboxes
                if (data.checklist && data.checklist.length) {
                    data.checklist.forEach((checked, index) => {
                        let checkbox = document.querySelector(`input[name="checklist${rowId}_${index + 1}"]`);
                        if (checkbox) {
                            checkbox.checked = checked;
                        }
                    });
                }

                // Set content for 'snip' cell
                let snipDiv = document.querySelector(`div[name="snip-${rowId}"]`);
                if (snipDiv) {
                    snipDiv.innerHTML = data.snip || '';
                }

                cursor.continue();
            }
        };

        request.onerror = function (event) {
            console.error("Error in reading data: " + event.target.errorCode);
        };
    }
    request.onerror = function (event) {
        console.error("Error in reading data: " + event.target.errorCode);
    };
    // After loading the data:
    addTooltipToCellsContainingImages();
    setBackgroundColorForImageCells();
}


// Call the function to open the database
openDatabase();

function autosave(rowId) {

    // Check if the rowId is for the initial capital
    if (rowId === 'initialCapital') {
        saveInitialCapital();
    } else {
        let transaction = db.transaction(['rows'], 'readwrite');
        let store = transaction.objectStore('rows');

        let data = {
            id: rowId,
            time: document.querySelector(`input[name="time-${rowId}"]`).value,
            play: document.querySelector(`input[name="play-${rowId}"]`).value,
            grade: document.querySelector(`input[name="grade-${rowId}"]`).value,
            ticker: document.querySelector(`input[name="ticker-${rowId}"]`).value,
            lev: document.querySelector(`input[name="lev-${rowId}"]`).value,
            size: document.querySelector(`input[name="size-${rowId}"]`).value,
            entry: document.querySelector(`input[name="entry-${rowId}"]`).value,
            stop: document.querySelector(`input[name="stop-${rowId}"]`).value,
            exit: document.querySelector(`input[name="exit-${rowId}"]`).value,
            balance: document.querySelector(`input[name="balance-${rowId}"]`).value,
            close: document.querySelector(`input[name="close-${rowId}"]`).value,
            errorLog: document.querySelector(`textarea[name="error-${rowId}"]`).value,
            checklist: Array.from(document.querySelectorAll(`.data-row[data-row-id="${rowId}"] .checklist-item`)).map(chk => chk.checked),
            snip: document.querySelector(`div[name="snip-${rowId}"]`).innerHTML
        };
        // Log data
        console.log("Saving data for row", rowId, data);
        store.put(data);
    }
}
// Attach event listeners
document.querySelectorAll('.data-row').forEach(row => {
    row.querySelectorAll('input, .image-paste-area').forEach(input => {
        input.addEventListener('change', () => autosave(row.dataset.rowId));
        if (input.classList.contains('image-paste-area')) {
            input.addEventListener('paste', () => setTimeout(() => autosave(row.dataset.rowId), 100)); // Delay to ensure image is loaded
        }
    });
    row.querySelectorAll('.checklist-item').forEach(checkbox => {
        checkbox.addEventListener('change', () => autosave(row.dataset.rowId));
    });
});

function saveInitialCapital() {
    let initialCapitalValue = document.getElementById('initial-capital').value;

    let transaction = db.transaction(['rows'], 'readwrite');
    let store = transaction.objectStore('rows');

    let initialCapitalData = {
        id: 'initialCapital', // Unique ID for initial capital
        value: initialCapitalValue
    };

    store.put(initialCapitalData);
    console.log("Saving initial capital:", initialCapitalValue);
    document.dispatchEvent(new Event('initialCapitalSaved'));
}


// Attach event listener to the initial capital input
document.getElementById('initial-capital').addEventListener('input', saveInitialCapital);

function saveTooltip(tooltipId) {
    let tooltipValue = document.getElementById(tooltipId).value;

    let transaction = db.transaction(['rows'], 'readwrite');
    let store = transaction.objectStore('rows');

    let tooltipData = {
        id: tooltipId,
        value: tooltipValue
    };

    store.put(tooltipData);
    console.log("Saving tooltip data:", tooltipId, tooltipValue);
}
// Assuming your tooltip inputs have IDs 'tooltip-1' to 'tooltip-5'
for (let i = 1; i <= 5; i++) {
    let tooltipInput = document.getElementById(`tooltip-${i}`);
    tooltipInput.addEventListener('change', function () {
        saveTooltip(tooltipInput.id);
    });
}
function loadTooltip(tooltipId) {
    let transaction = db.transaction(['rows'], 'readonly');
    let store = transaction.objectStore('rows');
    let request = store.get(tooltipId);

    request.onsuccess = function () {
        let data = request.result;
        if (data) {
            let tooltipInput = document.getElementById(data.id);
            if (tooltipInput) {
                tooltipInput.value = data.value || '';
                console.log(`Loaded value for ${data.id}: ${data.value}`);
            }
        } else {
            console.log(`No data found for ${tooltipId}`);
        }
    };

    request.onerror = function (event) {
        console.error(`Error in loading tooltip ${tooltipId}:`, event.target.errorCode);
    };
}


/////////////////////////////////////////////////////////////////////// Functionality
// Resize containers
document.addEventListener('DOMContentLoaded', function () {
    const entryContainer = document.getElementById('entry-container');
    const resizeHandle = document.getElementById('resize-handle');
    const mainContainer = document.getElementById('main-container');

    resizeHandle.addEventListener('mousedown', function (e) {
        e.preventDefault();
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResize);
    });

    function resize(e) {
        requestAnimationFrame(function () {
            const newEntryWidth = e.clientX - mainContainer.offsetLeft;
            entryContainer.style.width = `${newEntryWidth}px`;
        });
    }
    function stopResize() {
        window.removeEventListener('mousemove', resize);
    }
});

// Toggle view button
document.getElementById('toggle-button').addEventListener('click', function () {
    var entryContainer = document.getElementById('entry-container');
    if (entryContainer.style.width === '40%') {
        entryContainer.style.width = '80%'; // or the original width
    } else {
        entryContainer.style.width = '40%'; // min-width
    }
});


// Disable animation if dragging resize
const entryContainer = document.getElementById('entry-container');

// Function to disable transition
function disableTransition() {
    entryContainer.style.transition = 'none';
}

// Function to enable transition
function enableTransition() {
    entryContainer.style.transition = 'width 0.5s ease';
}

// Event listener for when resizing starts
entryContainer.addEventListener('mousedown', disableTransition);

// Event listener for when resizing ends
document.addEventListener('mouseup', enableTransition);

// Enable press space bar on checkboxs
document.querySelectorAll('.checklist label').forEach(label => {
    label.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.keyCode === 32) {
            e.preventDefault(); // Prevent the default action (scrolling)
            this.querySelector('input[type="checkbox"]').click();
        }
    });
});

// Datetime tab out function/listener
document.querySelectorAll('input[type="datetime-local"]').forEach(input => {
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Tab' && !input.value) {
            input.value = getCurrentDateTime();
            // Get the data-row-id from the parent <tr> element
            const rowId = input.closest('.data-row').getAttribute('data-row-id');
            // Trigger autosave with the correct rowId
            autosave(rowId);
        }
    });
});


function getCurrentDateTime() {
    const now = new Date();
    return now.toISOString().substring(0, 16);
}

// Text area expansion
document.querySelectorAll('textarea').forEach(textarea => {
    textarea.addEventListener('focus', function () {
        this.classList.add('expanded');
        adjustChecklistAlignment(this, 'expand');
    });

    textarea.addEventListener('blur', function () {
        this.classList.remove('expanded');
        adjustChecklistAlignment(this, 'collapse');
    });
});

function adjustChecklistAlignment(textarea, action) {
    const row = textarea.closest('tr');
    if (!row) return;

    const checklistCell = row.querySelector('.checklist');
    if (!checklistCell) return;

    const expandedPaddingTop = '100px'; // Adjust as needed for expanded state
    const originalPaddingTop = '3px'; // Adjust as needed for original state

    if (action === 'expand') {
        checklistCell.style.paddingTop = expandedPaddingTop;
    } else if (action === 'collapse') {
        checklistCell.style.paddingTop = originalPaddingTop;
    }
}

document.querySelectorAll('.image-paste-area').forEach(area => {
    area.addEventListener('paste', function (event) {
        const items = (event.clipboardData || window.clipboardData).items;
        for (let item of items) {
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                const reader = new FileReader();
                reader.onload = (e) => {
                    area.innerHTML = `<img src="${e.target.result}" alt="Pasted Image">`;
                    // Change the background color as soon as the image is inserted
                    area.style.backgroundColor = '#ADD8E61f'; // Example color, change as needed
                };
                reader.readAsDataURL(blob);
            }
        }
        event.preventDefault(); // Prevent the default paste action
        addTooltipToCellsContainingImages();
    });

    area.addEventListener('click', function (event) {
        const img = this.querySelector('img');
        if (event.ctrlKey && img) {
            img.remove(); // Remove the image element if Ctrl key is pressed
            this.removeAttribute('title'); // Remove the tooltip
            this.style.backgroundColor = ''; // Revert to original background color
            // Additional logic to update or delete the corresponding image URL data in IndexedDB
            const rowId = this.getAttribute('name').split('-')[1];
            updateOrDeleteImageDataInIndexedDB(rowId);
        } else if (img) {
            // Regular click functionality to display the modal
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('imgInModal');

            modal.style.display = "block";
            modalImg.src = img.src;
        }
    });
});


// Close the modal if the user clicks on the modal image
document.getElementById('imgInModal').addEventListener('click', function () {
    const modal = document.getElementById('imageModal');
    modal.style.display = "none";
});

// Close the modal if the user clicks on the modal image or the black background
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('imgInModal');

modal.onclick = function (event) {
    if (event.target === modal || event.target === modalImg) {
        modal.style.display = "none";
    }
};

// Close the modal with Esc key or Space key
document.addEventListener('keydown', function (event) {
    const modal = document.getElementById('imageModal');
    if (event.key === "Escape" || event.key === " ") {
        modal.style.display = "none";
    }
});



function calculateChange() {
    let initialCapitalInput = document.getElementById('initial-capital');
    let initialCapital = parseFloat(initialCapitalInput.value) || 0;
    let previousBalance = initialCapital;

    // Iterate over each row
    document.querySelectorAll('.data-row').forEach((row, index) => {
        let balanceInput = row.querySelector('input[name^="balance-"]');
        if (balanceInput && balanceInput.value) {
            let currentBalance = parseFloat(balanceInput.value);
            let changeD = 0;
            let changeP = 0;

            if (index === 0) {
                // For the first row
                changeD = currentBalance - initialCapital;
                changeP = initialCapital ? (changeD / initialCapital * 100) : 0;
            } else {
                // For subsequent rows
                changeD = currentBalance - previousBalance;
                changeP = previousBalance ? (changeD / previousBalance * 100) : 0;
            }

            // Update previous balance for the next iteration
            previousBalance = currentBalance;

            // Display the change in the corresponding span
            let changeDSpan = row.querySelector(`span[name="changeD-${index + 1}"]`);
            let changePSpan = row.querySelector(`span[name="changeP-${index + 1}"]`);
            if (changeDSpan) {
                changeDSpan.textContent = changeD.toFixed(0);
            }
            if (changePSpan) {
                changePSpan.textContent = `${changeP.toFixed(0)}%`;
            }
        } else if (index !== 0) {
            // If the balance input is empty, reset the previous balance to the last known balance
            let previousRowBalanceInput = document.querySelector(`input[name="balance-${index}"]`);
            previousBalance = previousRowBalanceInput ? parseFloat(previousRowBalanceInput.value) || previousBalance : previousBalance;
        }
    });
}

// Attach event listeners to balance inputs and initial capital input
document.querySelectorAll('input[name^="balance-"], #initial-capital').forEach(input => {
    input.addEventListener('input', calculateChange);
});

function calculateRisk() {
    let initialCapitalInput = document.getElementById('initial-capital');
    let initialCapital = parseFloat(initialCapitalInput.value) || 0;
    let previousBalances = [initialCapital]; // Array to store the balances of each row

    // Iterate over each row
    document.querySelectorAll('.data-row').forEach((row, index) => {
        let balanceInput = row.querySelector('input[name^="balance-' + (index + 1) + '"]');
        let currentBalance = balanceInput && balanceInput.value ? parseFloat(balanceInput.value) : 0;
        let sizeInput = row.querySelector('input[name^="size-' + (index + 1) + '"]');
        let entryInput = row.querySelector('input[name^="entry-' + (index + 1) + '"]');
        let stopInput = row.querySelector('input[name^="stop-' + (index + 1) + '"]');

        // Determine the balance to use for risk calculation
        let balanceForRisk = index === 0 ? initialCapital : previousBalances[index - 1];

        if (sizeInput && sizeInput.value && entryInput && entryInput.value && stopInput && stopInput.value) {
            let size = parseFloat(sizeInput.value);
            let entry = parseFloat(entryInput.value);
            let stop = parseFloat(stopInput.value);
            let risk = ((entry - stop) * size) / balanceForRisk;

            // Display the risk in the corresponding span
            let riskSpan = row.querySelector(`span[name="risk-${index + 1}"]`);
            if (riskSpan) {
                riskSpan.textContent = `${risk.toFixed(1)}%`;
            }
        }

        // Update the array of previous balances if there's a valid current balance
        previousBalances[index] = currentBalance > 0 ? currentBalance : balanceForRisk;
    });
}

// Attach event listeners to size, entry, stop inputs, initial capital input, and balance inputs
document.querySelectorAll('input[name^="size-"], input[name^="entry-"], input[name^="stop-"], #initial-capital, input[name^="balance-"]').forEach(input => {
    input.addEventListener('input', calculateRisk);
});
function calculateValues() {
    let initialCapitalInput = document.getElementById('initial-capital');
    let initialCapital = parseFloat(initialCapitalInput.value) || 0;
    let previousBalances = [initialCapital]; // Array to store the balances of each row

    // Iterate over each row
    document.querySelectorAll('.data-row').forEach((row, index) => {
        let entryInput = row.querySelector('input[name^="entry-' + (index + 1) + '"]');
        let exitInput = row.querySelector('input[name^="exit-' + (index + 1) + '"]');
        let stopInput = row.querySelector('input[name^="stop-' + (index + 1) + '"]');
        let rSpan = row.querySelector(`span[name="r-${index + 1}"]`);

        if (entryInput && entryInput.value && exitInput && exitInput.value && stopInput && stopInput.value) {
            let entry = parseFloat(entryInput.value);
            let exit = parseFloat(exitInput.value);
            let stop = parseFloat(stopInput.value);

            let risk = entry - stop;
            let reward = exit - entry;
            let rRatio = reward / risk;

            // Update the 'R' column
            if (rSpan) {
                if (rRatio < 0) {
                    // Losing trade
                    rSpan.textContent = 'loss';
                    rSpan.style.color = '#f58c755c';
                } else {
                    // Winning trade
                    rSpan.textContent = rRatio.toFixed(1);
                    rSpan.style.color = '#0a9e0a';
                }
            }
        } else if (rSpan) {
            // Clear the 'R' column if inputs are invalid or missing
            rSpan.textContent = '';
            rSpan.style.color = 'black'; // Reset color
        }

        // Update previous balances
        let balanceInput = row.querySelector('input[name^="balance-' + (index + 1) + '"]');
        let currentBalance = balanceInput && balanceInput.value ? parseFloat(balanceInput.value) : 0;
        previousBalances[index] = currentBalance > 0 ? currentBalance : (index === 0 ? initialCapital : previousBalances[index - 1]);
    });
}

// Attach event listeners to entry, exit, stop inputs, initial capital input, and balance inputs
document.querySelectorAll('input[name^="entry-"], input[name^="exit-"], input[name^="stop-"], #initial-capital, input[name^="balance-"]').forEach(input => {
    input.addEventListener('input', calculateValues);
});

function calculateDifference() {
    // Iterate over each row
    document.querySelectorAll('.data-row').forEach((row, index) => {
        let entryInput = row.querySelector('input[name^="entry-' + (index + 1) + '"]');
        let exitInput = row.querySelector('input[name^="exit-' + (index + 1) + '"]');
        let differenceSpan = row.querySelector(`span[name="diff-${index + 1}"]`);

        if (entryInput && entryInput.value && exitInput && exitInput.value) {
            let entry = parseFloat(entryInput.value);
            let exit = parseFloat(exitInput.value);
            let difference = exit - entry;

            // Display the difference in the corresponding span
            if (differenceSpan) {
                differenceSpan.textContent = difference; // Adjust the decimal places as needed
            }
        } else if (differenceSpan) {
            // Clear the "difference" column if inputs are invalid or missing
            differenceSpan.textContent = '';
        }
    });
}

// Attach event listeners to entry and exit inputs
document.querySelectorAll('#initial-capital, input[name^="entry-"], input[name^="exit-"]').forEach(input => {
    input.addEventListener('input', calculateDifference);
});


document.getElementById('clear-button').addEventListener('click', function () {
    if (confirm("All data will be lost?!")) {
        clearIndexedDB();
        resetAllSnipCells();
        lineSeries.setData([]);
        updateAllBackgroundColors();
    } else {
        console.log("Database clear canceled by user.");
    }
});

function resetAllSnipCells() {
    document.querySelectorAll('.image-paste-area').forEach(cell => {
        cell.removeAttribute('title'); // Remove the tooltip
        cell.style.backgroundColor = ''; // Reset the background color
        cell.innerHTML = ''; // Optional: Clear the content of the cell
    });
}


function clearIndexedDB() {
    let transaction = db.transaction(['rows'], 'readwrite');
    let store = transaction.objectStore('rows');
    let clearRequest = store.clear(); // This clears all data in the 'rows' object store

    clearRequest.onsuccess = function (event) {
        console.log("IndexedDB cleared successfully");
        resetAllCells();
    };

    clearRequest.onerror = function (event) {
        console.error("Error in clearing IndexedDB:", event.target.error);
    };
}
function resetAllCells() {
    // Reset all input fields and textareas
    document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(element => {
        element.value = '';
    });

    // Reset all datetime-local inputs to a default value if needed
    document.querySelectorAll('input[type="datetime-local"]').forEach(element => {
        element.value = ''; // Set to a default value if required
    });

    // Uncheck all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(element => {
        element.checked = false;
    });

    // Clear custom content areas (e.g., divs used for displaying images or text)
    document.querySelectorAll('.image-paste-area').forEach(element => {
        element.innerHTML = '';
    });

    // Clear content of span elements
    document.querySelectorAll('span').forEach(element => {
        element.textContent = ''; // Or element.innerHTML = ''; if they contain HTML
    });
}

function updateOrDeleteImageDataInIndexedDB(rowId) {
    let transaction = db.transaction(['rows'], 'readwrite');
    let store = transaction.objectStore('rows');

    // Get the current data for the row
    let request = store.get(rowId);

    request.onsuccess = function () {
        let data = request.result;

        if (data) {
            // Assuming the image data is stored under a key 'snip'
            data.snip = ''; // Erase the image data

            // Update the record in IndexedDB
            let updateRequest = store.put(data);

            updateRequest.onsuccess = function () {
                console.log("Image data cleared for row:", rowId);
            };

            updateRequest.onerror = function (e) {
                console.error("Error updating image data for row:", rowId, e.target.error);
            };
        } else {
            console.log("No data found for row:", rowId);
        }
    };

    request.onerror = function (e) {
        console.error("Error fetching data for row:", rowId, e.target.error);
    };
}


function addTooltipToCellsContainingImages() {
    let transaction = db.transaction(['rows'], 'readonly');
    let store = transaction.objectStore('rows');
    let request = store.openCursor();

    request.onsuccess = function (event) {
        let cursor = event.target.result;
        if (cursor) {
            let data = cursor.value;
            if (data.snip && data.snip.includes('<img')) {
                let cell = document.querySelector(`div[name="snip-${data.id}"]`);
                if (cell) {
                    cell.setAttribute('title', 'ctrl and click to erase image');
                    cell.style.backgroundColor = '#ADD8E61f'; // Example color, change as needed
                }
            }
            cursor.continue();
        }
    };

    request.onerror = function (event) {
        console.error("Error reading data from IndexedDB:", event.target.errorCode);
    };
}

function setBackgroundColorForImageCells() {
    let transaction = db.transaction(['rows'], 'readonly');
    let store = transaction.objectStore('rows');
    let request = store.openCursor();

    request.onsuccess = function (event) {
        let cursor = event.target.result;
        if (cursor) {
            let data = cursor.value;
            if (data.snip && data.snip.includes('<img')) {
                let cell = document.querySelector(`div[name="snip-${data.id}"]`);
                if (cell) {
                    cell.style.backgroundColor = '#ADD8E61f'; // Example color, change as needed
                }
            }
            cursor.continue();
        }
    };

    request.onerror = function (event) {
        console.error("Error reading data from IndexedDB:", event.target.errorCode);
    };
}

function saveDataToFile() {
    let transaction = db.transaction(['rows'], 'readonly');
    let store = transaction.objectStore('rows');
    let request = store.getAll();

    request.onsuccess = function (event) {
        let allData = event.target.result;

        // Include tooltip data in the file
        for (let i = 1; i <= 5; i++) {
            let tooltipValue = document.getElementById(`tooltip-${i}`).value;
            allData.push({ id: `tooltip-${i}`, value: tooltipValue });
        }

        const jsonData = JSON.stringify(event.target.result);
        const blob = new Blob([jsonData], { type: 'text/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.tj';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    request.onerror = function (event) {
        console.error("Error fetching data: ", event.target.errorCode);
    };
}

document.getElementById('file-input').addEventListener('change', function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const data = JSON.parse(e.target.result);
        saveDataToIndexedDB(data);
    };

    reader.readAsText(file);
});

function saveDataToIndexedDB(data) {
    const transaction = db.transaction(['rows'], 'readwrite');
    const store = transaction.objectStore('rows');

    data.forEach(rowData => {
        store.put(rowData);
    });

    transaction.oncomplete = function () {
        console.log("All data has been reloaded into the database");
        loadData(); // Refresh data in your application's UI
        // Load tooltip data from the saved file into the inputs
        for (let i = 1; i <= 5; i++) {
            const tooltipData = data.find(d => d.id === `tooltip-${i}`);
            if (tooltipData && tooltipData.value) {
                document.getElementById(`tooltip-${i}`).value = tooltipData.value;
            }
        }
    };

    transaction.onerror = function (event) {
        console.error("Error saving data to IndexedDB: ", event.target.error);
    };
}
document.addEventListener('DOMContentLoaded', function () {
    // Event listener for the save button
    document.getElementById('save-button').addEventListener('click', saveDataToFile);

    // Event listener for the open button
    document.getElementById('open-button').addEventListener('click', function () {
        if (confirm("All data will be lost?!")) {
            // Reset the value of the file input to ensure change event fires
            document.getElementById('file-input').value = '';
            document.getElementById('file-input').click(); // Trigger the file input
        }
    });

    // Unified event listener for file input change
    document.getElementById('file-input').addEventListener('change', function (event) {
        if (event.target.files.length === 0) {
            return; // No file selected
        }

        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            const data = JSON.parse(e.target.result);
            saveDataToIndexedDB(data);
        };
        reader.readAsText(file);
    });
});

// JavaScript to open the modal
document.getElementById('edit-button').addEventListener('click', function () {
    document.getElementById('editModal').style.display = 'block';
});

// JavaScript to close the modal on clicking 'X'
document.querySelector('.close').addEventListener('click', function () {
    document.getElementById('editModal').style.display = 'none';
});

// JavaScript to close the modal on clicking outside
window.onclick = function (event) {
    var modal = document.getElementById('editModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const tooltips = document.querySelectorAll('.tool-class');

    // Function to update the checklist titles
    function updateChecklistTitles() {
        const rows = document.querySelectorAll('#data-table .data-row');
        rows.forEach(row => {
            const checklistLabels = row.querySelectorAll('.checklist label');
            tooltips.forEach((tooltip, index) => {
                if (checklistLabels[index]) {
                    checklistLabels[index].title = tooltip.value;
                }
            });
        });
    }

    // Delay in milliseconds (e.g., 2000ms = 2 seconds)
    const delay = 2000;

    // Wait for the specified delay, then update titles
    setTimeout(updateChecklistTitles, delay);

    // Update titles on input change
    tooltips.forEach((tooltip) => {
        tooltip.addEventListener('input', updateChecklistTitles);
    });
});



const chartContainer = document.getElementById('chart-container');
const chart = LightweightCharts.createChart(chartContainer,
    {
        crosshair: {
            mode: 2,
        },
        width: chartContainer.clientWidth,
        height: chartContainer.clientHeight,
        layout: {
            background: { color: '#01091d1f' },
            textColor: '#DDD',
        },
        grid: {
            vertLines: { color: '#44444400' },
            horzLines: { color: '#44444400' },
        },
        timeScale: {
            visible: false,
        },
    }
);

// Create a line series
const lineSeries = chart.addAreaSeries({
    topColor: 'rgba(13, 87, 206, 0.3)',
    bottomColor: 'rgba(13, 87, 206, 0)',
    lineColor: 'rgb(21, 146, 209)',
    lineWidth: 1,
});

chart.timeScale().applyOptions({
    timeVisible: true,
});

// ResizeObserver to handle container size changes
const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
        if (entry.target === chartContainer) {
            chart.applyOptions({
                width: chartContainer.clientWidth,
                height: chartContainer.clientHeight,
            });
            chart.timeScale().fitContent();
        }
    }
});

resizeObserver.observe(chartContainer);

const myPriceFormatter = p => {
    if (p >= 1000) {
        return (p / 1000).toFixed(0) + 'k';
    }
    return p.toFixed(0);
};

chart.applyOptions({
    localization: {
        priceFormatter: myPriceFormatter,
    },
});

lineSeries.applyOptions({
    lastValueVisible: false,
    priceLineVisible: false,
});

lineSeries.priceScale().applyOptions({
    borderVisible: false,
    visible: false,
    scaleMargins: {
        top: 0.02,
        bottom: 0.0,
    },
});


// Function to update chart data
function updateChartData() {
    const dates = [];
    const balanceValues = [];
    const rows = document.querySelectorAll('.data-row');

    rows.forEach(row => {
        const dateInput = row.querySelector('td:nth-child(2) input[type="datetime-local"]');
        const balanceInput = row.querySelector('td:nth-child(12) input[type="number"]');

        if (dateInput && balanceInput) {
            const dateValue = new Date(dateInput.value).getTime(); // Convert to Unix timestamp
            const balanceValue = parseFloat(balanceInput.value);
            if (!isNaN(dateValue) && !isNaN(balanceValue)) {
                dates.push(dateValue / 1000); // Push Unix timestamp in seconds
                balanceValues.push(balanceValue);
            }
        }
    });

    // Prepare and set the data
    const chartData = balanceValues.map((value, index) => ({ time: dates[index], value }));
    lineSeries.setData(chartData);
    chart.timeScale().fitContent();
}

// Event listener for initial capital saved
document.addEventListener('initialCapitalSaved', updateChartData);

// Event listener for DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Initial update of chart data
    updateChartData();
    
    // Attach event listeners to each balance input field for changes
    document.querySelectorAll('.data-row td:nth-child(12) input[type="number"]').forEach(input => {
        input.addEventListener('input', updateChartData);
    });
});

function updateBackgroundColor(row) {
    const entryInput = row.querySelector('[name^="entry"]');
    const stopInput = row.querySelector('[name^="stop"]');
    const tickerCell = row.querySelector('[name^="ticker"]');

    const entryValue = entryInput.value.trim();
    const stopValue = stopInput.value.trim();

    if (entryValue !== '' && stopValue !== '') {
        const entry = parseFloat(entryValue);
        const stop = parseFloat(stopValue);

        if (!isNaN(entry) && !isNaN(stop)) {
            tickerCell.style.backgroundColor = stop > entry ? '#69020221' : '#0057001a';
        }
    } else {
        // Reset the background color when inputs are empty
        tickerCell.style.backgroundColor = ''; // Reset to default or specify a default color
    }
}


function addEventListenersToRow(row) {
    const entryInput = row.querySelector('[name^="entry"]');
    const stopInput = row.querySelector('[name^="stop"]');

    const handleInput = () => updateBackgroundColor(row);

    entryInput.addEventListener('input', handleInput);
    stopInput.addEventListener('input', handleInput);
}

function updateAllBackgroundColors() {
    const rows = document.querySelectorAll('.data-row');
    rows.forEach(row => {
        updateBackgroundColor(row);
        addEventListenersToRow(row);
    });
}

// Event listener for initial
document.addEventListener('initialCapitalSaved', updateAllBackgroundColors);