const {expectRevert} = require('@openzeppelin/test-helpers');

const DeliveryCoordinator = artifacts.require("./DeliveryCoordinator.sol");
const DeliveryNode = artifacts.require("./DeliveryNode.sol");
const PackageToken = artifacts.require("./PackageToken.sol");

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

    await deliveryCoordinatorInstance.createPackage(packageContents, packageWeight, { from: accounts[0] });

    assert.equal(1, await packageTokenInstance.balanceOf.call(accounts[0]), "The specified account does not own the correct amount of package tokens.");
    assert.equal(accounts[0], await packageTokenInstance.ownerOf.call(1), "The specified account does not own the newly minted package token.");

    const packageTokenData = await packageTokenInstance.packageData.call(1);

    assert.equal(packageContents, packageTokenData[0], "The package token was not initialised with the correct description.");
    assert.equal(packageWeight, packageTokenData[1], "The package token was not initialised with the correct weight.");
  });

});
