// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title OrganicFoodTraceability
 * @dev Main contract for tracking organic food products through the supply chain
 */
contract OrganicFoodTraceability is AccessControl, Pausable {
    using Counters for Counters.Counter;

    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");
    bytes32 public constant PROCESSOR_ROLE = keccak256("PROCESSOR_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");

    // Counters for IDs
    Counters.Counter private _productIdCounter;
    Counters.Counter private _batchIdCounter;
    Counters.Counter private _certificationIdCounter;

    // Structs
    struct Location {
        string name;
        string latitude;
        string longitude;
        string additionalDetails;
    }

    struct Farmer {
        address id;
        string name;
        Location location;
        string[] certifications;
        bool isActive;
    }

    struct Product {
        uint256 id;
        string name;
        string description;
        string productType;
        address farmerId;
        uint256 batchId;
        uint256[] certificationIds;
        uint256 createdAt;
        bool isOrganic;
    }

    struct Batch {
        uint256 id;
        uint256[] productIds;
        string harvestDate;
        string[] processingMethods;
        address[] handlerIds; // All entities that handled this batch
        TraceabilityRecord[] traceabilityRecords;
        bool isActive;
    }

    struct Certification {
        uint256 id;
        string name;
        string issuer;
        string certificateHash; // IPFS hash of the certificate document
        uint256 issueDate;
        uint256 expiryDate;
        bool isValid;
    }

    struct TraceabilityRecord {
        uint256 timestamp;
        address handlerId;
        string handlerRole;
        string action;
        Location location;
        string notes;
    }

    // Mappings
    mapping(address => Farmer) public farmers;
    mapping(uint256 => Product) public products;
    mapping(uint256 => Batch) public batches;
    mapping(uint256 => Certification) public certifications;
    mapping(string => bool) public registeredQRCodes;

    // Events
    event FarmerRegistered(address indexed farmerId, string name, Location location);
    event ProductCreated(uint256 indexed productId, string name, address indexed farmerId, uint256 batchId);
    event BatchCreated(uint256 indexed batchId, address indexed creatorId, uint256[] productIds);
    event CertificationAdded(uint256 indexed certificationId, string name, string issuer);
    event TraceabilityRecordAdded(uint256 indexed batchId, address indexed handlerId, string action);
    event QRCodeRegistered(string qrCodeHash, uint256 indexed productId);

    /**
     * @dev Constructor sets up default admin role
     */
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Pause the contract (only admin)
     */
    function pause() public onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract (only admin)
     */
    function unpause() public onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Register a new farmer
     * @param _farmerId Address of the farmer
     * @param _name Name of the farmer/farm
     * @param _locationName Location name
     * @param _latitude Latitude coordinates
     * @param _longitude Longitude coordinates
     * @param _additionalDetails Additional location details
     */
    function registerFarmer(
        address _farmerId,
        string memory _name,
        string memory _locationName,
        string memory _latitude,
        string memory _longitude,
        string memory _additionalDetails
    ) public onlyRole(ADMIN_ROLE) whenNotPaused {
        require(_farmerId != address(0), "Invalid farmer address");
        require(bytes(_name).length > 0, "Name cannot be empty");

        Location memory location = Location({
            name: _locationName,
            latitude: _latitude,
            longitude: _longitude,
            additionalDetails: _additionalDetails
        });

        farmers[_farmerId] = Farmer({
            id: _farmerId,
            name: _name,
            location: location,
            certifications: new string[](0),
            isActive: true
        });

        _setupRole(FARMER_ROLE, _farmerId);

        emit FarmerRegistered(_farmerId, _name, location);
    }

    /**
     * @dev Create a new product
     * @param _name Product name
     * @param _description Product description
     * @param _productType Type of product
     * @param _batchId Batch ID (0 for new batch)
     * @param _isOrganic Whether the product is organic
     * @return productId The ID of the created product
     */
    function createProduct(
        string memory _name,
        string memory _description,
        string memory _productType,
        uint256 _batchId,
        bool _isOrganic
    ) public onlyRole(FARMER_ROLE) whenNotPaused returns (uint256) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(farmers[msg.sender].isActive, "Farmer is not active");

        uint256 newBatchId = _batchId;
        if (_batchId == 0) {
            newBatchId = createBatch(new uint256[](0), "", new string[](0));
        } else {
            require(batches[_batchId].isActive, "Batch is not active");
        }

        _productIdCounter.increment();
        uint256 productId = _productIdCounter.current();

        products[productId] = Product({
            id: productId,
            name: _name,
            description: _description,
            productType: _productType,
            farmerId: msg.sender,
            batchId: newBatchId,
            certificationIds: new uint256[](0),
            createdAt: block.timestamp,
            isOrganic: _isOrganic
        });

        // Add product to batch
        batches[newBatchId].productIds.push(productId);

        emit ProductCreated(productId, _name, msg.sender, newBatchId);
        return productId;
    }

    /**
     * @dev Create a new batch
     * @param _productIds Initial product IDs in the batch
     * @param _harvestDate Harvest date
     * @param _processingMethods Processing methods used
     * @return batchId The ID of the created batch
     */
    function createBatch(
        uint256[] memory _productIds,
        string memory _harvestDate,
        string[] memory _processingMethods
    ) public onlyRole(FARMER_ROLE) whenNotPaused returns (uint256) {
        _batchIdCounter.increment();
        uint256 batchId = _batchIdCounter.current();

        address[] memory handlers = new address[](1);
        handlers[0] = msg.sender;

        TraceabilityRecord memory initialRecord = TraceabilityRecord({
            timestamp: block.timestamp,
            handlerId: msg.sender,
            handlerRole: "FARMER",
            action: "BATCH_CREATED",
            location: farmers[msg.sender].location,
            notes: "Initial batch creation"
        });

        TraceabilityRecord[] memory records = new TraceabilityRecord[](1);
        records[0] = initialRecord;

        batches[batchId] = Batch({
            id: batchId,
            productIds: _productIds,
            harvestDate: _harvestDate,
            processingMethods: _processingMethods,
            handlerIds: handlers,
            traceabilityRecords: records,
            isActive: true
        });

        emit BatchCreated(batchId, msg.sender, _productIds);
        return batchId;
    }

    /**
     * @dev Add a certification
     * @param _name Certification name
     * @param _issuer Certification issuer
     * @param _certificateHash IPFS hash of the certificate document
     * @param _issueDate Issue date (timestamp)
     * @param _expiryDate Expiry date (timestamp)
     * @return certificationId The ID of the created certification
     */
    function addCertification(
        string memory _name,
        string memory _issuer,
        string memory _certificateHash,
        uint256 _issueDate,
        uint256 _expiryDate
    ) public onlyRole(ADMIN_ROLE) whenNotPaused returns (uint256) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_issuer).length > 0, "Issuer cannot be empty");
        require(bytes(_certificateHash).length > 0, "Certificate hash cannot be empty");

        _certificationIdCounter.increment();
        uint256 certificationId = _certificationIdCounter.current();

        certifications[certificationId] = Certification({
            id: certificationId,
            name: _name,
            issuer: _issuer,
            certificateHash: _certificateHash,
            issueDate: _issueDate,
            expiryDate: _expiryDate,
            isValid: true
        });

        emit CertificationAdded(certificationId, _name, _issuer);
        return certificationId;
    }

    /**
     * @dev Add a certification to a product
     * @param _productId Product ID
     * @param _certificationId Certification ID
     */
    function addCertificationToProduct(
        uint256 _productId,
        uint256 _certificationId
    ) public onlyRole(ADMIN_ROLE) whenNotPaused {
        require(products[_productId].id == _productId, "Product does not exist");
        require(certifications[_certificationId].id == _certificationId, "Certification does not exist");
        require(certifications[_certificationId].isValid, "Certification is not valid");

        products[_productId].certificationIds.push(_certificationId);
    }

    /**
     * @dev Add a traceability record to a batch
     * @param _batchId Batch ID
     * @param _action Action performed
     * @param _locationName Location name
     * @param _latitude Latitude coordinates
     * @param _longitude Longitude coordinates
     * @param _additionalDetails Additional location details
     * @param _notes Additional notes
     */
    function addTraceabilityRecord(
        uint256 _batchId,
        string memory _action,
        string memory _locationName,
        string memory _latitude,
        string memory _longitude,
        string memory _additionalDetails,
        string memory _notes
    ) public whenNotPaused {
        require(batches[_batchId].id == _batchId, "Batch does not exist");
        require(batches[_batchId].isActive, "Batch is not active");
        require(
            hasRole(FARMER_ROLE, msg.sender) ||
            hasRole(PROCESSOR_ROLE, msg.sender) ||
            hasRole(DISTRIBUTOR_ROLE, msg.sender) ||
            hasRole(RETAILER_ROLE, msg.sender),
            "Unauthorized role"
        );

        string memory handlerRole = "UNKNOWN";
        if (hasRole(FARMER_ROLE, msg.sender)) handlerRole = "FARMER";
        if (hasRole(PROCESSOR_ROLE, msg.sender)) handlerRole = "PROCESSOR";
        if (hasRole(DISTRIBUTOR_ROLE, msg.sender)) handlerRole = "DISTRIBUTOR";
        if (hasRole(RETAILER_ROLE, msg.sender)) handlerRole = "RETAILER";

        Location memory location = Location({
            name: _locationName,
            latitude: _latitude,
            longitude: _longitude,
            additionalDetails: _additionalDetails
        });

        TraceabilityRecord memory record = TraceabilityRecord({
            timestamp: block.timestamp,
            handlerId: msg.sender,
            handlerRole: handlerRole,
            action: _action,
            location: location,
            notes: _notes
        });

        batches[_batchId].traceabilityRecords.push(record);
        
        // Add handler to the batch if not already present
        bool handlerExists = false;
        for (uint i = 0; i < batches[_batchId].handlerIds.length; i++) {
            if (batches[_batchId].handlerIds[i] == msg.sender) {
                handlerExists = true;
                break;
            }
        }
        
        if (!handlerExists) {
            batches[_batchId].handlerIds.push(msg.sender);
        }

        emit TraceabilityRecordAdded(_batchId, msg.sender, _action);
    }

    /**
     * @dev Register a QR code for a product
     * @param _qrCodeHash Hash of the QR code
     * @param _productId Product ID
     */
    function registerQRCode(
        string memory _qrCodeHash,
        uint256 _productId
    ) public onlyRole(ADMIN_ROLE) whenNotPaused {
        require(bytes(_qrCodeHash).length > 0, "QR code hash cannot be empty");
        require(!registeredQRCodes[_qrCodeHash], "QR code already registered");
        require(products[_productId].id == _productId, "Product does not exist");

        registeredQRCodes[_qrCodeHash] = true;
        emit QRCodeRegistered(_qrCodeHash, _productId);
    }

    /**
     * @dev Verify if a QR code is registered
     * @param _qrCodeHash Hash of the QR code
     * @return isRegistered Whether the QR code is registered
     */
    function verifyQRCode(string memory _qrCodeHash) public view returns (bool) {
        return registeredQRCodes[_qrCodeHash];
    }

    /**
     * @dev Get product details
     * @param _productId Product ID
     * @return product The product details
     */
    function getProduct(uint256 _productId) public view returns (Product memory) {
        require(products[_productId].id == _productId, "Product does not exist");
        return products[_productId];
    }

    /**
     * @dev Get batch details
     * @param _batchId Batch ID
     * @return batch The batch details
     */
    function getBatch(uint256 _batchId) public view returns (Batch memory) {
        require(batches[_batchId].id == _batchId, "Batch does not exist");
        return batches[_batchId];
    }

    /**
     * @dev Get certification details
     * @param _certificationId Certification ID
     * @return certification The certification details
     */
    function getCertification(uint256 _certificationId) public view returns (Certification memory) {
        require(certifications[_certificationId].id == _certificationId, "Certification does not exist");
        return certifications[_certificationId];
    }

    /**
     * @dev Get farmer details
     * @param _farmerId Farmer address
     * @return farmer The farmer details
     */
    function getFarmer(address _farmerId) public view returns (Farmer memory) {
        require(_farmerId != address(0), "Invalid farmer address");
        require(farmers[_farmerId].id == _farmerId, "Farmer does not exist");
        return farmers[_farmerId];
    }
}