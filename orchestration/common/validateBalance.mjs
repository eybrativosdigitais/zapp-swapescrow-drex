import { getAllCommitments } from './commitment-storage.mjs'
import parseCommitments from './parseCommitments.js'
import web3 from 'web3'
import web3Instance from './web3.mjs'
import { getContractInstance, getContractInterface, getContractMetadata } from './contract.mjs'
import logger from './logger.mjs'

/**
 * Check if the user has a given amount of ERC20 balance in their wallet
 * @param {string} address
 * @param {number|string} amount
 * @return {Promise<boolean>}
 */
export async function hasERC20Balance (address, amount) {
  const ERC20Interface = await getContractInterface('ERC20')
  const instance = web3Instance.connection()
  const ERC20 = new instance.eth.Contract(ERC20Interface.abi, address)

  try {
    const balance = await ERC20.methods.balanceOf(process.env.DEFAULT_ACCOUNT).call()
    return BigInt(balance || 0) >= BigInt(amount)
  } catch {
    logger.error(`ERC20 address(${address}) is missing or is not an address.`)
    return false
  }
}

/**
 * Check if the user has a given amount of ERC1155 balance in their wallet
 * @param {number} tokenId
 * @param {number|string} amount
 * @return {Promise<boolean>}
 */
export async function hasERC1155Balance (tokenId, amount) {
  const ERC1155Token = await getContractInstance('ERC1155Token')

  const balance = await ERC1155Token.methods.balanceOf(process.env.DEFAULT_ACCOUNT, tokenId).call()
  return BigInt(balance || 0) >= BigInt(amount)
}

/**
 * Check if the user has a given amount of ERC20 balance in the SwapShield contract
 * @param {string} address
 * @param {number|string} amount
 * @return {Promise<boolean>}
 */
export async function hasShieldedERC20Balance (address, amount) {
  address = web3.utils.toChecksumAddress(address)
  const owner = process.env.DEFAULT_ACCOUNT
  const commitments = await getAllCommitments()
  const getStateFromCommitments = parseCommitments(owner, [address], [])
  const state = getStateFromCommitments(commitments)
  return BigInt(state.balances[address] || 0) >= BigInt(amount)
}

/**
 * Check if the user has a given amount of ERC1155 balance in the SwapShield contract
 * @param {number} tokenId
 * @param {number|string} amount
 * @return {Promise<boolean>}
 */
export async function hasShieldedERC1155Balance (tokenId, amount) {
  const owner = process.env.DEFAULT_ACCOUNT
  const commitments = await getAllCommitments()
  const getStateFromCommitments = parseCommitments(owner, [], [tokenId])
  const state = getStateFromCommitments(commitments)
  return BigInt(state.tokenOwners[tokenId] || 0) >= BigInt(amount)
}

/**
 * Check if the user has enough allowances to transfer ERC20 to SwapEscrow
 * @param {string} address
 * @param {number|string} amount
 * @return {Promise<boolean>}
 */
export async function hasERC20Allowance (address, amount) {
  const SwapShieldMetadata = await getContractMetadata('SwapShield')
  const ERC20Interface = await getContractInterface('ERC20')
  const instance = web3Instance.connection()
  const ERC20 = new instance.eth.Contract(ERC20Interface.abi, address)

  try {
    const allowance = await ERC20.methods.allowance(process.env.DEFAULT_ACCOUNT, SwapShieldMetadata.address).call()
    return BigInt(allowance || 0) >= BigInt(amount)
  } catch {
    logger.error(`ERC20 address(${address}) is missing or is not an address.`)
    return false
  }
}

/**
 * Check if the user has enough allowances to transfer ERC1155 to SwapEscrow
 * @return {Promise<boolean>}
 */
export async function hasERC1155Approval () {
  const SwapShieldMetadata = await getContractMetadata('SwapShield')
  const ERC1155Token = await getContractInstance('ERC1155Token')

  const allowance = await ERC1155Token.methods.isApprovedForAll(process.env.DEFAULT_ACCOUNT, SwapShieldMetadata.address).call()
  return Boolean(allowance)
}
