const {expectRevert} = require('@openzeppelin/test-helpers');

const DeliveryCoordinator = artifacts.require("./DeliveryCoordinator.sol");
const DeliveryNode = artifacts.require("./DeliveryNode.sol");
const PackageToken = artifacts.require("./PackageToken.sol");
const ReceiptToken = artifacts.require("./ReceiptToken.sol");

// TODO - Update this test to use mock contracts so as to not test the behaviour of contracts which have their own tests
contract("DeliveryCoordinator", accounts => {

  const zeroAddress = '0x0000000000000000000000000000000000000000';

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

  it("should correctly return the number of delivery nodes", async () => {
    const deliveryCoordinatorInstance = await DeliveryCoordinator.deployed();

    assert.equal(2, await deliveryCoordinatorInstance.numberOfDeliveryNodes.call(), "The incorrect number of delivery nodes as returned.");    
  });

  it("should correctly issue a package token", async () => {
    const packageContents = "Box of test stuff";
    const packageWeight = "10kg";

    const deliveryCoordinatorInstance = await DeliveryCoordinator.deployed();
    const packageTokenInstance = await PackageToken.at(await deliveryCoordinatorInstance.packageToken.call());

    const packageTokenId = await deliveryCoordinatorInstance.createPackage.call(packageContents, packageWeight, { from: accounts[0] });
    await deliveryCoordinatorInstance.createPackage(packageContents, packageWeight, { from: accounts[0] });

    assert.equal(accounts[0], await packageTokenInstance.ownerOf.call(packageTokenId), "The specified account does not own the newly minted package token.");

    const packageTokenData = await packageTokenInstance.packageData.call(packageTokenId);

    assert.equal(packageContents, packageTokenData[0], "The package token was not initialised with the correct description.");
    assert.equal(packageWeight, packageTokenData[1], "The package token was not initialised with the correct weight.");
  });

  it("should not forward packages to unknown addresses", async () => {
    const deliveryCoordinatorInstance = await DeliveryCoordinator.deployed();

    await expectRevert(deliveryCoordinatorInstance.forwardPackage(accounts[1], 0, { from: accounts[0] }), "The provided destination address is not that of a known delivery node");
  });

  it("should not interact with packages that are not owned by either the delivery coordinator or a known delivery node", async () => {
    const testNodeName = "Testville";
    const packageContents = "Box of test stuff";
    const packageWeight = "10kg";

    const deliveryCoordinatorInstance = await DeliveryCoordinator.deployed();
    const packageTokenInstance = await PackageToken.at(await deliveryCoordinatorInstance.packageToken.call());

    await deliveryCoordinatorInstance.addDeliveryNode(testNodeName, { from: accounts[0] });
    const deliveryNode = await DeliveryNode.at(await deliveryCoordinatorInstance.deliveryNodes.call(0));

    const packageTokenId = await deliveryCoordinatorInstance.createPackage.call(packageContents, packageWeight, { from: accounts[0] });
    await deliveryCoordinatorInstance.createPackage(packageContents, packageWeight, { from: accounts[0] });

    assert.equal(accounts[0], await packageTokenInstance.ownerOf.call(packageTokenId), "The specified account does not own the newly minted package token.");

    await expectRevert(deliveryCoordinatorInstance.forwardPackage(deliveryNode.address, packageTokenId, { from: accounts[0] }),
      "The package token is neither held by the delivery coordinator, nor a known delivery node");
  });

  it("should forward packages from the delivery coordinator", async () => {
    const testNodeName = "Testville";
    const packageContents = "Box of test stuff";
    const packageWeight = "10kg";

    const deliveryCoordinatorInstance = await DeliveryCoordinator.deployed();
    const packageTokenInstance = await PackageToken.at(await deliveryCoordinatorInstance.packageToken.call());

    await deliveryCoordinatorInstance.addDeliveryNode(testNodeName, { from: accounts[0] });
    const deliveryNode = await DeliveryNode.at(await deliveryCoordinatorInstance.deliveryNodes.call(0));

    const packageTokenId = await deliveryCoordinatorInstance.createPackage.call(packageContents, packageWeight, { from: accounts[0] });
    await deliveryCoordinatorInstance.createPackage(packageContents, packageWeight, { from: accounts[0] });

    assert.equal(accounts[0], await packageTokenInstance.ownerOf.call(packageTokenId), "The specified account does not own the newly minted package token.");

    await packageTokenInstance.safeTransferFrom(accounts[0], deliveryCoordinatorInstance.address, packageTokenId);

    assert.equal(deliveryCoordinatorInstance.address, await packageTokenInstance.ownerOf.call(packageTokenId), "The delivery coordinator does not own the recently transferred package token.");

    await deliveryCoordinatorInstance.forwardPackage(deliveryNode.address, packageTokenId), { from: accounts[0] };

    assert.equal(deliveryNode.address, await packageTokenInstance.ownerOf.call(packageTokenId), "The delivery node does not own the recently forwarded package token.");
  });

  it("should forward packages between delivery nodes", async () => {
    const testNodeOneName = "Testville";
    const testNodeTwoName = "Test City";
    const packageContents = "Box of test stuff";
    const packageWeight = "10kg";

    const deliveryCoordinatorInstance = await DeliveryCoordinator.deployed();
    const packageTokenInstance = await PackageToken.at(await deliveryCoordinatorInstance.packageToken.call());

    await deliveryCoordinatorInstance.addDeliveryNode(testNodeOneName, { from: accounts[0] });
    await deliveryCoordinatorInstance.addDeliveryNode(testNodeTwoName, { from: accounts[0] });

    const firstInitialisedNode = await DeliveryNode.at(await deliveryCoordinatorInstance.deliveryNodes.call(0));
    const secondInitialisedNode = await DeliveryNode.at(await deliveryCoordinatorInstance.deliveryNodes.call(1));

    const packageTokenId = await deliveryCoordinatorInstance.createPackage.call(packageContents, packageWeight, { from: accounts[0] });
    await deliveryCoordinatorInstance.createPackage(packageContents, packageWeight, { from: accounts[0] });

    assert.equal(accounts[0], await packageTokenInstance.ownerOf.call(packageTokenId), "The specified account does not own the newly minted package token.");

    await packageTokenInstance.safeTransferFrom(accounts[0], firstInitialisedNode.address, packageTokenId);

    assert.equal(firstInitialisedNode.address, await packageTokenInstance.ownerOf.call(packageTokenId), "The first delivery node does not own the recently forwarded package token.");

    await deliveryCoordinatorInstance.forwardPackage(secondInitialisedNode.address, packageTokenId), { from: accounts[0] };

    assert.equal(secondInitialisedNode.address, await packageTokenInstance.ownerOf.call(packageTokenId), "The second delivery node does not own the recently forwarded package token.");
  });

  it("should not accept unknown ERC721 tokens", async () => {
    const deliveryCoordinatorInstance = await DeliveryCoordinator.deployed();
    const dummyERC721 = await PackageToken.new({ from: accounts[0] });

    const packageTokenId = await dummyERC721.createPackage.call(accounts[0], "test", "test");
    await dummyERC721.createPackage(accounts[0], "test", "test");

    await expectRevert(
      dummyERC721.safeTransferFrom(accounts[0], deliveryCoordinatorInstance.address, packageTokenId, { from: accounts[0], gas: 5000000, gasPrice: 500000000 }),
      "ERC721 received is not from known token address"
    );
  });

  it("should correctly issue a receipt token", async () => {
    const packageContents = "Box of test stuff";
    const packageWeight = "10kg";

    const deliveryCoordinatorInstance = await DeliveryCoordinator.deployed();
    const packageTokenInstance = await PackageToken.at(await deliveryCoordinatorInstance.packageToken.call());
    const receiptTokenInstance = await ReceiptToken.at(await deliveryCoordinatorInstance.receiptToken.call());

    const packageTokenId = await deliveryCoordinatorInstance.createPackage.call(packageContents, packageWeight, { from: accounts[0] });
    await deliveryCoordinatorInstance.createPackage(packageContents, packageWeight, { from: accounts[0] });
    
    const receipt = await packageTokenInstance.safeTransferFrom(accounts[0], deliveryCoordinatorInstance.address, packageTokenId);
    const receiptTokenId = getReceivedTokenId(receipt, accounts[0], receiptTokenInstance.address);

    assert.equal(deliveryCoordinatorInstance.address, await packageTokenInstance.ownerOf.call(packageTokenId), "The delivery coordinator does not own the recently transferred package token.");
    assert.equal(accounts[0], await receiptTokenInstance.ownerOf.call(receiptTokenId), "The specified account does not own the newly minted receipt token.");

    const receiptTokenData = await receiptTokenInstance.receiptData.call(receiptTokenId);

    assert.equal(packageTokenId.toNumber(), receiptTokenData, "The receipt token was not initialised with the correct package token id.");
  });

  it("should not operate on packages not owned by known delivery nodes", async () => {
    const packageContents = "Box of test stuff";
    const packageWeight = "10kg";

    const deliveryCoordinatorInstance = await DeliveryCoordinator.deployed();
    const packageTokenInstance = await PackageToken.at(await deliveryCoordinatorInstance.packageToken.call());
    const receiptTokenInstance = await ReceiptToken.at(await deliveryCoordinatorInstance.receiptToken.call());

    const packageTokenId = await deliveryCoordinatorInstance.createPackage.call(packageContents, packageWeight, { from: accounts[0] });
    await deliveryCoordinatorInstance.createPackage(packageContents, packageWeight, { from: accounts[0] });
    
    const receipt = await packageTokenInstance.safeTransferFrom(accounts[0], deliveryCoordinatorInstance.address, packageTokenId);
    const receiptTokenId = getReceivedTokenId(receipt, accounts[0], receiptTokenInstance.address);

    assert.equal(deliveryCoordinatorInstance.address, await packageTokenInstance.ownerOf.call(packageTokenId), "The delivery coordinator does not own the recently transferred package token.");
    assert.equal(accounts[0], await receiptTokenInstance.ownerOf.call(receiptTokenId), "The specified account does not own the newly minted receipt token.");

    await expectRevert(
      receiptTokenInstance.safeTransferFrom(accounts[0], deliveryCoordinatorInstance.address, receiptTokenId, { from: accounts[0], gas: 5000000, gasPrice: 500000000 }),
      "The package token is not currently being held by a known delivery node"
    );
  });

  it("should correctly return packages in exchange for valid receipts", async () => {
    const testNodeName = "Testville";
    const packageContents = "Box of test stuff";
    const packageWeight = "10kg";

    const deliveryCoordinatorInstance = await DeliveryCoordinator.deployed();
    const packageTokenInstance = await PackageToken.at(await deliveryCoordinatorInstance.packageToken.call());
    const receiptTokenInstance = await ReceiptToken.at(await deliveryCoordinatorInstance.receiptToken.call());

    await deliveryCoordinatorInstance.addDeliveryNode(testNodeName, { from: accounts[0] });
    const deliveryNode = await DeliveryNode.at(await deliveryCoordinatorInstance.deliveryNodes.call(0));

    const packageTokenId = await deliveryCoordinatorInstance.createPackage.call(packageContents, packageWeight, { from: accounts[0] });
    await deliveryCoordinatorInstance.createPackage(packageContents, packageWeight, { from: accounts[0] });
    
    const receipt = await packageTokenInstance.safeTransferFrom(accounts[0], deliveryCoordinatorInstance.address, packageTokenId);
    const receiptTokenId = getReceivedTokenId(receipt, accounts[0], receiptTokenInstance.address);

    assert.equal(deliveryCoordinatorInstance.address, await packageTokenInstance.ownerOf.call(packageTokenId), "The delivery coordinator does not own the recently transferred package token.");
    assert.equal(accounts[0], await receiptTokenInstance.ownerOf.call(receiptTokenId), "The specified account does not own the newly minted receipt token.");

    await deliveryCoordinatorInstance.forwardPackage(deliveryNode.address, packageTokenId);

    assert.equal(deliveryNode.address, await packageTokenInstance.ownerOf.call(packageTokenId), "The delivery node does not own the recently transferred package token.");

    await receiptTokenInstance.safeTransferFrom(accounts[0], deliveryCoordinatorInstance.address, receiptTokenId);

    assert.equal(accounts[0], await packageTokenInstance.ownerOf.call(packageTokenId), "The specified account does not own the redeemed package token.");
    await expectRevert(receiptTokenInstance.ownerOf.call(receiptTokenId), "owner query for nonexistent token");
  });

  function getReceivedTokenId(receipt, recipientAddress, tokenInstanceAddress) {
    const logEntry = receipt.logs.find(log => {
      return tokenInstanceAddress == log.address && log.args.from == zeroAddress && log.args.to == recipientAddress;
    });

    return logEntry.args.tokenId.toNumber();
  }

});
