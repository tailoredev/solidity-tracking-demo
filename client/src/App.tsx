import React, { Component } from 'react';
import { AbiItem } from 'web3-utils';
import Web3 from 'web3';
import { ContractObject } from '@truffle/contract-schema';
import DeliveryCoordinatorContract from './contracts/DeliveryCoordinator.json';
import DeliveryNodeContract from './contracts/DeliveryNode.json';
import PackageTokenContract from './contracts/PackageToken.json';
import ReceiptTokenContract from './contracts/ReceiptToken.json';
import getWeb3 from './getWeb3';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import PackageTokenData from './model/PackageTokenData';
import ReceiptTokenData from './model/ReceiptTokenData';

// TODO - Split this component up into smaller, logical components
class App extends Component {
  newDeliveryNodeName = '';
  newPackageContents = '';
  newPackageWeight = '';

  constructor(props: any) {
    super(props);

    this.state = {};
  }

  async connectWallet() {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3() as Web3;

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      // web3.eth.defaultAccount = accounts[0];

      // Get the contract instance.
      const networkId = (await web3.eth.net.getId()).toString();
      const deliveryCoordinatorContract = (DeliveryCoordinatorContract as ContractObject);
      const deployedNetwork = deliveryCoordinatorContract.networks
        ? deliveryCoordinatorContract.networks[networkId] : undefined;

      const deliveryCoordinatorInstance = new web3.eth.Contract(
        DeliveryCoordinatorContract.abi as AbiItem[],
        deployedNetwork && deployedNetwork.address
      );

      const packageTokenInstance = new web3.eth.Contract(
        PackageTokenContract.abi as AbiItem[],
        await deliveryCoordinatorInstance.methods.packageToken().call()
      );

      const receiptTokenInstance = new web3.eth.Contract(
        ReceiptTokenContract.abi as AbiItem[],
        await deliveryCoordinatorInstance.methods.receiptToken().call()
      );

      this.setState({
        web3,
        accounts,
        deliveryCoordinatorInstance,
        packageTokenInstance,
        receiptTokenInstance
      });

      await this.refreshDeliveryNodes();
      await this.refreshPackageTokens();
      await this.refreshReceiptTokens();
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        'Failed to load web3, accounts, or contract. Check console for details.'
      );
      console.error(error);
    }
  }

  async addDeliveryNode() {
    const {
      accounts,
      deliveryCoordinatorInstance: deployedDeliveryCoordinatorContract
    } = this.state as any;

    await deployedDeliveryCoordinatorContract.methods.addDeliveryNode(this.newDeliveryNodeName)
      .send({ from: accounts[0] });

    await this.refreshDeliveryNodes();
  }

  async createPackage() {
    const {
      accounts,
      deliveryCoordinatorInstance: deployedDeliveryCoordinatorContract
    } = this.state as any;

    await deployedDeliveryCoordinatorContract.methods
      .createPackage(this.newPackageContents, this.newPackageWeight).send({ from: accounts[0] });

    await this.refreshPackageTokens();
  }

  async sendPackageToken(packageTokenId: number | undefined) {
    const {
      accounts,
      deliveryCoordinatorInstance: deployedDeliveryCoordinatorContract,
      packageTokenInstance: deployedPackageTokenContract
    } = this.state as any;

    if (packageTokenId) {
      await deployedPackageTokenContract.methods
        .safeTransferFrom(
          accounts[0],
          deployedDeliveryCoordinatorContract.options.address,
          packageTokenId
        ).send({ from: accounts[0] });

      await this.refreshPackageTokens();
      await this.refreshReceiptTokens();
    }
  }

  async redeemReceiptToken(receiptTokenId: number | undefined) {
    // TODO - Pending implementation
  }

  private async refreshDeliveryNodes() {
    const {
      web3,
      deliveryCoordinatorInstance: deployedDeliveryCoordinatorContract
    } = this.state as any;

    const deliveryNodeInstances = [];
    // TODO - The names should be rendered by a separate component and not stored in the state
    const deliveryNodeNames = [];

    const numberOfDeliveryNodes = await deployedDeliveryCoordinatorContract.methods
      .numberOfDeliveryNodes().call();

    for (let idx = 0; idx < numberOfDeliveryNodes; idx += 1) {
      const deliveryNodeAddress = await deployedDeliveryCoordinatorContract.methods
        .deliveryNodes(idx).call();
      const deliveryNodeInstance = new web3.eth.Contract(
        DeliveryNodeContract.abi,
        deliveryNodeAddress
      );

      deliveryNodeInstances.push(deliveryNodeInstance);
      deliveryNodeNames.push(await deliveryNodeInstance.methods.name().call());
    }

    this.setState({
      deliveryNodeNames
    });
  }

  private async refreshPackageTokens() {
    const {
      accounts,
      packageTokenInstance: deployedPackageTokenContract
    } = this.state as any;

    const ownedPackageTokens = [];
    let numberOfPackageTokensOwned = 0;

    try {
      numberOfPackageTokensOwned = await deployedPackageTokenContract.methods
        .balanceOf(accounts[0]).call();
    } catch (error) {
      console.log('Error determining account package token balance', error);
    }

    if (numberOfPackageTokensOwned > 0) {
      for (let idx = 0; idx < numberOfPackageTokensOwned; idx += 1) {
        const packageTokenId = await deployedPackageTokenContract.methods
          .tokenOfOwnerByIndex(accounts[0], idx).call();

        const packageInfo = await deployedPackageTokenContract.methods
          .packageData(packageTokenId).call();

        const packageData = new PackageTokenData(
          packageTokenId,
          packageInfo.packageContents,
          packageInfo.packageWeight
        );

        ownedPackageTokens.push(packageData);
      }
    }

    this.setState({
      ownedPackageTokens
    });
  }

  private async refreshReceiptTokens() {
    const {
      accounts,
      receiptTokenInstance: deployedReceiptTokenContract
    } = this.state as any;

    const ownedReceiptTokens = [];
    let numberOfReceiptTokensOwned = 0;

    try {
      numberOfReceiptTokensOwned = await deployedReceiptTokenContract.methods
        .balanceOf(accounts[0]).call();
    } catch (error) {
      console.log('Error determining account receipt token balance', error);
    }

    if (numberOfReceiptTokensOwned > 0) {
      for (let idx = 0; idx < numberOfReceiptTokensOwned; idx += 1) {
        const packageTokenId = await deployedReceiptTokenContract.methods
          .tokenOfOwnerByIndex(accounts[0], idx).call();

        const correspondingPackageTokenId = await deployedReceiptTokenContract.methods
          .receiptData(packageTokenId).call();

        const receiptData = new ReceiptTokenData(
          packageTokenId,
          correspondingPackageTokenId
        );

        ownedReceiptTokens.push(receiptData);
      }
    }

    this.setState({
      ownedReceiptTokens
    });
  }

  render() {
    const {
      web3,
      deliveryCoordinatorInstance,
      packageTokenInstance,
      receiptTokenInstance,
      deliveryNodeNames,
      ownedPackageTokens,
      ownedReceiptTokens
    } = this.state as any;

    if (!web3) {
      return (
        <div className="app">
          <br />
          <button type="button" className="btn btn-light text-dark" onClick={() => this.connectWallet()}>Connect wallet</button>
        </div>
      );
    }

    return (
      <div className="app">
        <br />
        <h1>Blockchain Package Tracking Demo</h1>
        <br />
        <div>
          The delivery coordinator contract is deployed at:
          {` ${deliveryCoordinatorInstance.options.address}`}
        </div>
        <div>
          The package token contract is deployed at:
          {` ${packageTokenInstance.options.address}`}
        </div>
        <div>
          The receipt token contract is deployed at:
          {` ${receiptTokenInstance.options.address}`}
        </div>
        <br />
        <h2>Nodes Available</h2>
        <div>
          {deliveryNodeNames
          && deliveryNodeNames.map((name: string, idx: number) => (<li key={idx}>{name}</li>))}
        </div>
        <h2>Add Node</h2>
        <br />
        <input
          type="text"
          placeholder="Enter node name"
          onChange={(event) => { this.newDeliveryNodeName = event.target.value; }}
        />
        <br />
        <br />
        <button type="button" className="btn btn-light text-dark" onClick={() => this.addDeliveryNode()}>Add node</button>
        <br />
        <h2>Create Package</h2>
        <br />
        <input
          type="text"
          placeholder="Package contents"
          onChange={(event) => { this.newPackageContents = event.target.value; }}
        />
        <br />
        <input
          type="text"
          placeholder="Package weight"
          onChange={(event) => { this.newPackageWeight = event.target.value; }}
        />
        <br />
        <button type="button" className="btn btn-light text-dark" onClick={() => this.createPackage()}>Create package</button>
        <br />
        <h2>Current Packages</h2>
        <div>
          {ownedPackageTokens
          && ownedPackageTokens.map((packageTokenData: PackageTokenData, idx: number) => (
            <>
              <li key={idx}>
                {` ${packageTokenData.tokenId}: ${packageTokenData.packageContents} ${packageTokenData.packageWeight}`}
              </li>
              <button type="button" className="btn btn-light text-dark" onClick={() => this.sendPackageToken(packageTokenData.tokenId)}>Send package</button>
            </>
          ))}
        </div>
        <h2>Current Receipts</h2>
        <div>
          {ownedReceiptTokens
          && ownedReceiptTokens.map((receiptTokenData: ReceiptTokenData, idx: number) => (
            <>
              <li key={idx}>
                {` ${receiptTokenData.tokenId}: ${receiptTokenData.correspondingPackageTokenId}`}
              </li>
              <button type="button" className="btn btn-light text-dark" onClick={() => this.redeemReceiptToken(receiptTokenData.tokenId)}>Redeem</button>
            </>
          ))}
        </div>
      </div>
    );
  }
}

export default App;
