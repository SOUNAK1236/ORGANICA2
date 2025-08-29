const Certification = require('../models/certification.model');
const { validationResult } = require('express-validator');
const blockchainService = require('../utils/blockchain');

/**
 * Create a new certification
 * @route POST /api/certifications
 * @access Private - Admins, Certifiers
 */
exports.createCertification = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      name, 
      issuer, 
      certificateHash,
      issueDate,
      expiryDate,
      documentUrl
    } = req.body;

    // Initialize blockchain connection
    const web3 = await blockchainService.initWeb3();
    const contract = await blockchainService.initContract();
    const account = await blockchainService.getDefaultAccount();

    // Create certification on blockchain
    const result = await contract.methods.addCertification(
      name,
      issuer,
      certificateHash,
      Math.floor(new Date(issueDate).getTime() / 1000),
      Math.floor(new Date(expiryDate).getTime() / 1000)
    ).send({ from: account, gas: 1000000 });

    // Get certification ID from blockchain transaction
    const certificationId = result.events.CertificationAdded.returnValues.certificationId;
    const txHash = result.transactionHash;

    // Create certification in database
    const certification = new Certification({
      name,
      issuer,
      certificateHash,
      issueDate,
      expiryDate,
      documentUrl,
      blockchainCertificationId: certificationId,
      transactionHash: txHash,
      isValid: true
    });

    // Save certification
    await certification.save();

    res.status(201).json({
      success: true,
      data: certification,
      blockchainData: {
        certificationId,
        transactionHash: txHash
      }
    });
  } catch (err) {
    console.error('Create certification error:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

/**
 * Get all certifications
 * @route GET /api/certifications
 * @access Public
 */
exports.getCertifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, issuer, isValid } = req.query;
    
    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { issuer: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (issuer) query.issuer = { $regex: issuer, $options: 'i' };
    if (isValid !== undefined) query.isValid = isValid === 'true';

    // Execute query with pagination
    const certifications = await Certification.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ issueDate: -1 });

    // Get total count
    const count = await Certification.countDocuments(query);

    res.json({
      certifications,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCertifications: count
    });
  } catch (err) {
    console.error('Get certifications error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get certification by ID
 * @route GET /api/certifications/:id
 * @access Public
 */
exports.getCertificationById = async (req, res) => {
  try {
    const certification = await Certification.findById(req.params.id);

    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }

    res.json(certification);
  } catch (err) {
    console.error('Get certification by ID error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update certification
 * @route PUT /api/certifications/:id
 * @access Private - Admins, Certifiers
 */
exports.updateCertification = async (req, res) => {
  try {
    const { 
      name, 
      issuer, 
      certificateHash,
      issueDate,
      expiryDate,
      documentUrl,
      isValid 
    } = req.body;

    // Find certification
    let certification = await Certification.findById(req.params.id);

    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }

    // Update fields
    if (name) certification.name = name;
    if (issuer) certification.issuer = issuer;
    if (certificateHash) certification.certificateHash = certificateHash;
    if (issueDate) certification.issueDate = issueDate;
    if (expiryDate) certification.expiryDate = expiryDate;
    if (documentUrl) certification.documentUrl = documentUrl;
    if (isValid !== undefined) certification.isValid = isValid;

    // Save updated certification
    await certification.save();

    res.json({
      success: true,
      data: certification
    });
  } catch (err) {
    console.error('Update certification error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete certification
 * @route DELETE /api/certifications/:id
 * @access Private - Admins
 */
exports.deleteCertification = async (req, res) => {
  try {
    const certification = await Certification.findById(req.params.id);

    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }

    // Instead of deleting, mark as invalid
    certification.isValid = false;
    await certification.save();

    res.json({ message: 'Certification marked as invalid' });
  } catch (err) {
    console.error('Delete certification error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Verify certification hash
 * @route POST /api/certifications/verify
 * @access Public
 */
exports.verifyCertification = async (req, res) => {
  try {
    const { certificateHash } = req.body;

    if (!certificateHash) {
      return res.status(400).json({ message: 'Certificate hash is required' });
    }

    // Find certification by hash
    const certification = await Certification.findOne({ certificateHash });

    if (!certification) {
      return res.status(404).json({ 
        verified: false,
        message: 'Certificate not found' 
      });
    }

    // Check if certificate is valid and not expired
    const now = new Date();
    const isExpired = certification.expiryDate < now;

    if (!certification.isValid) {
      return res.json({
        verified: false,
        message: 'Certificate has been revoked',
        certification
      });
    }

    if (isExpired) {
      return res.json({
        verified: false,
        message: 'Certificate has expired',
        certification
      });
    }

    res.json({
      verified: true,
      message: 'Certificate is valid',
      certification
    });
  } catch (err) {
    console.error('Verify certification error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};