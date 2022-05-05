import React, { Component } from "react";
import DeliveryCoordinatorContract from "./contracts/DeliveryCoordinator.json";
import DeliveryNodeContract from "./contracts/DeliveryNode.json";
import PackageTokenContract from "./contracts/PackageToken.json";
import ReceiptTokenContract from "./contracts/ReceiptToken.json";
import getWeb3 from "./getWeb3";

import "./App.css";
import 'bootstrap/dist/css/bootstrap.min.css';

//TODO - Split this component up into smaller, logical components
class App extends Component {

  state = {};
  newDeliveryNodeName = "";

  connectWallet = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      web3.eth.defaultAccount = accounts[0];

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = DeliveryCoordinatorContract.networks[networkId];
      const deliveryCoordinatorInstance = new web3.eth.Contract(
        DeliveryCoordinatorContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      const packageTokenInstance = new web3.eth.Contract(
        PackageTokenContract.abi,
        await deliveryCoordinatorInstance.methods.packageToken().call()
      );

      const receiptTokenInstance = new web3.eth.Contract(
        ReceiptTokenContract.abi,
        await deliveryCoordinatorInstance.methods.receiptToken().call()
      );

      const deliveryNodeInstances = [];
      const deliveryNodeNames = []; // TODO - The names should be rendered by a separate component and not stored in the state

      const numberOfDeliveryNodes = await deliveryCoordinatorInstance.methods.numberOfDeliveryNodes().call();

      for (let idx = 0; idx < numberOfDeliveryNodes; idx++) {
        const deliveryNodeAddress =  await deliveryCoordinatorInstance.methods.deliveryNodes(idx).call();
        const deliveryNodeInstance = new web3.eth.Contract(
          DeliveryNodeContract.abi,
          deliveryNodeAddress
        );

        deliveryNodeInstances.push(deliveryNodeInstance);
        deliveryNodeNames.push(await deliveryNodeInstance.methods.name().call());
      }

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ 
        web3: web3,
        accounts: accounts,
        deliveryCoordinatorContract : deliveryCoordinatorInstance,
        packageTokenContract : packageTokenInstance,
        receiptTokenContract : receiptTokenInstance,
        deliveryNodeContracts : deliveryNodeInstances,
        deliveryNodeNames :  deliveryNodeNames
      });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  addDeliveryNode = async () => {
    const accounts = this.state.accounts;
    const deployedDeliveryCoordinatorContract = this.state.deliveryCoordinatorContract;

    await deployedDeliveryCoordinatorContract.methods.addDeliveryNode(this.newDeliveryNodeName).send({ from: accounts[0] });

    const deliveryNodeInstances = [];
    const deliveryNodeNames = [];

    const numberOfDeliveryNodes = await deployedDeliveryCoordinatorContract.methods.numberOfDeliveryNodes().call();

    for (let idx = 0; idx < numberOfDeliveryNodes; idx++) {
      const deliveryNodeAddress =  await deployedDeliveryCoordinatorContract.methods.deliveryNodes(idx).call();
      const deliveryNodeInstance = new this.state.web3.eth.Contract(
        DeliveryNodeContract.abi,
        deliveryNodeAddress
      );

      deliveryNodeInstances.push(deliveryNodeInstance);
      deliveryNodeNames.push(await deliveryNodeInstance.methods.name().call());
    }

    this.setState((previousState) => ({
      web3 : previousState.web3,
      accounts : previousState.accounts,
      deliveryCoordinatorContract : previousState.deliveryCoordinatorContract,
      packageTokenContract : previousState.packageTokenContract,
      receiptTokenContract : previousState.receiptTokenContract,
      deliveryNodeContracts : deliveryNodeInstances,
      deliveryNodeNames : deliveryNodeNames
    }));
  };

  render() {
    if (!this.state.web3) {
      return (
      <div className="app">
        <br/>
        <button className="btn btn-light text-dark" onClick={this.connectWallet}>Connect wallet</button>
      </div>
      );
    }

    return (
      <div className="app">
        <br/>
        <h1>Blockchain Package Tracking Demo</h1>
        <br/>
        <div>The delivery coordinator contract is deployed at: {this.state.deliveryCoordinatorContract.options.address}</div>
        <div>The package token contract is deployed at: {this.state.packageTokenContract.options.address}</div>
        <div>The receipt token contract is deployed at: {this.state.receiptTokenContract.options.address}</div>
        <br/>
        <h2>Nodes Available</h2>
        <div>
        {this.state.deliveryNodeNames.map((name, idx) => {
          return (<li key={idx}>{name}</li>);
        })}
        </div>
        <h2>Add Node</h2>
        <br/>
        <input
          type='text'
          placeholder='Enter node name'
          onChange={(event) => this.newDeliveryNodeName = event.target.value}
        />
        <br/>
        <br/>
        <button className="btn btn-light text-dark" onClick={this.addDeliveryNode}>Add node</button>
      </div>
    );
  }
}

export default App;
