var DeliveryCoordinator = artifacts.require("./DeliveryCoordinator.sol");

module.exports = async function(deployer) {
  await deployer.deploy(DeliveryCoordinator); 
};
