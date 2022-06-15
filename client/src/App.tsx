import React, { useEffect, useRef, useState } from 'react';
import { AbiItem } from 'web3-utils';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
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
import DeliveryNodeData from './model/DeliveryNodeData';

// TODO - Split this component up into smaller, logical components
function App() {
  const [web3, setWeb3] = useState<Web3 | undefined>(undefined);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [deliveryCoordinatorInstance,
    setDeliveryCoordinatorInstance] = useState<Contract | undefined>(undefined);
  const [packageTokenInstance, setPackageTokenInstance] = useState<Contract | undefined>(undefined);
  const [receiptTokenInstance, setReceiptTokenInstance] = useState<Contract | undefined>(undefined);
  const [deliveryNodeInstances, setDeliveryNodeInstances] = useState<DeliveryNodeData[]>([]);
  const [ownedPackageTokens,
    setOwnedPackageTokens] = useState<PackageTokenData[] | undefined>(undefined);
  const [ownedReceiptTokens,
    setOwnedReceiptTokens] = useState<ReceiptTokenData[] | undefined>(undefined);

  const deliveryNodeNameRef = useRef<HTMLInputElement>(null);
  const packageContentsRef = useRef<HTMLInputElement>(null);
  const packageWeightRef = useRef<HTMLInputElement>(null);
  const destinationAddressRef = useRef<HTMLInputElement>(null);

  function getAddressName(address: string): string {
    if (accounts[0] === address) {
      return 'You!';
    }

    if (deliveryCoordinatorInstance && deliveryCoordinatorInstance.options.address === address) {
      return 'Delivery Coordinator';
    }

    if (deliveryNodeInstances && deliveryNodeInstances.length > 0) {
      const matchingNodeInstance = deliveryNodeInstances.find(
        (deliveryNodeInstance: DeliveryNodeData) => deliveryNodeInstance.nodeAddress === address
      );

      if (matchingNodeInstance && matchingNodeInstance.nodeName) {
        return matchingNodeInstance.nodeName;
      }
    }

    return address;
  }

  useEffect(() => {
    const refreshDeliveryNodes = async () => {
      if (!web3 || !deliveryCoordinatorInstance) {
        return;
      }

      const deployedDeliveryNodeInstances = [];

      const numberOfDeliveryNodes = await deliveryCoordinatorInstance.methods
        .numberOfDeliveryNodes().call();

      for (let idx = 0; idx < numberOfDeliveryNodes; idx += 1) {
        const deliveryNodeAddress = await deliveryCoordinatorInstance.methods
          .deliveryNodes(idx).call();

        const deliveryNodeInstance = new web3.eth.Contract(
          DeliveryNodeContract.abi as AbiItem[],
          deliveryNodeAddress
        );

        const deliveryNodeName = await deliveryNodeInstance.methods.name().call();
        const deliveryNodeStatusIndex = await deliveryNodeInstance.methods.status().call();
        const deliveryNodeStatus = DeliveryNodeData.STATUS[deliveryNodeStatusIndex];

        const deliveryNodeData = new DeliveryNodeData(
          deliveryNodeName,
          deliveryNodeStatus,
          deliveryNodeAddress
        );

        deployedDeliveryNodeInstances.push(deliveryNodeData);
      }

      setDeliveryNodeInstances(deployedDeliveryNodeInstances);
    };

    refreshDeliveryNodes();
  }, [deliveryCoordinatorInstance]);

  useEffect(() => {
    const refreshPackageTokens = async () => {
      if (!packageTokenInstance) {
        return;
      }

      const ownedPackageTokensToSet = [];
      let totalNumberOfPackageTokens = 0;

      try {
        totalNumberOfPackageTokens = await packageTokenInstance.methods
          .totalSupply().call();
      } catch (error) {
        console.log('Error determining total package token balance', error);
      }

      if (totalNumberOfPackageTokens > 0) {
        for (let idx = 0; idx < totalNumberOfPackageTokens; idx += 1) {
          const packageTokenId = await packageTokenInstance.methods
            .tokenByIndex(idx).call();

          const tokenOwnerAddress = await packageTokenInstance.methods
            .ownerOf(packageTokenId).call();

          const packageInfo = await packageTokenInstance.methods
            .packageData(packageTokenId).call();

          const packageData = new PackageTokenData(
            packageTokenId,
            packageInfo.packageContents,
            packageInfo.packageWeight,
            tokenOwnerAddress,
            getAddressName(tokenOwnerAddress)
          );

          ownedPackageTokensToSet.push(packageData);
        }
      }

      setOwnedPackageTokens(ownedPackageTokensToSet);
    };

    refreshPackageTokens();
  }, [packageTokenInstance]);

  useEffect(() => {
    const refreshReceiptTokens = async () => {
      if (!receiptTokenInstance) {
        return;
      }

      const ownedReceiptTokensToSet = [];
      let totalNumberOfReceiptTokens = 0;

      try {
        totalNumberOfReceiptTokens = await receiptTokenInstance.methods
          .totalSupply().call();
      } catch (error) {
        console.log('Error determining total receipt token balance', error);
      }

      if (totalNumberOfReceiptTokens > 0) {
        for (let idx = 0; idx < totalNumberOfReceiptTokens; idx += 1) {
          const receiptTokenId = await receiptTokenInstance.methods
            .tokenByIndex(idx).call();

          const tokenOwnerAddress = await receiptTokenInstance.methods
            .ownerOf(receiptTokenId).call();

          const correspondingPackageTokenId = await receiptTokenInstance.methods
            .receiptData(receiptTokenId).call();

          const receiptData = new ReceiptTokenData(
            receiptTokenId,
            correspondingPackageTokenId,
            tokenOwnerAddress,
            getAddressName(tokenOwnerAddress)
          );

          ownedReceiptTokensToSet.push(receiptData);
        }
      }

      setOwnedReceiptTokens(ownedReceiptTokensToSet);
    };

    refreshReceiptTokens();
  }, [receiptTokenInstance]);

  async function connectWallet() {
    try {
      // Get network provider and web3 instance.
      const web3Instance = await getWeb3() as Web3;

      // Use web3 to get the user's accounts.
      const web3Accounts = await web3Instance.eth.getAccounts();
      // web3.eth.defaultAccount = accounts[0];

      // Get the contract instance.
      const networkId = (await web3Instance.eth.net.getId()).toString();
      const deliveryCoordinatorContract = (DeliveryCoordinatorContract as ContractObject);
      const deployedNetwork = deliveryCoordinatorContract.networks
        ? deliveryCoordinatorContract.networks[networkId] : undefined;

      const deployedDeliveryCoordinatorInstance = new web3Instance.eth.Contract(
        DeliveryCoordinatorContract.abi as AbiItem[],
        deployedNetwork && deployedNetwork.address
      );

      const deployedPackageTokenInstance = new web3Instance.eth.Contract(
        PackageTokenContract.abi as AbiItem[],
        await deployedDeliveryCoordinatorInstance.methods.packageToken().call()
      );

      const deployedReceiptTokenInstance = new web3Instance.eth.Contract(
        ReceiptTokenContract.abi as AbiItem[],
        await deployedDeliveryCoordinatorInstance.methods.receiptToken().call()
      );

      setWeb3(web3Instance);
      setAccounts(web3Accounts);
      setDeliveryCoordinatorInstance(deployedDeliveryCoordinatorInstance);
      setPackageTokenInstance(deployedPackageTokenInstance);
      setReceiptTokenInstance(deployedReceiptTokenInstance);

      // await refreshDeliveryNodes();
      // await refreshPackageTokens();
      // await refreshReceiptTokens();
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        'Failed to load web3, accounts, or contract. Check console for details.'
      );
      console.error(error);
    }
  }

  async function addDeliveryNode() {
    if (!deliveryCoordinatorInstance || !deliveryNodeNameRef.current) {
      return;
    }

    await deliveryCoordinatorInstance.methods
      .addDeliveryNode(deliveryNodeNameRef.current.value)
      .send({ from: accounts[0] });

    // await refreshDeliveryNodes();

    deliveryNodeNameRef.current.value = '';
  }

  async function createPackage() {
    if (!deliveryCoordinatorInstance || !packageContentsRef.current || !packageWeightRef.current) {
      return;
    }

    await deliveryCoordinatorInstance.methods.createPackage(
      packageContentsRef.current.value,
      packageWeightRef.current.value
    ).send({ from: accounts[0] });

    // await refreshPackageTokens();

    packageContentsRef.current.value = '';
    packageWeightRef.current.value = '';
  }

  async function sendPackageToken(packageTokenId: number | undefined) {
    if (!packageTokenInstance || !deliveryCoordinatorInstance) {
      return;
    }

    if (packageTokenId) {
      const currentPackageOwner = await packageTokenInstance.methods
        .ownerOf(packageTokenId).call();

      // Ensure this is a known address
      if (getAddressName(currentPackageOwner) !== currentPackageOwner) {
        if (currentPackageOwner === accounts[0]) {
          const destinationAddress = destinationAddressRef.current ? destinationAddressRef.current.value : '';
          if (Web3.utils.isAddress(destinationAddress)) {
            await packageTokenInstance.methods['safeTransferFrom(address,address,uint256,bytes)'](
              accounts[0],
              deliveryCoordinatorInstance.options.address,
              packageTokenId,
              Web3.utils.hexToBytes(destinationAddress)
            ).send({ from: accounts[0] });
          } else {
            await packageTokenInstance.methods.safeTransferFrom(
              accounts[0],
              deliveryCoordinatorInstance.options.address,
              packageTokenId
            ).send({ from: accounts[0] });
          }

          if (destinationAddressRef.current) {
            destinationAddressRef.current.value = '';
          }
        } else { // The token is owned by either the delivery coordinator or a delivery node
          // TODO - This should rather be user selectable via a filtered drop down
          const randomDeliveryNodeIndex = Math.floor(Math.random() * deliveryNodeInstances.length);
          const destinationNode = deliveryNodeInstances[randomDeliveryNodeIndex];

          await deliveryCoordinatorInstance.methods.forwardPackage(
            destinationNode.nodeAddress,
            packageTokenId
          ).send({ from: accounts[0] });
        }

        // await refreshPackageTokens();
        // await refreshReceiptTokens();
      }
    }
  }

  async function redeemReceiptToken(receiptTokenId: number | undefined) {
    if (!receiptTokenInstance || !deliveryCoordinatorInstance) {
      return;
    }

    if (receiptTokenId) {
      await receiptTokenInstance.methods
        .safeTransferFrom(
          accounts[0],
          deliveryCoordinatorInstance.options.address,
          receiptTokenId
        ).send({ from: accounts[0] });

      // await refreshPackageTokens();
      // await refreshReceiptTokens();
    }
  }

  if (!web3) {
    return (
      <div className="app">
        <br />
        <button type="button" className="btn btn-light text-dark" onClick={() => connectWallet()}>Connect wallet</button>
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
        {` ${deliveryCoordinatorInstance ? deliveryCoordinatorInstance.options.address : 'No delivery coordinator instance was found'}`}
      </div>
      <div>
        The package token contract is deployed at:
        {` ${packageTokenInstance ? packageTokenInstance.options.address : 'No package token instance was found'}`}
      </div>
      <div>
        The receipt token contract is deployed at:
        {` ${receiptTokenInstance ? receiptTokenInstance.options.address : 'No receipt token instance was found'}`}
      </div>
      <br />
      <h2>Nodes Available</h2>
      <div>
        {deliveryNodeInstances
        && deliveryNodeInstances.map((deliveryNodeData: DeliveryNodeData) => (
          <li key={deliveryNodeData.nodeAddress}>
            {` ${deliveryNodeData.nodeName} - ${deliveryNodeData.nodeStatus} - ${deliveryNodeData.nodeAddress}`}
          </li>
        ))}
      </div>
      <h2>Add Node</h2>
      <br />
      <input
        type="text"
        placeholder="Enter node name"
        ref={deliveryNodeNameRef}
      />
      <br />
      <br />
      <button type="button" className="btn btn-light text-dark" onClick={() => addDeliveryNode()}>Add node</button>
      <br />
      <h2>Create Package</h2>
      <br />
      <input
        type="text"
        placeholder="Package contents"
        ref={packageContentsRef}
      />
      <br />
      <input
        type="text"
        placeholder="Package weight"
        ref={packageWeightRef}
      />
      <br />
      <button type="button" className="btn btn-light text-dark" onClick={() => createPackage()}>Create package</button>
      <br />
      <h2>Current Packages</h2>
      <div>
        {ownedPackageTokens
        && ownedPackageTokens.map((packageTokenData: PackageTokenData) => (
          <>
            <li key={packageTokenData.tokenId}>
              {`Token ID: ${packageTokenData.tokenId} - ${packageTokenData.packageContents} - ${packageTokenData.packageWeight} - Owner: ${packageTokenData.owner}`}
            </li>
            <button type="button" className="btn btn-light text-dark" onClick={() => sendPackageToken(packageTokenData.tokenId)}>Send package</button>
          </>
        ))}
      </div>
      <br />
      <input
        type="text"
        placeholder="Destination address"
        ref={destinationAddressRef}
      />
      <h2>Current Receipts</h2>
      <div>
        {ownedReceiptTokens
        && ownedReceiptTokens.map((receiptTokenData: ReceiptTokenData) => (
          <>
            <li key={receiptTokenData.tokenId}>
              {`Token ID: ${receiptTokenData.tokenId} - Corresponding Package Token ID: ${receiptTokenData.correspondingPackageTokenId} - Owner: ${receiptTokenData.owner}`}
            </li>
            <button type="button" className="btn btn-light text-dark" onClick={() => redeemReceiptToken(receiptTokenData.tokenId)}>Redeem</button>
          </>
        ))}
      </div>
    </div>
  );
}

export default App;
