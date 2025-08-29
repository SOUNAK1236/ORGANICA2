const OrganicFoodTraceability = artifacts.require("OrganicFoodTraceability");

module.exports = function (deployer, network, accounts) {
  // Deploy the OrganicFoodTraceability contract
  deployer.deploy(OrganicFoodTraceability);
};