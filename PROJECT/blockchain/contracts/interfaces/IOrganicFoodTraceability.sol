// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IOrganicFoodTraceability
 * @dev Interface for the OrganicFoodTraceability contract
 */
interface IOrganicFoodTraceability {
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
        address[] handlerIds;
        TraceabilityRecord[] traceabilityRecords;
        bool isActive;
    }

    struct Certification {
        uint256 id;
        string name;
        string issuer;
        string certificateHash;
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

    // Events
    event FarmerRegistered(address indexed farmerId, string name, Location location);
    event ProductCreated(uint256 indexed productId, string name, address indexed farmerId, uint256 batchId);
    event BatchCreated(uint256 indexed batchId, address indexed creatorId, uint256[] productIds);
    event CertificationAdded(uint256 indexed certificationId, string name, string issuer);
    event TraceabilityRecordAdded(uint256 indexed batchId, address indexed handlerId, string action);
    event QRCodeRegistered(string qrCodeHash, uint256 indexed productId);

    // Functions
    function pause() external;
    function unpause() external;
    
    function registerFarmer(
        address _farmerId,
        string memory _name,
        string memory _locationName,
        string memory _latitude,
        string memory _longitude,
        string memory _additionalDetails
    ) external;
    
    function createProduct(
        string memory _name,
        string memory _description,
        string memory _productType,
        uint256 _batchId,
        bool _isOrganic
    ) external returns (uint256);
    
    function createBatch(
        uint256[] memory _productIds,
        string memory _harvestDate,
        string[] memory _processingMethods
    ) external returns (uint256);
    
    function addCertification(
        string memory _name,
        string memory _issuer,
        string memory _certificateHash,
        uint256 _issueDate,
        uint256 _expiryDate
    ) external returns (uint256);
    
    function addCertificationToProduct(
        uint256 _productId,
        uint256 _certificationId
    ) external;
    
    function addTraceabilityRecord(
        uint256 _batchId,
        string memory _action,
        string memory _locationName,
        string memory _latitude,
        string memory _longitude,
        string memory _additionalDetails,
        string memory _notes
    ) external;
    
    function registerQRCode(
        string memory _qrCodeHash,
        uint256 _productId
    ) external;
    
    function verifyQRCode(string memory _qrCodeHash) external view returns (bool);
    function getProduct(uint256 _productId) external view returns (Product memory);
    function getBatch(uint256 _batchId) external view returns (Batch memory);
    function getCertification(uint256 _certificationId) external view returns (Certification memory);
    function getFarmer(address _farmerId) external view returns (Farmer memory);
}