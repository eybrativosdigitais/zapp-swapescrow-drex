import { getContractAddress, getContractInstance, getContractMetadata } from './common/contract.mjs'
import web3 from 'web3'
import logger from './common/logger.mjs'

export default async function stats (req, res) {
  try {
    const ZeroAddress = '0x0000000000000000000000000000000000000000'
    const SwapShieldMetadata = await getContractMetadata('SwapShield')

    const response = {
      ownAddress: process.env.DEFAULT_ACCOUNT,
      rpcUrl: process.env.RPC_URL,
      gasPrice: process.env.DEFAULT_GAS_PRICE,
      gasLimit: process.env.DEFAULT_GAS,
      ownPublicKey: '0',
      swapIdCounter: '0',
      latestRoot: '0',
      swapShieldAddress: ZeroAddress,
      swapShieldDeployBlocknumber: '0',
      tokens: {
        ERC20: ZeroAddress,
        ERC1155: ZeroAddress
      },
      allowances: {
        ERC20: '0',
        ERC1155: false
      }
    }

    if (!web3.utils.isAddress(response.ownAddress)) {
      logger.error('Error: DEFAULT_ACCOUNT is missing or is not an address.')
      response.ownAddress = ZeroAddress
    }

    try {
      const SwapShieldMetadata = await getContractMetadata('SwapShield')

      response.swapShieldAddress =
        web3.utils.isAddress(SwapShieldMetadata?.address) ? SwapShieldMetadata.address : ZeroAddress
      response.swapShieldDeployBlocknumber = SwapShieldMetadata?.blockNumber
    } catch {
      logger.error('Error: SwapShieldMetadata is missing or faulty.')
    }

    try {
      const SwapShield = await getContractInstance('SwapShield')

      const [
        swapIdCounter,
        latestRoot,
        ownPublicKey
      ] = await Promise.all([
        SwapShield.methods.swapIdCounter().call(),
        SwapShield.methods.latestRoot().call(),
        SwapShield.methods.zkpPublicKeys(process.env.DEFAULT_ACCOUNT).call()
      ])

      response.swapIdCounter = swapIdCounter
      response.latestRoot = latestRoot
      response.ownPublicKey = ownPublicKey
    } catch {
      logger.error('Error: SwapShield address is missing or is not an address.')
    }

    try {
      const ERC20 = await getContractInstance('ERC20')

      const [
        ERC20Address,
        erc20Allowance
      ] = await Promise.all([
        getContractAddress('ERC20'),
        ERC20.methods.allowance(process.env.DEFAULT_ACCOUNT, SwapShieldMetadata.address).call()
      ])

      response.tokens.ERC20 = ERC20Address
      response.allowances.ERC20 = erc20Allowance
    } catch {
      logger.error('Error: ERC20 address is missing or is not an address.')
    }

    try {
      const ERC1155Token = await getContractInstance('ERC1155Token')

      const [
        ERC1155Address,
        erc1155Allowance
      ] = await Promise.all([
        getContractAddress('ERC1155Token'),
        ERC1155Token.methods.isApprovedForAll(process.env.DEFAULT_ACCOUNT, SwapShieldMetadata.address).call()
      ])

      response.tokens.ERC1155 = ERC1155Address
      response.allowances.ERC1155 = erc1155Allowance
    } catch {
      logger.error('Error: ERC1155Token address is missing or is not an address.')
    }

    return res.send(response)
  } catch (err) {
    logger.error(err)
    return res.status(422).send({ errors: [err.message] })
  }
}
