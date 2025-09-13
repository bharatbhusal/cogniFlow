# CogniFlow Frontend

CogniFlow Frontend is a modern React application built with TypeScript that provides an intuitive user interface for AI-driven workflow automation and document processing. It features a responsive design, real-time chat interface, and comprehensive project management capabilities.

## 🏗️ Architecture Overview

The frontend follows a component-based architecture with the following structure:

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (Button, Card, Input, etc.)
│   ├── modals/          # Modal dialogs
│   ├── project/         # Project-specific components
│   ├── reactflow/       # Workflow visualization components
│   └── providers/       # Context providers
├── pages/               # Page components and routing
├── hooks/               # Custom React hooks
├── store/               # Redux state management
│   ├── slices/          # Redux slices
│   └── selectors/       # State selectors
├── services/            # API communication layer
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── lib/                 # Third-party library configurations
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running (see backend documentation)

### Environment Setup

1. Clone the repository:

```bash
https://github.com/bharatbhusal/cogniFlow
cd cogniFlow/frontend
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

## 📱 Application Structure

### Pages (`/src/pages/`)

#### Authentication Pages

- **`LoginPage.tsx`**: User authentication and login
- **`RegisterPage.tsx`**: New user registration

#### Main Application Pages

- **`ProjectsPage.tsx`**: Project dashboard and management
- **`ProjectPage.tsx`**: Individual project details and settings
- **`ChatPage.tsx`**: AI chat interface for project queries

### Core Components (`/src/components/`)

#### UI Components (`/src/components/ui/`)

- **`Button.tsx`**: Reusable button component with variants
- **`Card.tsx`**: Card layout components
- **`Input.tsx`**: Form input components
- **`Modal.tsx`**: Modal dialog base component
- **`Header.tsx`**: Application header and navigation

#### Project Components (`/src/components/project/`)

- **`EditProjectView.tsx`**: Project editing and configuration
- **`ViewProjectView.tsx`**: Project viewing and information display

#### Modals (`/src/components/modals/`)

- **`CreateProjectModal.tsx`**: New project creation dialog

#### Workflow Components (`/src/components/reactflow/`)

- **`FlowEditor.tsx`**: Workflow visual editor
- **`*Node.tsx`**: Custom workflow node components
- **`CustomEdge.tsx`**: Custom workflow connections

### Hooks (`/src/hooks/`)

#### Custom Hooks

- **`useAuth.ts`**: Authentication state and methods
- **`useProjects.ts`**: Project management operations
- **`useUI.ts`**: UI state management
- **`useAuthRehydration.ts`**: Authentication persistence

## 🎭 Features

### Project Management

- **Create Projects**: Upload PDFs and configure AI workflows
- **Project Dashboard**: View all projects with quick access
- **Project Settings**: Update configurations and manage documents
- **Document Processing**: PDF upload and automatic processing

### AI Chat Interface

- **Real-time Chat**: Interactive conversation with AI
- **Context-aware Responses**: Utilizes project documents
- **Message History**: Persistent conversation tracking
- **Source Attribution**: Citations from relevant documents

### Workflow Configuration

- **Visual Workflow Editor**: Drag-and-drop workflow builder
- **Node Types**: LLM, Knowledge Base, Web Search nodes
- **Configuration**: API key management and model settings
- **Execution Tracking**: Monitor workflow performance

### User Experience

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Theme**: User preference persistence
- **Toast Notifications**: Real-time feedback
- **Loading States**: Smooth user experience during operations
- **Error Handling**: Graceful error recovery

## 🧪 Development

### Development Scripts

```bash
# Development server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the established code style and patterns
4. Add tests for new functionality
5. Update documentation as needed
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## Required environment variables:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000/api

# Optional: Enable development features
VITE_NODE_ENV=development
```

Start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## 🛠️ Technology Stack

### Core Technologies

- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Static type checking and enhanced developer experience
- **Vite**: Fast build tool and development server
- **React Router**: Client-side routing and navigation

### State Management

- **Redux Toolkit**: Simplified Redux state management
- **RTK Query**: Data fetching and caching

### UI & Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation and gesture library
- **React Icons**: Comprehensive icon library
- **React Toastify**: Toast notifications

### Development Tools

- **ESLint**: Code linting and quality checks
- **Prettier**: Code formatting
- **PostCSS**: CSS processing and optimization

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
