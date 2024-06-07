import { generalise } from 'general-number'
import utils from 'zkp-utils'

const erc20BalancesVarId = 9
const erc1155BalancesVarId = 15

export default function formatCommitments (commitments, userAddress, erc20Addresses, tokenIds) {
  const mappingKeysForBalances = erc20Addresses
    .map(erc20Address => {
      const mappingKey = generalise(
        utils.mimcHash(
          [
            generalise(erc20BalancesVarId).bigInt,
            generalise(userAddress).bigInt,
            generalise(erc20Address).bigInt
          ],
          'ALT_BN_254'
        )
      ).hex(32)

      return [erc20Address, mappingKey]
    })
    .reduce((acc, [erc20Address, mappingKey]) => {
      acc[mappingKey] = erc20Address
      return acc
    }, {})

  const mappingKeysForTokenOwners = tokenIds
    .map(tokenId => {
      const mappingKey = generalise(
        utils.mimcHash(
          [
            generalise(erc1155BalancesVarId).bigInt,
            generalise(userAddress).bigInt,
            generalise(tokenId).bigInt
          ],
          'ALT_BN_254'
        )
      ).hex(32)

      return [tokenId, mappingKey]
    })
    .reduce((acc, [tokenId, mappingKey]) => {
      acc[mappingKey] = tokenId
      return acc
    }, {})

  return commitments.map(commitment => {
    switch (commitment.name) {
      case 'balances':
        const erc20Address = mappingKeysForBalances[commitment.preimage.stateVarId]

        commitment.preimage.value = parseInt(commitment.preimage.value)
        commitment.preimage.tokenType = 'ERC20'

        if (erc20Address) {
          commitment.preimage.tokenAddress = erc20Address
        } else {
          commitment.preimage.tokenAddress = 'Unknown'
        }
        break
      case 'tokenOwners':
        const tokenId = mappingKeysForTokenOwners[commitment.preimage.stateVarId]

        commitment.preimage.value = parseInt(commitment.preimage.value)
        commitment.preimage.tokenType = 'ERC1155'

        if (tokenId) {
          commitment.preimage.tokenId = parseInt(tokenId)
        } else {
          commitment.preimage.tokenId = 'Unknown'
        }
        break
      default:
    }

    return commitment
  })
}
