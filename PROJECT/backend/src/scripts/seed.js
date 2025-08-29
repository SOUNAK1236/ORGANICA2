/**
 * Database seeder script
 * Run with: node src/scripts/seed.js
 */

require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const Batch = require('../models/batch.model');
const Certification = require('../models/certification.model');
const connectDB = require('../config/database');

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'John Farmer',
    email: 'farmer@example.com',
    password: 'farmer123',
    role: 'farmer'
  },
  {
    name: 'Jane Processor',
    email: 'processor@example.com',
    password: 'processor123',
    role: 'processor'
  },
  {
    name: 'Bob Distributor',
    email: 'distributor@example.com',
    password: 'distributor123',
    role: 'distributor'
  },
  {
    name: 'Alice Retailer',
    email: 'retailer@example.com',
    password: 'retailer123',
    role: 'retailer'
  },
  {
    name: 'Consumer User',
    email: 'consumer@example.com',
    password: 'consumer123',
    role: 'consumer'
  }
];

const certifications = [
  {
    name: 'USDA Organic',
    issuer: 'USDA',
    certificateHash: 'usda-organic-cert-hash',
    issueDate: new Date('2023-01-01'),
    expiryDate: new Date('2024-01-01'),
    documentUrl: 'https://example.com/certifications/usda-organic.pdf',
    isValid: true
  },
  {
    name: 'EU Organic',
    issuer: 'European Union',
    certificateHash: 'eu-organic-cert-hash',
    issueDate: new Date('2023-02-01'),
    expiryDate: new Date('2024-02-01'),
    documentUrl: 'https://example.com/certifications/eu-organic.pdf',
    isValid: true
  },
  {
    name: 'Fair Trade',
    issuer: 'Fair Trade International',
    certificateHash: 'fair-trade-cert-hash',
    issueDate: new Date('2023-03-01'),
    expiryDate: new Date('2024-03-01'),
    documentUrl: 'https://example.com/certifications/fair-trade.pdf',
    isValid: true
  }
];

// Seed database
const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Batch.deleteMany({});
    await Certification.deleteMany({});
    
    console.log('Database cleared');
    
    // Create users
    const createdUsers = [];
    for (const user of users) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      
      const newUser = await User.create({
        ...user,
        password: hashedPassword
      });
      
      createdUsers.push(newUser);
      console.log(`Created user: ${newUser.name} (${newUser.role})`);
    }
    
    // Get farmer user
    const farmer = createdUsers.find(user => user.role === 'farmer');
    
    // Create certifications
    const createdCertifications = [];
    for (const cert of certifications) {
      const newCert = await Certification.create(cert);
      createdCertifications.push(newCert);
      console.log(`Created certification: ${newCert.name}`);
    }
    
    // Create batch
    const batch = await Batch.create({
      harvestDate: new Date('2023-05-15'),
      processingMethods: ['Washing', 'Sorting', 'Packaging'],
      handlers: createdUsers.filter(user => ['farmer', 'processor'].includes(user.role)).map(user => user._id),
      traceabilityRecords: [
        {
          action: 'Harvested',
          location: 'Farm A, Field 3',
          timestamp: new Date('2023-05-15T08:00:00Z'),
          handlerId: farmer._id,
          notes: 'Harvested in optimal conditions'
        }
      ]
    });
    
    console.log(`Created batch: ${batch._id}`);
    
    // Create product
    const product = await Product.create({
      name: 'Organic Apples',
      description: 'Fresh organic apples grown with sustainable farming practices',
      productType: 'Fruit',
      farmer: farmer._id,
      batch: batch._id,
      isOrganic: true,
      certifications: [createdCertifications[0]._id, createdCertifications[2]._id],
      images: ['/uploads/products/sample-apple.jpg'],
      isActive: true
    });
    
    console.log(`Created product: ${product.name}`);
    
    // Update batch with product
    batch.products = [product._id];
    await batch.save();
    
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();