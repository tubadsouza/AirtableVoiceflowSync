import os
import logging
from flask import Flask, render_template, request, jsonify
import requests
from urllib.parse import urljoin

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "default_secret_key")

VOICEFLOW_API_URL = 'https://api.voiceflow.com/v1/knowledge-base/docs/upload/table'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/fetch-headers', methods=['POST'])
def fetch_headers():
    airtable_api_key = request.json.get('airtableApiKey')
    base_id = request.json.get('baseId')
    table_id = request.json.get('tableId')

    if not all([airtable_api_key, base_id, table_id]):
        return jsonify({'error': 'Missing required parameters'}), 400

    headers = {
        'Authorization': f'Bearer {airtable_api_key}',
        'Content-Type': 'application/json',
    }

    try:
        url = f'https://api.airtable.com/v0/{base_id}/{table_id}'
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        records = response.json().get('records', [])
        if not records:
            return jsonify({'error': 'No records found'}), 404

        # Extract field names from the first record
        fields = list(records[0].get('fields', {}).keys())
        return jsonify({'fields': fields})

    except requests.exceptions.RequestException as e:
        logging.error(f"Airtable API error: {str(e)}")
        return jsonify({'error': 'Failed to fetch data from Airtable'}), 500

@app.route('/transform-data', methods=['POST'])
def transform_data():
    data = request.json
    airtable_api_key = data.get('airtableApiKey')
    base_id = data.get('baseId')
    table_id = data.get('tableId')
    searchable_fields = data.get('searchableFields', [])
    metadata_fields = data.get('metadataFields', [])

    headers = {
        'Authorization': f'Bearer {airtable_api_key}',
        'Content-Type': 'application/json',
    }

    try:
        url = f'https://api.airtable.com/v0/{base_id}/{table_id}'
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        records = response.json().get('records', [])
        
        transformed_items = []
        for record in records:
            fields = record.get('fields', {})
            item = {}
            for field in searchable_fields + metadata_fields:
                item[field] = fields.get(field, '')
            transformed_items.append(item)

        result = {
            "data": {
                "schema": {
                    "searchableFields": searchable_fields,
                    "metadataFields": metadata_fields
                },
                "name": table_id,
                "items": transformed_items
            }
        }

        return jsonify(result)

    except requests.exceptions.RequestException as e:
        logging.error(f"Airtable API error: {str(e)}")
        return jsonify({'error': 'Failed to fetch data from Airtable'}), 500

@app.route('/upload-to-voiceflow', methods=['POST'])
def upload_to_voiceflow():
    data = request.json
    voiceflow_api_key = data.get('voiceflowApiKey')
    transformed_data = data.get('data')

    if not voiceflow_api_key or not transformed_data:
        return jsonify({'error': 'Missing required parameters'}), 400

    headers = {
        'Authorization': voiceflow_api_key,
        'Content-Type': 'application/json',
        'accept': 'application/json'
    }

    try:
        response = requests.post(
            f'{VOICEFLOW_API_URL}?overwrite=true',
            headers=headers,
            json=transformed_data
        )
        response.raise_for_status()
        return jsonify({'message': 'Successfully uploaded to Voiceflow'})

    except requests.exceptions.RequestException as e:
        logging.error(f"Voiceflow API error: {str(e)}")
        return jsonify({'error': 'Failed to upload to Voiceflow'}), 500
