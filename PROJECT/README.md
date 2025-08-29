# Organic Food Traceability System

A blockchain-based platform for tracing organic food from farm to table, ensuring transparency and authenticity throughout the supply chain.

## Features

- Blockchain-based data storage for tamper-proof records
- Complete supply chain tracking from farm to retail
- QR code generation and scanning for real-time verification
- User-friendly interfaces for all stakeholders (farmers, distributors, retailers, consumers)
- Secure authentication and authorization system

## Project Structure

```
├── blockchain/          # Smart contracts and blockchain integration
├── backend/             # Node.js API server
├── frontend/            # React.js web application
│   ├── admin/           # Admin dashboard for system management
│   ├── stakeholder/     # Interface for farmers, distributors, retailers
│   └── consumer/        # Consumer verification portal
└── docs/                # Documentation
```

## Technology Stack

- **Blockchain**: Ethereum, Solidity, Truffle
- **Backend**: Node.js, Express, MongoDB
- **Frontend**: React.js, Material-UI
- **Authentication**: JWT
- **QR Code**: qrcode.js

## Getting Started

Detailed installation and setup instructions can be found in the [Installation Guide](./docs/installation.md).

## License

MIT