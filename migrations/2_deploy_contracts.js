var SimpleStorage = artifacts.require("./SimpleStorage.sol");
var DeliveryCoordinator = artifacts.require("./DeliveryCoordinator.sol");

module.exports = async function(deployer) {
  deployer.deploy(SimpleStorage);
  await deployer.deploy(DeliveryCoordinator); 
};
