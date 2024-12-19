document.addEventListener('DOMContentLoaded', function() {
    const credentialsForm = document.getElementById('credentialsForm');
    const fieldSelection = document.getElementById('fieldSelection');
    const fieldsContainer = document.getElementById('fieldsContainer');
    const transformButton = document.getElementById('transformButton');
    const results = document.getElementById('results');
    const jsonOutput = document.getElementById('jsonOutput');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorAlert = document.getElementById('errorAlert');
    const copyButton = document.getElementById('copyButton');
    const previewPane = document.createElement('div'); // Added preview pane
    previewPane.id = 'previewPane';
    results.parentNode.insertBefore(previewPane, results); //Added preview pane before results



    function showLoading() {
        loadingSpinner.classList.remove('d-none');
    }

    function hideLoading() {
        loadingSpinner.classList.add('d-none');
    }

    function showError(message) {
        errorAlert.textContent = message;
        errorAlert.classList.remove('d-none');
    }

    function hideError() {
        errorAlert.classList.add('d-none');
    }

    credentialsForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideError();
        showLoading();

        const credentials = {
            apiKey: document.getElementById('apiKey').value,
            baseId: document.getElementById('baseId').value,
            tableId: document.getElementById('tableId').value
        };

        try {
            const response = await fetch('/fetch-headers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch fields');
            }

            // Create field selection checkboxes
            fieldsContainer.innerHTML = data.fields.map(field => `
                <div class="mb-2">
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="${field}" 
                               id="${field}_searchable" value="searchable">
                        <label class="form-check-label" for="${field}_searchable">Searchable</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="${field}" 
                               id="${field}_metadata" value="metadata">
                        <label class="form-check-label" for="${field}_metadata">Metadata</label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="${field}" 
                               id="${field}_none" value="none" checked>
                        <label class="form-check-label" for="${field}_none">None</label>
                    </div>
                    <span class="ms-2">${field}</span>
                </div>
            `).join('');

            
            // Add event listeners for real-time preview
            const radioButtons = fieldsContainer.querySelectorAll('input[type="radio"]');
    function updatePreview() {
        const searchableFields = [];
        const metadataFields = [];
        
        const fields = fieldsContainer.querySelectorAll('input[type="radio"]:checked');
        fields.forEach(field => {
            const fieldName = field.name;
            const fieldType = field.value;
            
            if (fieldType === 'searchable') {
                searchableFields.push(fieldName);
            } else if (fieldType === 'metadata') {
                metadataFields.push(fieldName);
            }
        });

        const previewData = {
            data: {
                schema: {
                    searchableFields,
                    metadataFields
                },
                name: document.getElementById('tableId').value,
                items: [
                    generateSampleItem(searchableFields, metadataFields),
                ]
            }
        };

        const previewOutput = document.getElementById('previewOutput');
        previewOutput.textContent = JSON.stringify(previewData, null, 2);
    }

    function generateSampleItem(searchableFields, metadataFields) {
        const sampleItem = {};
        [...searchableFields, ...metadataFields].forEach(field => {
            sampleItem[field] = "Sample Value";
        });
        return sampleItem;
    }

            radioButtons.forEach(radio => {
                radio.addEventListener('change', updatePreview);
            });
            
            fieldSelection.classList.remove('d-none');
            updatePreview(); // Initial preview
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoading();
        }
    });

    transformButton.addEventListener('click', async function() {
        hideError();
        showLoading();

        const searchableFields = [];
        const metadataFields = [];
        
        const fields = fieldsContainer.querySelectorAll('input[type="radio"]:checked');
        fields.forEach(field => {
            const fieldName = field.name;
            const fieldType = field.value;
            
            if (fieldType === 'searchable') {
                searchableFields.push(fieldName);
            } else if (fieldType === 'metadata') {
                metadataFields.push(fieldName);
            }
        });

        const requestData = {
            apiKey: document.getElementById('apiKey').value,
            baseId: document.getElementById('baseId').value,
            tableId: document.getElementById('tableId').value,
            searchableFields,
            metadataFields
        };

        try {
            const response = await fetch('/transform-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to transform data');
            }

            jsonOutput.textContent = JSON.stringify(data, null, 2);
            results.classList.remove('d-none');
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoading();
        }
    });

    copyButton.addEventListener('click', function() {
        navigator.clipboard.writeText(jsonOutput.textContent)
            .then(() => {
                const originalText = copyButton.innerHTML;
                copyButton.innerHTML = '<i class="bi bi-check"></i> Copied!';
                setTimeout(() => {
                    copyButton.innerHTML = originalText;
                }, 2000);
            })
            .catch(() => {
                showError('Failed to copy to clipboard');
            });
    });

    function updatePreview() {
        // Implement preview update logic here.  This is a placeholder.
        //  You'll need to fetch data based on the selected radio buttons
        // and update the content of the previewPane.  For example:
        const previewData = {}; // Construct preview data
        previewPane.textContent = JSON.stringify(previewData, null, 2);

    }
});