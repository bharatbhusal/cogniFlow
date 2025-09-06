# CogniFlow Frontend

## Overview

CogniFlow is an AI-powered web application designed to provide intelligent workflow automation and data analysis. The frontend is built using modern JavaScript frameworks and communicates with the FastAPI backend.

## Features

- User authentication and authorization
- Interactive dashboard for workflow management
- Data visualization and reporting
- Integration with AI/ML services
- Responsive design

## Tech Stack

- React.js (or similar)
- JavaScript/TypeScript
- CSS/SCSS
- REST API (FastAPI backend)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file based on `.env.example` and set your environment variables.
3. Start the development server:
   ```bash
   npm start
   ```

## Usage

- Access the dashboard at `http://localhost:3000` (default)
- Connect to backend API via environment variable `REACT_APP_API_URL`

## Folder Structure

- `src/components/` - Reusable UI components
- `src/pages/` - Application pages
- `src/assets/` - Static assets
- `src/utils/` - Utility functions

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

See LICENSE file for details.
