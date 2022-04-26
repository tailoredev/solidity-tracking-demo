const {expectRevert} = require('@openzeppelin/test-helpers');

const DeliveryNode = artifacts.require("./DeliveryNode.sol");
const PackageToken = artifacts.require("./PackageToken.sol");
const ReceiptToken = artifacts.require("./ReceiptToken.sol");

contract("DeliveryNode", accounts => {

  it("should not receive tokens when offline", async () => {
    const packageContents = "Box of test stuff";
    const packageWeight = "10kg";

    const packageTokenInstance = await PackageToken.new({ from: accounts[0] });
    const deliveryNodeInstance = await DeliveryNode.new("Test node", DeliveryNode.NodeStatus.OFFLINE, packageTokenInstance.address, { from: accounts[0] });

    const packageTokenId = await packageTokenInstance.createPackage.call(accounts[0], packageContents, packageWeight);
    await packageTokenInstance.createPackage(accounts[0], packageContents, packageWeight, { from: accounts[0] });

    assert.equal(accounts[0], await packageTokenInstance.ownerOf.call(packageTokenId), "The specified account does not own the newly minted package token.");

    await expectRevert(packageTokenInstance.safeTransferFrom(accounts[0], deliveryNodeInstance.address, packageTokenId), "Delivery node is offline");
  });

  it("should not accept unknown ERC721 tokens", async () => {
    const packageTokenInstance = await PackageToken.new({ from: accounts[0] });
    const receiptTokenInstance = await ReceiptToken.new({ from: accounts[0] });
    const deliveryNodeInstance = await DeliveryNode.new("Test node", DeliveryNode.NodeStatus.ONLINE, packageTokenInstance.address, { from: accounts[0] });

    const dummyTokenId = await receiptTokenInstance.createReceipt.call(accounts[0], 1);
    await receiptTokenInstance.createReceipt(accounts[0], 1);

    assert.equal(accounts[0], await receiptTokenInstance.ownerOf.call(dummyTokenId), "The specified account does not own the newly minted token.");

    await expectRevert(receiptTokenInstance.safeTransferFrom(accounts[0], deliveryNodeInstance.address, dummyTokenId), "ERC721 received is not from known token address");
  });

  it("should receive package tokens when online", async () => {
    const packageContents = "Box of test stuff";
    const packageWeight = "10kg";

    const packageTokenInstance = await PackageToken.new({ from: accounts[0] });
    const deliveryNodeInstance = await DeliveryNode.new("Test node", DeliveryNode.NodeStatus.ONLINE, packageTokenInstance.address, { from: accounts[0] });

    const packageTokenId = await packageTokenInstance.createPackage.call(accounts[0], packageContents, packageWeight);
    await packageTokenInstance.createPackage(accounts[0], packageContents, packageWeight, { from: accounts[0] });

    assert.equal(accounts[0], await packageTokenInstance.ownerOf.call(packageTokenId), "The specified account does not own the newly minted package token.");

    await packageTokenInstance.safeTransferFrom(accounts[0], deliveryNodeInstance.address, packageTokenId);

    assert.equal(deliveryNodeInstance.address, await packageTokenInstance.ownerOf.call(packageTokenId), "The specified delivery node does not own the newly minted package token.");
  });

  it("should not forward packages when not called by owner", async () => {
    const deliveryNodeInstance = await DeliveryNode.new("Test node", DeliveryNode.NodeStatus.ONLINE, accounts[9], { from: accounts[0] });

    await expectRevert(deliveryNodeInstance.forwardPackage(accounts[0], 1, { from: accounts[1] }), "Ownable: caller is not the owner");
  });

  it("should forward packages when called by owner", async () => {
    const packageContents = "Box of test stuff";
    const packageWeight = "10kg";

    const packageTokenInstance = await PackageToken.new({ from: accounts[0] });
    const deliveryNodeInstance = await DeliveryNode.new("Test node", DeliveryNode.NodeStatus.ONLINE, packageTokenInstance.address, { from: accounts[0] });

    const packageTokenId = await packageTokenInstance.createPackage.call(accounts[0], packageContents, packageWeight);
    await packageTokenInstance.createPackage(accounts[0], packageContents, packageWeight, { from: accounts[0] });

    assert.equal(accounts[0], await packageTokenInstance.ownerOf.call(packageTokenId), "The specified account does not own the newly minted package token.");

    await packageTokenInstance.safeTransferFrom(accounts[0], deliveryNodeInstance.address, packageTokenId);

    assert.equal(deliveryNodeInstance.address, await packageTokenInstance.ownerOf.call(packageTokenId), "The specified delivery node does not own the newly minted package token.");

    await deliveryNodeInstance.forwardPackage(accounts[1], packageTokenId, { from: accounts[0] });

    assert.equal(accounts[1], await packageTokenInstance.ownerOf.call(packageTokenId), "The address does not own the transferred package token.");
  });

  it("should not change status when not called by owner", async () => {
    const deliveryNodeInstance = await DeliveryNode.new("Test node", DeliveryNode.NodeStatus.ONLINE, accounts[9], { from: accounts[0] });

    await expectRevert(deliveryNodeInstance.setNodeStatus(DeliveryNode.NodeStatus.OFFLINE, { from: accounts[1] }), "Ownable: caller is not the owner");
  });

  it("should change status when called by owner", async () => {
    const deliveryNodeInstance = await DeliveryNode.new("Test node", DeliveryNode.NodeStatus.ONLINE, accounts[9], { from: accounts[0] });

    await deliveryNodeInstance.setNodeStatus(DeliveryNode.NodeStatus.OFFLINE, { from: accounts[0] });

    assert.equal(DeliveryNode.NodeStatus.OFFLINE, await deliveryNodeInstance.status.call(), "The delivery node is not in the expected state.");
  });

});
