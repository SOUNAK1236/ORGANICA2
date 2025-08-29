# Installation Guide

## Prerequisites

- Node.js (v14.x or later)
- npm (v6.x or later)
- Truffle Suite (for blockchain development)
- Ganache (for local blockchain testing)
- MongoDB (for database)

## Setting Up the Development Environment

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/organic-food-traceability.git
cd organic-food-traceability
```

### 2. Install Dependencies

Install all dependencies for the project components:

```bash
npm run install:all
```

Or install dependencies for specific components:

```bash
npm run install:blockchain  # Install blockchain dependencies
npm run install:backend     # Install backend dependencies
npm run install:frontend    # Install frontend dependencies
```

### 3. Configure Environment Variables

Create `.env` files in the backend and frontend directories based on the provided examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit the `.env` files to configure your environment-specific settings.

### 4. Set Up Blockchain

#### Start Ganache

Start Ganache for local blockchain development:

```bash
ganache-cli
```

Or use the Ganache GUI application.

#### Compile and Deploy Smart Contracts

```bash
npm run blockchain:compile  # Compile smart contracts
npm run blockchain:migrate   # Deploy smart contracts to the blockchain
```

### 5. Set Up Database

Ensure MongoDB is running, then the backend will automatically create the required collections on startup.

### 6. Start Development Servers

#### Start All Services

```bash
npm run dev  # Starts both backend and frontend servers
```

Or start services individually:

```bash
npm run backend:dev   # Start backend server
npm run frontend:dev  # Start frontend server
```

### 7. Access the Application

- Backend API: http://localhost:5000
- Frontend Application: http://localhost:3000
- Admin Dashboard: http://localhost:3000/admin
- Stakeholder Interface: http://localhost:3000/stakeholder
- Consumer Portal: http://localhost:3000/consumer

## Production Deployment

For production deployment, additional steps are required:

1. Set up a production-grade MongoDB database
2. Deploy smart contracts to a public or private Ethereum network
3. Configure environment variables for production
4. Build optimized frontend assets
5. Set up a production web server (e.g., Nginx)

Detailed production deployment instructions will be provided in a separate guide.