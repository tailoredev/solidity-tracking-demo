import Web3 from 'web3';

const getWeb3 = () => new Promise(async (resolve, reject) => {
  const {
    ethereum,
    web3
  } = window as any;

  // Modern dapp browsers...
  if (ethereum) {
    const web3Provider = new Web3(ethereum);
    try {
      // Request account access if needed
      await ethereum.request({ method: 'eth_requestAccounts' });
      // Accounts now exposed
      resolve(web3Provider);
    } catch (error) {
      reject(error);
    }
  } else if (web3) { // Legacy dapp browsers...
    // Use Mist/MetaMask's provider.
    console.log('Injected web3 detected.');
    resolve(web3);
  } else { // Fallback to localhost; use dev console port by default...
    const provider = new Web3.providers.HttpProvider(
      'http://127.0.0.1:8545'
    );
    const web3Provider = new Web3(provider);
    console.log('No web3 instance injected, using Local web3.');
    resolve(web3Provider);
  }
});

export default getWeb3;
