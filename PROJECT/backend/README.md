# Organic Food Traceability Backend

## Overview

This is the backend API for the Organic Food Traceability system, a blockchain-based solution for tracking organic food products throughout the supply chain. The system allows farmers, processors, distributors, retailers, and consumers to verify the authenticity and origin of organic food products.

## Features

- User authentication and authorization with role-based access control
- Product management with blockchain integration
- Batch tracking and traceability records
- Certification verification
- QR code generation and verification
- Blockchain integration for immutable record-keeping

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- Web3.js for Ethereum blockchain integration
- JWT for authentication
- QR code generation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Ethereum blockchain node (local or testnet)
- Smart contract deployed (see `/contracts` directory in the project root)

## Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file based on `.env.example` and configure your environment variables
5. Start the server:

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Users

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/password` - Change password
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/users/role/:role` - Get users by role

### Products

- `POST /api/products` - Create a new product
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/:id/certifications` - Add certification to product
- `DELETE /api/products/:id/certifications/:certId` - Remove certification from product
- `GET /api/products/farmer/:farmerId` - Get products by farmer

### Batches

- `POST /api/batches` - Create a new batch
- `GET /api/batches` - Get all batches
- `GET /api/batches/:id` - Get batch by ID
- `POST /api/batches/:id/traceability` - Add traceability record
- `PUT /api/batches/:id` - Update batch
- `GET /api/batches/product/:productId` - Get batches by product
- `GET /api/batches/handler/:handlerId` - Get batches by handler

### Certifications

- `POST /api/certifications` - Create a new certification
- `GET /api/certifications` - Get all certifications
- `GET /api/certifications/:id` - Get certification by ID
- `PUT /api/certifications/:id` - Update certification
- `DELETE /api/certifications/:id` - Delete certification
- `POST /api/certifications/verify` - Verify certification hash

### QR Codes

- `POST /api/qrcodes/generate` - Generate QR code for product
- `GET /api/qrcodes/verify/:hash` - Verify QR code
- `GET /api/qrcodes/:hash` - Get QR code by hash
- `GET /api/qrcodes/product/:productId` - Get QR codes by product
- `PUT /api/qrcodes/:hash/deactivate` - Deactivate QR code
- `GET /api/qrcodes/:hash/history` - Get QR code scan history

## Blockchain Integration

The backend integrates with an Ethereum smart contract for immutable record-keeping. The following operations are recorded on the blockchain:

- Registering farmers
- Creating products
- Creating batches
- Adding certifications
- Adding traceability records
- Registering QR codes

See the `blockchain.js` utility file for implementation details.

## Testing

Run tests with:

```bash
npm test
```

## License

MIT