const {expectRevert} = require('@openzeppelin/test-helpers');

const DeliveryCoordinator = artifacts.require("./DeliveryCoordinator.sol");
const DeliveryNode = artifacts.require("./DeliveryNode.sol");

contract("DeliveryCoordinator", accounts => {

  it("should not allow non-owner addresses to add nodes", async () => {
    const deliveryCoordinatorInstance = await DeliveryCoordinator.deployed();

    await expectRevert(deliveryCoordinatorInstance.addDeliveryNode("Testville", { from: accounts[1] }), "Ownable: caller is not the owner");
  });

  it("should deploy additional delivery nodes", async () => {
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

});
