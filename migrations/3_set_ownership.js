var DeliveryCoordinator = artifacts.require("./DeliveryCoordinator.sol");
var PackageToken = artifacts.require("./PackageToken.sol");
var ReceiptToken = artifacts.require("./ReceiptToken.sol");

module.exports = async function(deployer, network, accounts) {
  const packageTokenInstance = await PackageToken.deployed();
  const receiptTokenInstance = await ReceiptToken.deployed();

  const packageTokenOwner = await packageTokenInstance.owner.call();
  const receiptTokenOwner = await receiptTokenInstance.owner.call();

  if (packageTokenOwner === accounts[0]) {
    await packageTokenInstance.transferOwnership(DeliveryCoordinator.address);
  }

  if (receiptTokenOwner === accounts[0]) {
    await receiptTokenInstance.transferOwnership(DeliveryCoordinator.address);
  }
};
