var DeliveryCoordinator = artifacts.require("./DeliveryCoordinator.sol");
var PackageToken = artifacts.require("./PackageToken.sol");
var ReceiptToken = artifacts.require("./ReceiptToken.sol");

module.exports = async function(deployer) {
  await deployer.deploy(PackageToken);
  await deployer.deploy(ReceiptToken);
  await deployer.deploy(DeliveryCoordinator, PackageToken.address, ReceiptToken.address);
};
