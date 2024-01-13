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
                    let event = new Event('change');
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
}


// Attach event listener to the initial capital input
document.getElementById('initial-capital').addEventListener('change', saveInitialCapital);






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
        const newEntryWidth = e.clientX - mainContainer.offsetLeft;
        entryContainer.style.width = `${newEntryWidth}px`;
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
                    area.style.backgroundColor = '#ADD8E6'; // Example color, change as needed
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

// Close the modal if the user clicks anywhere outside of the modal image
window.onclick = function (event) {
    const modal = document.getElementById('imageModal');
    if (event.target === modal) {
        modal.style.display = "none";
    }
}

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
    input.addEventListener('change', calculateChange);
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
    input.addEventListener('change', calculateRisk);
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
                    rSpan.style.color = 'red';
                } else {
                    // Winning trade
                    rSpan.textContent = rRatio.toFixed(1);
                    rSpan.style.color = 'green';
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
    input.addEventListener('change', calculateValues);
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
    input.addEventListener('change', calculateDifference);
});


document.getElementById('clear-button').addEventListener('click', function () {
    if (confirm("Are you sure? All data will be lost!")) {
        clearIndexedDB();
    } else {
        console.log("Database clear canceled by user.");
    }
});

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
                    cell.setAttribute('title', 'Hold Ctrl and click to erase image');
                    cell.style.backgroundColor = '#ADD8E6'; // Example color, change as needed
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

    request.onsuccess = function(event) {
        let cursor = event.target.result;
        if (cursor) {
            let data = cursor.value;
            if (data.snip && data.snip.includes('<img')) {
                let cell = document.querySelector(`div[name="snip-${data.id}"]`);
                if (cell) {
                    cell.style.backgroundColor = '#ADD8E6'; // Example color, change as needed
                }
            }
            cursor.continue();
        }
    };

    request.onerror = function(event) {
        console.error("Error reading data from IndexedDB:", event.target.errorCode);
    };
}