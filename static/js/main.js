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
    const previewPane = document.createElement('div');
    previewPane.id = 'previewPane';
    results.parentNode.insertBefore(previewPane, results);

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
            voiceflowApiKey: document.getElementById('voiceflowApiKey').value,
            airtableApiKey: document.getElementById('airtableApiKey').value,
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

            fieldsContainer.innerHTML = data.fields.map(field => `
                <div class="mb-2 d-flex align-items-center">
                    <span class="field-name flex-shrink-0 me-3">${field}</span>
                    <div class="btn-group" role="group" aria-label="Field type for ${field}">
                        <input type="radio" class="btn-check" name="${field}" id="${field}-searchable" value="searchable">
                        <label class="btn btn-outline-primary" for="${field}-searchable">Searchable</label>
                        
                        <input type="radio" class="btn-check" name="${field}" id="${field}-metadata" value="metadata">
                        <label class="btn btn-outline-primary" for="${field}-metadata">Metadata</label>
                        
                        <input type="radio" class="btn-check" name="${field}" id="${field}-none" value="none" checked>
                        <label class="btn btn-outline-primary" for="${field}-none">None</label>
                    </div>
                </div>
            `).join('');

            const checkboxes = fieldsContainer.querySelectorAll('input[type="checkbox"]');
            function updatePreview() {
                const searchableFields = [];
                const metadataFields = [];
                
                const fields = fieldsContainer.querySelectorAll('input[type="checkbox"]');
                fields.forEach(field => {
                    const fieldName = field.name;
                    if (field.id.endsWith('-searchable') && field.checked) {
                        searchableFields.push(fieldName);
                    }
                    if (field.id.endsWith('-metadata') && field.checked) {
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

            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', updatePreview);
            });
            
            // Show the field selection section and enable the transform button
            fieldSelection.classList.remove('d-none');
            transformButton.disabled = false;
            updatePreview();
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
        
        const fields = fieldsContainer.querySelectorAll('input[type="checkbox"]');
        fields.forEach(field => {
            const fieldName = field.name;
            if (field.id.endsWith('-searchable') && field.checked) {
                searchableFields.push(fieldName);
            }
            if (field.id.endsWith('-metadata') && field.checked) {
                metadataFields.push(fieldName);
            }
        });

        const requestData = {
            voiceflowApiKey: document.getElementById('voiceflowApiKey').value,
            airtableApiKey: document.getElementById('airtableApiKey').value,
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

            // Display the transformed data
            jsonOutput.textContent = JSON.stringify(data, null, 2);
            results.classList.remove('d-none');
            
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoading();
        }
    });

    // Handle upload to Voiceflow
    const uploadToVoiceflowButton = document.getElementById('uploadToVoiceflowButton');
    uploadToVoiceflowButton.addEventListener('click', async function() {
        hideError();
        showLoading();

        try {
            const transformedData = JSON.parse(jsonOutput.textContent);
            const voiceflowApiKey = document.getElementById('voiceflowApiKey').value;

            const voiceflowResponse = await fetch('/upload-to-voiceflow', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    voiceflowApiKey: voiceflowApiKey,
                    data: transformedData
                })
            });

            if (!voiceflowResponse.ok) {
                const voiceflowError = await voiceflowResponse.json();
                throw new Error(voiceflowError.error || 'Failed to upload to Voiceflow');
            }

            // Show success message
            const successAlert = document.createElement('div');
            successAlert.className = 'alert alert-success mt-3';
            successAlert.textContent = 'Successfully uploaded to Voiceflow!';
            results.appendChild(successAlert);

            // Remove success message after 3 seconds
            setTimeout(() => {
                successAlert.remove();
            }, 3000);

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
});
