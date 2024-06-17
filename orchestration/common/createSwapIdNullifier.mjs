import GN from 'general-number'
import utils from 'zkp-utils'
import {
  poseidonHash
} from './number-theory.mjs'

const { generalise } = GN

/**
 * Creates a unique number by combining a portion of an Ethereum address and a random hexadecimal number.
 * The resulting number is ensured to be within the JavaScript `MAX_SAFE_INTEGER` range.
 * If the number exceeds this range, the function recursively calls itself until a valid number is generated.
 *
 * @param {Object} ethereumAddressGeneralized - An object from the 'general-number' library that contains a BigInt representation of an Ethereum address.
 * @returns {string} A string representation of a unique number.
 */
export function createUniqueNumber (ethereumAddressGeneralized) {
  let ethereumAddress = ethereumAddressGeneralized.bigInt.toString()

  if (ethereumAddress.slice(0, ethereumAddress.length) === '0x') {
    ethereumAddress = ethereumAddress.slice(2)
  }

  // Limit the Ethereum address part to 7 characters (6 digits) to stay within safe integer range
  const addressPart = ethereumAddress.slice(0, 7)

  const randomPart = utils.randomHex(4)
  const randomPartWithNo0x = randomPart.slice(2)

  const uniqueHexString = addressPart + randomPartWithNo0x

  const resultNumber = generalise(uniqueHexString)
  // Ensure the result is within the MAX_SAFE_INTEGER range
  if (resultNumber.bigInt > BigInt(Number.MAX_SAFE_INTEGER)) {
    // In case it still exceeds, adjust the random part length
    return createUniqueNumber(ethereumAddressGeneralized)
  }
  return resultNumber.bigInt.toString()
}

/**
 * Calculates the nullifier for a given SwapId stateVarId.
 *
 * @param {string} swapIdCountertateVarId - The swap ID and state variable ID concatenated.
 * @returns {Object} The nullifier for the given swap ID and state variable ID in general-number format.
 */
export function calculateNullifier (swapIdCounterStateVarId) {
  const calculatedPoseidon = poseidonHash([
    BigInt(swapIdCounterStateVarId),
    BigInt(generalise(0).hex(32)),
    BigInt(generalise(0).hex(32))
  ])

  return generalise(calculatedPoseidon.hex(32))
}

/**
 * Creates a unique SwapId and other properties SwapId and other properties that will be used to generate the nullifier later in the code.
 *
 * The function ensures that the nullifier does not already exist in the contract's nullifiers mapping.
 *
 * @param {Object} swapShieldContract - The contract instance of the SwapShield contract.
 * @param {Object} msgSender - An object from the 'general-number' library that contains a BigInt representation of an Ethereum address.
 * @param {number} stateVarId - The state variable ID.
 * @returns {Object} An object containing the unique SwapId and other properties that will be used to generate the nullifier later in the code.
 */
export async function createSwapIdProperties (swapShieldContract, msgSender, stateVarId) {
  let swapIdCounter
  let swapIdCounter_
  let swapProposals_swapIdCounter_stateVarId_key
  let swapProposals_swapIdCounter_stateVarId = stateVarId

  let isNullifierAlreadyExists = true
  while (isNullifierAlreadyExists) {
    swapIdCounter = generalise(createUniqueNumber(msgSender))
    swapIdCounter_ = generalise(BigInt(swapIdCounter.integer) + 1n)

    swapProposals_swapIdCounter_stateVarId_key = swapIdCounter_

    swapProposals_swapIdCounter_stateVarId = generalise(
      utils.mimcHash(
        [
          generalise(swapProposals_swapIdCounter_stateVarId).bigInt,
          swapProposals_swapIdCounter_stateVarId_key.bigInt
        ],
        'ALT_BN_254'
      )
    ).hex(32)

    const calculatedSwapIdCounterNullifier = calculateNullifier(swapProposals_swapIdCounter_stateVarId)

    const nullifierResponse = await swapShieldContract.methods.nullifiers(calculatedSwapIdCounterNullifier.integer).call()

    const nullifierResponseGN = generalise(nullifierResponse)

    if (nullifierResponseGN.integer === '0') {
      isNullifierAlreadyExists = false
    }
  }

  return {
    swapIdCounter,
    swapIdCounter_,
    swapProposals_swapIdCounter_stateVarId_key,
    swapProposals_swapIdCounter_stateVarId
  }
}
