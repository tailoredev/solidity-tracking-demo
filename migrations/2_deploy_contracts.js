var SimpleStorage = artifacts.require("./SimpleStorage.sol");
var DeliveryCoordinator = artifacts.require("./DeliveryCoordinator.sol");

module.exports = function(deployer) {
  deployer.deploy(SimpleStorage);
  deployer.deploy(DeliveryCoordinator);
};
