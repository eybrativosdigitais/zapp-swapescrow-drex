require('dotenv').config();
const { ethers, JsonRpcProvider } = require('ethers');
const abi = require('./swapescrow-shield.abi.json');
const erc20Abi = require('./ierc20.abi.json');
const erc1155Abi = require('./erc1155.abi.json');
const axios = require('axios')
const parseCommitments = require('../orchestration/common/parseCommitments')

// Infura provider
const provider = new JsonRpcProvider(process.env.STARLIGHT_RPC_URL);
const senderAddress = process.env.STARLIGHT_SENDER_ADDRESS;
const receiverAddress = process.env.STARLIGHT_RECEIVER_ADDRESS;
const escrowShieldContractAddress = process.env.STARLIGHT_ESCROWSHIELD_ADDRESS
const erc20XContractAddress = ethers.getAddress(process.env.STARLIGHT_ERC20X_ADDRESS);
const erc20YContractAddress = ethers.getAddress(process.env.STARLIGHT_ERC20Y_ADDRESS);
const erc1155ContractAddress = ethers.getAddress(process.env.STARLIGHT_ERC1155_ADDRESS);
const erc1155TokenIds = process.env.STARLIGHT_ERC1155_TOKEN_IDS;
const zappUrlSender = process.env.STARLIGHT_ZAPP_URL_SENDER;
const zappUrlReceiver = process.env.STARLIGHT_ZAPP_URL_RECEIVER;

const tokenSymbols = new Map();

async function main() {
  // Define the contract
  console.log("process.env.STARLIGHT_RPC_URLs: ", process.env.STARLIGHT_RPC_URL);
  const escrowShieldContract = new ethers.Contract(escrowShieldContractAddress, abi, provider);

  const senderPubKey = await escrowShieldContract.zkpPublicKeys(senderAddress);
  console.log("senderPubKey: ", senderPubKey);

  const receiverPubKey = await escrowShieldContract.zkpPublicKeys(receiverAddress);
  console.log("receiverPubKey: ", receiverPubKey);

  const latestRoot = await escrowShieldContract.latestRoot();
  console.log("latestRoot: ", latestRoot);

  const swapIdCounter = await escrowShieldContract.swapIdCounter();
  console.log("swapIdCounter: ", swapIdCounter);

  const existingRoot = await escrowShieldContract.commitmentRoots(9473306376974372932723952268428186307768672883449015423458244653989184026207n);
  console.log("existingRoot: ", existingRoot);

  const erc20XContract = new ethers.Contract(erc20XContractAddress, erc20Abi, provider);
  const erc20YContract = new ethers.Contract(erc20YContractAddress, erc20Abi, provider);
  const erc1155Contract = new ethers.Contract(erc1155ContractAddress, erc1155Abi, provider);

  // Caching token symbols
  tokenSymbols.set(erc20XContractAddress, await erc20XContract.symbol());
  tokenSymbols.set(erc20YContractAddress, await erc20YContract.symbol());

  console.log("\n==PUBLIC BALANCES===========");
  await printERC20Stats(erc20XContract, senderAddress, receiverAddress);
  await printERC20Stats(erc20YContract, senderAddress, receiverAddress);

  const validTokenIds = erc1155TokenIds.split(",").filter(tokenId => !isNaN(parseInt(tokenId)))
  for(const tokenId of validTokenIds) {
    await printERC1155Stats(erc1155Contract, tokenId, senderAddress, receiverAddress)
  }

  console.log("\n==PRIVATE BALANCES==========");
  const [commitmentsSender, commitmentsReceiver] = await Promise.all([
    axios.get(`${zappUrlSender}/getAllCommitments`).then(response => response.data.commitments),
    axios.get(`${zappUrlReceiver}/getAllCommitments`).then(response => response.data.commitments),
  ]);

  const erc20Tokens = [erc20XContractAddress, erc20YContractAddress]
  const balancesSender = parseCommitments(senderAddress, erc20Tokens, validTokenIds)(commitmentsSender)
  const balancesReceiver = parseCommitments(receiverAddress, erc20Tokens, validTokenIds)(commitmentsReceiver)

  erc20Tokens.forEach(address => {
    let balance;
    console.log(`\nERC20: ${tokenSymbols.get(address)} (${address})`);
    balance = balancesSender.balances[address] || 0
    console.log(`Sender:\n  Balance:    ${balance.toString()}`);
    balance = balancesReceiver.balances[address] || 0
    console.log(`Receiver:\n  Balance:    ${balance.toString()}`);
  })

  validTokenIds.forEach(tokenId => {
    let balance;
    console.log(`\nERC1155: TokenId(${tokenId}) (${erc1155ContractAddress})`);
    balance = balancesSender.tokenOwners[tokenId] || 0
    console.log(`Sender:\n  Balance:    ${balance.toString()}`);
    balance = balancesReceiver.tokenOwners[tokenId] || 0
    console.log(`Receiver:\n  Balance:    ${balance.toString()}`);
  })

  const displayRawCommitments = false;
  if (displayRawCommitments) {
    console.log("\n==COMMITMENTS SENDER========");
    console.log(JSON.stringify(commitmentsSender, null, 4));
    console.log("\n==COMMITMENTS RECEIVER======");
    console.log(JSON.stringify(commitmentsReceiver, null, 4));
  }
}

async function printERC20Stats(erc20Contract, senderAddress, receiverAddress) {
  const address = await erc20Contract.getAddress();
  let balance, allowance;

  console.log(`\nERC20: ${tokenSymbols.get(address)} (${address})`);
  balance = await erc20Contract.balanceOf(senderAddress);
  allowance = await erc20Contract.allowance(senderAddress, escrowShieldContractAddress);
  console.log(`Sender:\n  Balance:    ${balance.toString()}\n  Allowance:  ${allowance.toString()}`);
  balance = await erc20Contract.balanceOf(receiverAddress);
  allowance = await erc20Contract.allowance(receiverAddress, escrowShieldContractAddress);
  console.log(`Receiver:\n  Balance:    ${balance.toString()}\n  Allowance:  ${allowance.toString()}`);
}

async function printERC1155Stats(erc1155Contract, tokenId, senderAddress, receiverAddress) {
  let balance, allowance;

  console.log(`\nERC1155: TokenId(${tokenId}) (${await erc1155Contract.getAddress()})`);
  balance = await erc1155Contract.balanceOf(senderAddress, tokenId);
  allowance = await erc1155Contract.isApprovedForAll(senderAddress, escrowShieldContractAddress);
  console.log(`Sender:\n  Balance:    ${balance.toString()}\n  Allowance:  ${allowance.toString()}`);
  balance = await erc1155Contract.balanceOf(receiverAddress, tokenId);
  allowance = await erc1155Contract.isApprovedForAll(receiverAddress, escrowShieldContractAddress);
  console.log(`Receiver:\n  Balance:    ${balance.toString()}\n  Allowance:  ${allowance.toString()}`);
}

try {
  main();
} catch (error) {
  console.error(error);
}
