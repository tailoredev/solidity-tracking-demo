const {expectRevert} = require('@openzeppelin/test-helpers');

const DeliveryCoordinator = artifacts.require("./DeliveryCoordinator.sol");
const DeliveryNode = artifacts.require("./DeliveryNode.sol");
const PackageToken = artifacts.require("./PackageToken.sol");
const ReceiptToken = artifacts.require("./ReceiptToken.sol");

contract("DeliveryCoordinator", accounts => {

  it("should not allow non-owner addresses to add nodes", async () => {
    const deliveryCoordinatorInstance = await DeliveryCoordinator.deployed();

    await expectRevert(deliveryCoordinatorInstance.addDeliveryNode("Testville", { from: accounts[1] }), "Ownable: caller is not the owner");
  });

  it("should successfully deploy additional delivery nodes", async () => {
    const testNodeOneName = "Testville";
    const testNodeTwoName = "Test City";

    const deliveryCoordinatorInstance = await DeliveryCoordinator.deployed();

    await deliveryCoordinatorInstance.addDeliveryNode(testNodeOneName, { from: accounts[0] });
    await deliveryCoordinatorInstance.addDeliveryNode(testNodeTwoName, { from: accounts[0] });

    const firstInitialisedNode = await DeliveryNode.at(await deliveryCoordinatorInstance.deliveryNodes.call(0));
    const secondInitialisedNode = await DeliveryNode.at(await deliveryCoordinatorInstance.deliveryNodes.call(1));

    assert.equal(testNodeOneName, await firstInitialisedNode.name.call(), "The node was not initialised with the correct name.");
    assert.equal(DeliveryNode.NodeStatus.ONLINE, await firstInitialisedNode.status.call(), "The node was not initialised with the correct status.");

    assert.equal(testNodeTwoName, await secondInitialisedNode.name.call(), "The node was not initialised with the correct name.");
    assert.equal(DeliveryNode.NodeStatus.ONLINE, await secondInitialisedNode.status.call(), "The node was not initialised with the correct status.");
  });

  it("should correctly issue a package token", async () => {
    const packageContents = "Box of test stuff";
    const packageWeight = "10kg";

    const deliveryCoordinatorInstance = await DeliveryCoordinator.deployed();
    const packageTokenInstance = await PackageToken.deployed();

    // TODO - Get the token id as returned from this call
    await deliveryCoordinatorInstance.createPackage(packageContents, packageWeight, { from: accounts[0] });

    assert.equal(1, await packageTokenInstance.balanceOf.call(accounts[0]), "The specified account does not own the correct amount of package tokens.");
    assert.equal(accounts[0], await packageTokenInstance.ownerOf.call(1), "The specified account does not own the newly minted package token.");

    const packageTokenData = await packageTokenInstance.packageData.call(1);

    assert.equal(packageContents, packageTokenData[0], "The package token was not initialised with the correct description.");
    assert.equal(packageWeight, packageTokenData[1], "The package token was not initialised with the correct weight.");
  });

  it("should not accept unknown ERC721 tokens", async () => {
    const deliveryCoordinatorInstance = await DeliveryCoordinator.deployed();
    const dummyERC721 = await PackageToken.new({ from: accounts[0] });

    // TODO - Get the token id as returned from these calls
    await dummyERC721.createPackage(accounts[0], "test", "test");

    await expectRevert(dummyERC721.safeTransferFrom(accounts[0], deliveryCoordinatorInstance.address, 1), "ERC721 received is not from known token address");
  });

  it("should correctly issue a receipt token", async () => {
    const packageContents = "Box of test stuff";
    const packageWeight = "10kg";

    const deliveryCoordinatorInstance = await DeliveryCoordinator.deployed();
    const packageTokenInstance = await PackageToken.deployed();
    const receiptTokenInstance = await ReceiptToken.deployed();

    // TODO - Get the token id as returned from these calls
    await deliveryCoordinatorInstance.createPackage(packageContents, packageWeight, { from: accounts[0] });
    await packageTokenInstance.safeTransferFrom(accounts[0], deliveryCoordinatorInstance.address, 1);

    assert.equal(1, await packageTokenInstance.balanceOf.call(deliveryCoordinatorInstance.address), "The delivery coordinator does not own the correct amount of package tokens.");
    assert.equal(deliveryCoordinatorInstance.address, await packageTokenInstance.ownerOf.call(1), "The delivery coordinator does not own the recently transferred package token.");

    assert.equal(1, await receiptTokenInstance.balanceOf.call(accounts[0]), "The specified account does not own the correct amount of receipt tokens.");
    assert.equal(accounts[0], await receiptTokenInstance.ownerOf.call(1), "The specified account does not own the newly minted receipt token.");

    const receiptTokenData = await receiptTokenInstance.receiptData.call(1);

    assert.equal(1, receiptTokenData, "The receipt token was not initialised with the correct package token id.");
  });

});
