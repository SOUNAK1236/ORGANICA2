const Web3 = require('web3');
const dotenv = require('dotenv');

dotenv.config();

// Load contract ABI and address
const contractABI = require('../../blockchain/build/contracts/OrganicFoodTraceability.json').abi;
const contractAddress = process.env.CONTRACT_ADDRESS;

// Initialize web3
const initWeb3 = () => {
  const provider = new Web3.providers.HttpProvider(process.env.BLOCKCHAIN_PROVIDER_URL);
  return new Web3(provider);
};

// Initialize contract
const initContract = (web3) => {
  return new web3.eth.Contract(contractABI, contractAddress);
};

// Get default account
const getDefaultAccount = async (web3) => {
  const accounts = await web3.eth.getAccounts();
  return accounts[0];
};

// Register farmer on blockchain
const registerFarmer = async (farmerId, name, locationName, latitude, longitude, additionalDetails) => {
  try {
    const web3 = initWeb3();
    const contract = initContract(web3);
    const defaultAccount = await getDefaultAccount(web3);

    const result = await contract.methods.registerFarmer(
      farmerId,
      name,
      locationName,
      latitude,
      longitude,
      additionalDetails
    ).send({ from: defaultAccount, gas: 3000000 });

    return {
      success: true,
      transactionHash: result.transactionHash
    };
  } catch (error) {
    console.error('Error registering farmer on blockchain:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Create product on blockchain
const createProduct = async (name, description, productType, batchId, isOrganic, fromAddress) => {
  try {
    const web3 = initWeb3();
    const contract = initContract(web3);
    const account = fromAddress || await getDefaultAccount(web3);

    const result = await contract.methods.createProduct(
      name,
      description,
      productType,
      batchId || 0,
      isOrganic
    ).send({ from: account, gas: 3000000 });

    // Extract product ID from event logs
    const productCreatedEvent = result.events.ProductCreated;
    const productId = productCreatedEvent ? productCreatedEvent.returnValues.productId : null;

    return {
      success: true,
      productId,
      transactionHash: result.transactionHash
    };
  } catch (error) {
    console.error('Error creating product on blockchain:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Create batch on blockchain
const createBatch = async (productIds, harvestDate, processingMethods, fromAddress) => {
  try {
    const web3 = initWeb3();
    const contract = initContract(web3);
    const account = fromAddress || await getDefaultAccount(web3);

    const result = await contract.methods.createBatch(
      productIds || [],
      harvestDate || '',
      processingMethods || []
    ).send({ from: account, gas: 3000000 });

    // Extract batch ID from event logs
    const batchCreatedEvent = result.events.BatchCreated;
    const batchId = batchCreatedEvent ? batchCreatedEvent.returnValues.batchId : null;

    return {
      success: true,
      batchId,
      transactionHash: result.transactionHash
    };
  } catch (error) {
    console.error('Error creating batch on blockchain:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Add certification on blockchain
const addCertification = async (name, issuer, certificateHash, issueDate, expiryDate) => {
  try {
    const web3 = initWeb3();
    const contract = initContract(web3);
    const defaultAccount = await getDefaultAccount(web3);

    const result = await contract.methods.addCertification(
      name,
      issuer,
      certificateHash,
      Math.floor(new Date(issueDate).getTime() / 1000),
      Math.floor(new Date(expiryDate).getTime() / 1000)
    ).send({ from: defaultAccount, gas: 3000000 });

    // Extract certification ID from event logs
    const certificationAddedEvent = result.events.CertificationAdded;
    const certificationId = certificationAddedEvent ? certificationAddedEvent.returnValues.certificationId : null;

    return {
      success: true,
      certificationId,
      transactionHash: result.transactionHash
    };
  } catch (error) {
    console.error('Error adding certification on blockchain:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Add traceability record on blockchain
const addTraceabilityRecord = async (
  batchId,
  action,
  locationName,
  latitude,
  longitude,
  additionalDetails,
  notes,
  fromAddress
) => {
  try {
    const web3 = initWeb3();
    const contract = initContract(web3);
    const account = fromAddress || await getDefaultAccount(web3);

    const result = await contract.methods.addTraceabilityRecord(
      batchId,
      action,
      locationName,
      latitude,
      longitude,
      additionalDetails,
      notes
    ).send({ from: account, gas: 3000000 });

    return {
      success: true,
      transactionHash: result.transactionHash
    };
  } catch (error) {
    console.error('Error adding traceability record on blockchain:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Register QR code on blockchain
const registerQRCode = async (qrCodeHash, productId) => {
  try {
    const web3 = initWeb3();
    const contract = initContract(web3);
    const defaultAccount = await getDefaultAccount(web3);

    const result = await contract.methods.registerQRCode(
      qrCodeHash,
      productId
    ).send({ from: defaultAccount, gas: 3000000 });

    return {
      success: true,
      transactionHash: result.transactionHash
    };
  } catch (error) {
    console.error('Error registering QR code on blockchain:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Verify QR code on blockchain
const verifyQRCode = async (qrCodeHash) => {
  try {
    const web3 = initWeb3();
    const contract = initContract(web3);

    const isRegistered = await contract.methods.verifyQRCode(qrCodeHash).call();

    return {
      success: true,
      isRegistered
    };
  } catch (error) {
    console.error('Error verifying QR code on blockchain:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get product from blockchain
const getProduct = async (productId) => {
  try {
    const web3 = initWeb3();
    const contract = initContract(web3);

    const product = await contract.methods.getProduct(productId).call();

    return {
      success: true,
      product
    };
  } catch (error) {
    console.error('Error getting product from blockchain:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get batch from blockchain
const getBatch = async (batchId) => {
  try {
    const web3 = initWeb3();
    const contract = initContract(web3);

    const batch = await contract.methods.getBatch(batchId).call();

    return {
      success: true,
      batch
    };
  } catch (error) {
    console.error('Error getting batch from blockchain:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  initWeb3,
  initContract,
  getDefaultAccount,
  registerFarmer,
  createProduct,
  createBatch,
  addCertification,
  addTraceabilityRecord,
  registerQRCode,
  verifyQRCode,
  getProduct,
  getBatch
};