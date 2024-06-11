import { getAllCommitments } from './commitment-storage.mjs'
import parseCommitments from './parseCommitments.js'
import web3 from 'web3'

/**
 * Check if the user has a given amount of ERC20 balance in the SwapShield contract
 * @param {string} address
 * @param {number|string} amount
 * @return {Promise<boolean>}
 */
export async function hasERC20Balance (address, amount) {
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
export async function hasERC1155Balance (tokenId, amount) {
  const owner = process.env.DEFAULT_ACCOUNT
  const commitments = await getAllCommitments()
  const getStateFromCommitments = parseCommitments(owner, [], [tokenId])
  const state = getStateFromCommitments(commitments)
  return BigInt(state.tokenOwners[tokenId] || 0) >= BigInt(amount)
}
