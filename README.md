
# Airtable to Voiceflow Data Transformer

A web application that transforms Airtable data into a format compatible with Voiceflow's knowledge base system.

## Features

- Transform Airtable data into Voiceflow-compatible format
- Select specific fields for searchable content and metadata
- Easy-to-use web interface
- Real-time data preview
- One-click copy functionality
- Direct upload to Voiceflow

## Prerequisites

- Airtable API Key
- Voiceflow API Key
- Airtable Base ID
- Airtable Table ID

## Setup

1. Clone this project on Replit
2. The project will automatically install required dependencies
3. Click the Run button to start the Flask server

## How to Use

1. Enter your API credentials:
   - Voiceflow API Key
   - Airtable API Token
   - Base ID
   - Table ID

2. Click "Fetch Fields" to retrieve available fields from your Airtable

3. Select which fields should be:
   - Searchable content
   - Metadata

4. Transform the data using the "Transform Data" button

5. Either:
   - Copy the transformed JSON using the "Copy" button
   - Upload directly to Voiceflow using the "Upload to Voiceflow" button

## Tech Stack

- Python Flask
- Bootstrap 5
- JavaScript
- Airtable API
- Voiceflow API

## API Endpoints

- `GET /`: Main application interface
- `POST /fetch-headers`: Retrieves field headers from Airtable
- `POST /transform-data`: Transforms Airtable data to Voiceflow format
- `POST /upload-to-voiceflow`: Uploads transformed data to Voiceflow

## Error Handling

The application includes comprehensive error handling for:
- Invalid API credentials
- Network failures
- Empty data sets
- API rate limits

## Development

This project is hosted on Replit, making it easy to fork and modify. The development server runs in debug mode for easier troubleshooting.
