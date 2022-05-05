var DeliveryCoordinator = artifacts.require("./DeliveryCoordinator.sol");

module.exports = async function(deployer) {
   // NOTE - This will lose track of all previous versions of contracts deployed from within previous versions of the coordinator
  await deployer.deploy(DeliveryCoordinator);
};
