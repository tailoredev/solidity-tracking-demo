var SimpleStorage = artifacts.require("./SimpleStorage.sol");
var PackageToken = artifacts.require("./PackageToken.sol");
var ReceiptToken = artifacts.require("./ReceiptToken.sol");
var DeliveryCoordinator = artifacts.require("./DeliveryCoordinator.sol");

module.exports = async function(deployer) {
  deployer.deploy(SimpleStorage);

  await deployer.deploy(PackageToken);
  await deployer.deploy(ReceiptToken);

  deployer.deploy(DeliveryCoordinator, PackageToken.address, ReceiptToken.address);
};
