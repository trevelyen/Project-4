document.addEventListener('DOMContentLoaded', () => {
    ////////////////////////////////////////////////////////////////////////////////////////////////AUTOSAVE
    // Declarations for functions
    let autosaveTimeout;
    let calculationTimeout;

    // Function to change the Save button's border color
    const saveButton = document.getElementById('saveButton');
    function changeSaveButtonBorderColor(color) {
        saveButton.style.borderColor = color;
    }
    // Autosave function
    function autosave() {
        const data = collectData();
        localStorage.setItem('autosaveData', JSON.stringify(data));

        // Show autosave popup
        const autosavePopup = document.getElementById('autosavePopup');
        autosavePopup.style.display = 'block';
        autosavePopup.style.opacity = 1;

        // Hide popup after a delay
        setTimeout(() => {
            autosavePopup.style.opacity = 0;
            setTimeout(() => autosavePopup.style.display = 'none', 500); // Wait for fade-out to complete
        }, 1000); // Duration to show the popup

        console.log('Data autosaved to localStorage');
        changeSaveButtonBorderColor('#8b0909');

    }

    // Debounce function to delay execution
    function debounceAutosave() {
        clearTimeout(autosaveTimeout);
        autosaveTimeout = setTimeout(autosave, 3000); // Trigger autosave after 2 seconds of inactivity
    }

    // Debounce function for calculations
    function debounceCalculations() {
        clearTimeout(calculationTimeout);
        calculationTimeout = setTimeout(() => {
            updateChanges();
            updateRisk();
            updateRRatio();
            updatePips();
        }, 1000); // Trigger calculations after 2 seconds of inactivity
    }

    // Function for immediate calculation updates and debounced autosave
    function onInputChange() {
        // Call all calculation functions
        updateChanges();
        updateRisk();
        updateRRatio();
        updatePips();
        debounceAutosave(); // Keep the debounced autosave
    }

    // Attach the onInputChange function to all relevant input fields including date inputs
    document.querySelectorAll('input[type="text"], input[type="number"], input[type="datetime-local"], textarea').forEach(input => {
        input.addEventListener('input', onInputChange);
    });

    // Event listeners
    document.getElementById('initialCapital').addEventListener('input', onInputChange);
    document.querySelectorAll('.balance-input').forEach((element) => {
        element.addEventListener('input', onInputChange);
    });
    document.querySelectorAll('.checklist-item').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            debounceAutosave(); // Call the debounced autosave function
        });
    });

    ////////////////////////////////////////////////////////////////////////////////////////////////COLLECT/POPULATE DATA
    // Load autosaved data
    const savedData = localStorage.getItem('autosaveData');
    if (savedData) {
        populateForm(JSON.parse(savedData));
    }

    // Function to collect data
    function collectData() {
        const data = {};

        // For text inputs, number inputs, etc.
        document.querySelectorAll('.entry-container input[type="text"], .entry-container input[type="number"], .entry-container textarea').forEach(input => {
            data[input.name] = input.value;
        });

        // Collect tooltip texts for checklist items
        for (let i = 1; i <= 5; i++) {
            const input = document.getElementById(`clInput${i}`);
            if (input) {
                data[`tooltip${i}`] = input.value;
            }
        }

        // Collecting data from checklist inputs
        for (let i = 1; i <= 5; i++) {
            const checklistInput = document.getElementById(`clInput${i}`);
            if (checklistInput) {
                data[`checklstcl${i}`] = checklistInput.value;
            }
        }


        // For datetime-local inputs
        document.querySelectorAll('.entry-container input[type="datetime-local"]').forEach(input => {
            data[input.name] = input.value;
        });

        // Collect state for all checkboxes
        document.querySelectorAll('.entry-container .checklist-item').forEach(checkbox => {
            data[checkbox.name] = { checked: checkbox.checked, clickState: checkbox.dataset.clickState };
        });

        // Collect state for all checkboxes
        document.querySelectorAll('.checklist-item').forEach(checkbox => {
            data[checkbox.name] = checkbox.checked;
        });

        return data;
    }

    // Function to retrieve data
    function populateForm(data) {
        for (const key in data) {
            const element = document.querySelector(`[name="${key}"]`);
            if (!element) continue;

            if (element.type === 'checkbox') {
                // Set the checked state for checkboxes
                element.checked = data[key];
                // Update the corresponding checkmark class
                element.nextElementSibling.classList.toggle('checked', data[key]);
            } else {
                // Set the value for other types of elements
                element.value = data[key];
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////CALCULATIONS
    // Declarations for functions
    let initialCapital = parseFloat(document.getElementById('initialCapital').value);
    let previousBalance = initialCapital;

    // Function to calculate and update change $/%
    function updateChanges() {
        document.querySelectorAll('.balance-input').forEach((element, index) => {
            let currentBalance = parseFloat(element.value);
            let changeDollar = index === 0 ? currentBalance - initialCapital : currentBalance - previousBalance;
            let changePercent = index === 0 ? (changeDollar / initialCapital) * 100 : (changeDollar / previousBalance) * 100;

            let changeDollarField = document.getElementById(`changeDollar${index + 1}`);
            let changePercentField = document.getElementById(`changePercent${index + 1}`);

            if (isNaN(changeDollar) || isNaN(changePercent)) {
                changeDollarField.style.display = 'none';
                changePercentField.style.display = 'none';
            } else {
                changeDollarField.style.display = '';
                changePercentField.style.display = '';
                changeDollarField.innerText = changeDollar.toFixed(2);
                changePercentField.innerText = changePercent.toFixed(2) + '%';
            }

            // Update previousBalance for the next row
            if (!isNaN(currentBalance)) {
                previousBalance = currentBalance;
            }
        });
    }

    // Function to calculate and update risk percentage
    function updateRisk() {
        let initialCapital = parseFloat(document.getElementById('initialCapital').value);
        let previousBalance = initialCapital;

        document.querySelectorAll('tr').forEach((row, index) => {
            // Skip the header row
            if (index === 0) return;

            let size = parseFloat(row.querySelector(`[name="size${index}"]`).value);
            let entry = parseFloat(row.querySelector(`[name="entry${index}"]`).value);
            let stop = parseFloat(row.querySelector(`[name="stop${index}"]`).value);

            // Calculate risk percentage
            let riskPercent = 0;
            if (!isNaN(size) && !isNaN(entry) && !isNaN(stop) && entry !== stop) {
                let priceMovementPerDollar = Math.abs(entry - stop) / entry;
                let totalDollarRisk = size * priceMovementPerDollar;
                let balanceForCalculation = index === 1 ? initialCapital : previousBalance;
                riskPercent = (totalDollarRisk / balanceForCalculation) * 100;
            }

            // Update risk percentage field
            // Get the risk percentage field
            let riskPercentField = document.getElementById(`riskPercent${index}`);

            // Hide the field if riskPercent is 0 or NaN, otherwise display and update it
            if (riskPercent === 0 || isNaN(riskPercent)) {
                riskPercentField.style.display = 'none';
            } else {
                riskPercentField.style.display = '';
                riskPercentField.innerText = riskPercent.toFixed(2) + '%';
            }

            // Update previousBalance for the next row
            let balanceField = row.querySelector(`[name="balance${index}"]`);
            if (balanceField) {
                let currentBalance = parseFloat(balanceField.value);
                if (!isNaN(currentBalance)) {
                    previousBalance = currentBalance;
                }
            }
        });
    }

    // Function to calculate and update pips
    function updatePips() {
        document.querySelectorAll('tr').forEach((row, index) => {
            // Skip the header row
            if (index === 0) return;

            let entry = parseFloat(row.querySelector(`[name="entry${index}"]`).value);
            let exit = parseFloat(row.querySelector(`[name="exit${index}"]`).value);

            let pips;
            // Assuming a long trade if exit >= entry, and short trade otherwise
            if (exit >= entry) {
                // Long trade
                pips = exit - entry;
            } else {
                // Short trade
                pips = entry - exit;
            }

            // Update pips field
            let pipsField = document.getElementById(`pipsDollar${index}`);
            if (isNaN(pips)) {
                pipsField.style.display = 'none';
            } else {
                pipsField.style.display = '';
                pipsField.innerText = pips.toFixed(0); // Displaying pips with two decimal places
            }
        });
    }

    // Function to calculate and update R
    function updateRRatio() {
        document.querySelectorAll('tr').forEach((row, index) => {
            if (index === 0) return; // Skip the header row

            let entry = parseFloat(row.querySelector(`[name="entry${index}"]`).value);
            let stop = parseFloat(row.querySelector(`[name="stop${index}"]`).value);
            let exit = parseFloat(row.querySelector(`[name="exit${index}"]`).value);

            let rRatioField = document.getElementById(`r${index}`);

            // Check if entry, stop, and exit have valid values
            if (!isNaN(entry) && !isNaN(stop) && !isNaN(exit)) {
                let potentialRisk = Math.abs(entry - stop);
                let potentialReward = Math.abs(exit - entry);
                let rRatio = potentialReward / potentialRisk;

                // Determine if the trade is a loss
                let isLongPosition = entry > stop;
                let isLoss = (isLongPosition && exit <= entry) || (!isLongPosition && exit >= entry);

                if (!isLoss && !isNaN(rRatio) && rRatio !== Infinity) {
                    rRatioField.innerText = rRatio.toFixed(2);
                    rRatioField.style.color = 'green';
                } else {
                    rRatioField.innerText = 'loss';
                    rRatioField.style.color = '#8f0000';
                }
            } else {
                // Clear the field if values are incomplete or invalid
                rRatioField.innerText = '';
                rRatioField.style.color = '';
            }
        });
    }

    // Event listener attachment
    document.querySelectorAll('tr').forEach((row, index) => {
        if (index === 0) return; // Skip header row

        ['input', 'stop', 'exit', 'entry'].forEach(type => {
            row.querySelectorAll(`[name^="${type}${index}"]`).forEach(element => {
                element.addEventListener('input', () => {
                    debounceCalculations();
                    debounceAutosave();
                });
            });
        });
    });

    // Event listener attachment
    document.getElementById('initialCapital').addEventListener('input', () => {
        debounceCalculations();
        debounceAutosave();
    });

    // Event listener attachment
    document.querySelectorAll('.balance-input').forEach((element) => {
        element.addEventListener('input', () => {
            debounceCalculations();
            debounceAutosave();
        });
    });

    // Initial calculations and autosave
    updateChanges();
    updateRisk();
    updateRRatio();
    updatePips();
    


    ////////////////////////////////////////////////////////////////////////////////////////////////FUNCTIONALITY
    // Open Button Functionality
    document.getElementById('openButton').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    document.getElementById('fileInput').addEventListener('change', function (event) {
        const fileReader = new FileReader();
        fileReader.onload = function (event) {
            try {
                const data = JSON.parse(event.target.result);
                populateForm(data); // Populate the form with the loaded data

                // Call your calculation functions here
                updateChanges();
                updateRisk();
                updateRRatio();
                updatePips();

            } catch (e) {
                console.error("Error reading the JSON file", e);
            }
        };
        fileReader.readAsText(event.target.files[0]);
    });

    // Clear Button Functionality
    document.getElementById('clearButton').addEventListener('click', () => {
        if (confirm("Are you sure you want to clear all data?")) {
            // Clear text inputs, textareas, and datetime inputs
            document.querySelectorAll('.entry-container input[type="text"], .entry-container input[type="number"], .entry-container input[type="datetime-local"], .entry-container textarea').forEach(input => {
                input.value = '';
            });

            // Clear checkboxes and reset the visual state of checkmark spans
            document.querySelectorAll('.entry-container .checklist-item').forEach(checkbox => {
                checkbox.checked = false;
                const checkmarkSpan = checkbox.nextElementSibling;
                if (checkmarkSpan && checkmarkSpan.classList.contains('checkmark')) {
                    checkmarkSpan.classList.remove('checked'); // Remove the 'checked' class
                }
            });

            // Clear specific calculated fields
            document.querySelectorAll('.change-dollar, .change-percent, .risk-percent, .pips-dollar, .risk-reward').forEach(field => {
                field.innerText = '';
            });

            // Clear the clInputs
            for (let i = 1; i <= 5; i++) {
                const clInput = document.getElementById(`clInput${i}`);
                if (clInput) {
                    clInput.value = '';
                }
            }

            // Reset save button's border color
            const saveButton = document.getElementById('saveButton');
            if (saveButton) {
                saveButton.style.borderColor = '#030101'; // Replace '#030101' with the original border color
            }

            // Also clear any stored data if needed
            localStorage.removeItem('autosaveData');

            // Optionally, update any dynamic elements that depend on these values
            updateCheckmarkTooltips();
        }
    });


    // Save Button Functionality
    document.getElementById('saveButton').addEventListener('click', () => {
        // Collect and save data as JSON file
        const data = collectData(); // Assuming 'collectData' is your function to collect data from the form
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "trade_data.json");
        document.body.appendChild(downloadAnchorNode); // Required for Firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        // Revert Save button border color back to original (or any desired color)
        changeSaveButtonBorderColor('#030101'); // or replace 'initial' with any specific color
    });

    // Attach event listeners to each checkbox
    document.querySelectorAll('.checklist-item').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            // Toggle the 'checked' class on the corresponding 'span' element
            this.nextElementSibling.classList.toggle('checked', this.checked);
        });
    });

    // Datetime tab out function/listner
    document.querySelectorAll('input[type="datetime-local"]').forEach(input => {
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Tab' && !input.value) {
                input.value = getCurrentDateTime();
                debounceAutosave();
            }
        });
    });

    // Modal logic
    // Get the modal
    var modal = document.getElementById("editCLModal");

    // Get the button that opens the modal
    var btn = document.getElementById("editCLButton");

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    // When the user clicks the button, open the modal 
    btn.onclick = function () {
        modal.style.display = "block";
    }

    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Function to update checklist tooltips
    function updateChecklistTooltips() {
        var rows = document.querySelectorAll('table tr');
        rows.forEach(function (row, rowIndex) {
            if (rowIndex === 0) return; // Skip the header row

            for (let i = 1; i <= 5; i++) {
                let tooltipText = document.getElementById(`clInput${i}`).value;
                let checkmarkSpan = row.querySelector(`label input[name='checklist${rowIndex}_${i}'] + .checkmark`);
                if (checkmarkSpan) {
                    checkmarkSpan.title = tooltipText;
                }
            }
        });
    }

    // Call this function to initially set the tooltips
    updateChecklistTooltips();

    // Update tooltips whenever any clInput value changes
    for (let i = 1; i <= 5; i++) {
        const clInputElem = document.getElementById(`clInput${i}`);
        if (clInputElem) {
            clInputElem.addEventListener('input', updateChecklistTooltips);
        }
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

});

////////////////////////////////////////////////////////////////////////////////////////////////GLOBAL FUNCTIONS
function getCurrentDateTime() {
    const now = new Date();
    return now.toISOString().substring(0, 16);
}