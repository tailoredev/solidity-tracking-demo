import React, { Component } from "react";
import DeliveryCoordinatorContract from "./contracts/DeliveryCoordinator.json";
import DeliveryNodeContract from "./contracts/DeliveryNode.json";
import PackageTokenContract from "./contracts/PackageToken.json";
import ReceiptTokenContract from "./contracts/ReceiptToken.json";
import getWeb3 from "./getWeb3";

import "./App.css";
import 'bootstrap/dist/css/bootstrap.min.css';
class App extends Component {
  state = { storageValue: 0, web3: null, accounts: null, contract: null };

  connectWallet = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

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

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts,
        deliveryCoordinatorContract : deliveryCoordinatorInstance,
        packageTokenContract : packageTokenInstance,
        receiptTokenContract : receiptTokenInstance });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  render() {
    if (!this.state.web3) {
      return <button className="btn btn-light text-dark" onClick={this.connectWallet}>Connect wallet</button>;
    }
    return (
      <div className="App">
        <h1>Blockchain Package Tracking Demo</h1>
        <br/>
        <div>The delivery coordinator contract is deployed at: {this.state.deliveryCoordinatorContract.options.address}</div>
        <div>The package token contract is deployed at: {this.state.packageTokenContract.options.address}</div>
        <div>The receipt token contract is deployed at: {this.state.receiptTokenContract.options.address}</div>
      </div>
    );
  }
}

export default App;
