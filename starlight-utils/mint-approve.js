#!/usr/bin/env node
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })
const { program } = require('commander')
const { ethers, NonceManager } = require('ethers')
const ERC20_ABI = require('./ierc20.abi.json')
const ERC1155_ABI = require('./erc1155.abi.json')
const SWAPSHIELD_ABI = require('./swapescrow-shield.abi.json')

const swapShieldAddress = process.env.STARLIGHT_ESCROWSHIELD_ADDRESS
const erc20Address = process.env.STARLIGHT_ERC20X_ADDRESS
const erc20TestAddress = process.env.STARLIGHT_ERC20Y_ADDRESS
const erc1155Address = process.env.STARLIGHT_ERC1155_ADDRESS
const envPrivateKeys = [
  process.env.BANKA_PRIVATE_KEY,
  process.env.BANKB_PRIVATE_KEY,
  process.env.BANKC_PRIVATE_KEY,
  process.env.BANKD_PRIVATE_KEY,
  process.env.BANKE_PRIVATE_KEY,
  process.env.BANKF_PRIVATE_KEY,
  process.env.BANKG_PRIVATE_KEY,
  process.env.BANKH_PRIVATE_KEY
]

program
  .name('mint-approve')
  .description('Setup an initial balance for the given accounts')
  .option('--privatekeys <private_keys>', 'An optional comma separated list of private keys, by default it uses the private keys in the .env file')
  .option('--swapshield <address>', 'Optional Swapshield address')
  .option('--erc20x <address>', 'Optional ERC20X address')
  .option('--erc20y <address>', 'Optional ERC20Y address')
  .option('--erc1155 <address>', 'Optional ERC1155 address')
  .option('--rpc <url>', 'Optional RPC URL')
  .option('--wait <confirming_blocks>', 'Optional amount of block confirmations to wait')
  .action(async ({ privatekeys, swapshield, erc20x, erc20y, erc1155, rpc, wait = 1 }) => {
    const provider = new ethers.JsonRpcProvider(rpc || process.env.STARLIGHT_RPC_URL)

    const SwapShield = new ethers.Contract(swapshield || swapShieldAddress, SWAPSHIELD_ABI, provider)
    const ERC20X = new ethers.Contract(erc20x || erc20Address, ERC20_ABI, provider)
    const ERC20Y = new ethers.Contract(erc20y || erc20TestAddress, ERC20_ABI, provider)
    const ERC1155 = new ethers.Contract(erc1155 || erc1155Address, ERC1155_ABI, provider)
    let privateKeys = envPrivateKeys

    if (typeof privatekeys === 'string') {
      privateKeys = privatekeys.split(',')
    }

    const signer = new ethers.Wallet(process.env.STARLIGHT_DEFAULT_ACCOUNT_KEY, provider)
    const verticalRuler = '-'.repeat(64)
    const transferETHAmount = BigInt(1e18)
    const mintERC20Amount = BigInt(100e18)
    const mintERC1155Amount = BigInt(5000)
    let transactionResponse

    for (const privateKey of privateKeys) {
      const index = privateKeys.indexOf(privateKey)
      if (!isPrivateKey(privateKey)) {
        console.error(`Invalid private key at index: ${index}, received: ${privateKey}`)
        process.exit(1)
      }

      let tokenId = 1
      const user = new NonceManager(new ethers.Wallet(privateKey, provider))
      user.address = await user.getAddress()
      const userBalance = await provider.getBalance(user.address)

      // Stats
      console.log(`${verticalRuler}\nAccount: ${user.address}\nBalance: ${ethers.formatEther(userBalance)} ETH\n${verticalRuler}`)

      // Transfer ETH
      if (process.env.STARLIGHT_RPC_URL.includes('localhost') || process.env.STARLIGHT_RPC_URL.includes('ganache')) {
        console.log(`Transferring ${ethers.formatEther(transferETHAmount)} ETH to ${user.address}`)
        transactionResponse = await signer.sendTransaction({
          to: user.address,
          value: transferETHAmount,
          data: '0x'
        })
        await transactionResponse.wait(wait)
      }

      // Minting tokens
      console.log(`Minting ${await amountFormattedERC20(mintERC20Amount, ERC20X)} to ${user.address}`)
      transactionResponse = await ERC20X.connect(signer).mint(user.address, mintERC20Amount)
      await transactionResponse.wait(wait)
      console.log('Minted!')

      console.log(`Minting ${await amountFormattedERC20(mintERC20Amount, ERC20Y)} to ${user.address}`)
      transactionResponse = await ERC20Y.connect(signer).mint(user.address, mintERC20Amount)
      await transactionResponse.wait(wait)
      console.log('Minted!')

      console.log(`Minting ${mintERC1155Amount} ERC1155(${tokenId}) to ${user.address}`)
      transactionResponse = await ERC1155.connect(signer).mint(user.address, tokenId, mintERC1155Amount, '0x')
      await transactionResponse.wait(wait)
      console.log('Minted!')

      tokenId = 2
      console.log(`Minting ${mintERC1155Amount} ERC1155(${tokenId}) to ${user.address}`)
      transactionResponse = await ERC1155.connect(signer).mint(user.address, tokenId, mintERC1155Amount, '0x')
      await transactionResponse.wait(wait)
      console.log('Minted!')

      // Approving usage
      console.log(`Approving ${await amountFormattedERC20(mintERC20Amount, ERC20X)} to SwapShield(${await SwapShield.getAddress()})`)
      transactionResponse = await ERC20X.connect(user).approve(await SwapShield.getAddress(), mintERC20Amount)
      await transactionResponse.wait(wait)
      console.log('Approved!')

      console.log(`Approving ${await amountFormattedERC20(mintERC20Amount, ERC20Y)} to SwapShield(${await SwapShield.getAddress()})`)
      transactionResponse = await ERC20Y.connect(user).approve(await SwapShield.getAddress(), mintERC20Amount)
      await transactionResponse.wait(wait)
      console.log('Approved!')

      console.log(`Approving ERC1155 tokens to SwapShield(${await SwapShield.getAddress()})`)
      transactionResponse = await ERC1155.connect(user).setApprovalForAll(await SwapShield.getAddress(), true)
      await transactionResponse.wait(wait)
      console.log('Approved!')

      console.log(`\nDone! User ${user.address} is set to go!`)
    }

    console.log('\nDone! All users are ready.\n')
  })
  .parse()

async function amountFormattedERC20 (amount, token) {
  const decimals = await token.decimals()
  const symbol = await token.symbol()
  return `${ethers.formatUnits(amount, decimals)} ${symbol}`
}

function isPrivateKey (key) {
  try {
    if (typeof key === 'string' && !key.startsWith('0x')) {
      key = '0x' + key
    }

    new ethers.SigningKey(key)
    return true
  } catch (error) {
    return false
  }
}
