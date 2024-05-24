const utils = require("zkp-utils") ;
const generalise = require("general-number").generalise;

const erc20BalancesVarId = 9
const erc1155BalancesVarId = 15 // this is tokenOwners
const swapProposalsVarId = 47

const varIds = {
  balances: erc20BalancesVarId,
  tokenOwners: erc1155BalancesVarId,
  swapProposals: swapProposalsVarId
}

const parseCommitments = (userAddress, erc20Addresses, tokenIds) => commitments => {
  const state = {
    balances: {},
    tokenOwners: {},
    swapProposals: {}
  }
  const mappingKeysForBalances = {}
  const mappingKeysForTokenOwners = {}

  erc20Addresses.map((erc20Address) => {
    const mappingKey =	generalise(
      utils.mimcHash(
        [
          generalise(erc20BalancesVarId).bigInt,
          generalise(userAddress).bigInt,
          generalise(erc20Address).bigInt,
        ],
        "ALT_BN_254"
      )
    ).hex(32);
    mappingKeysForBalances[mappingKey] = erc20Address
  })
  tokenIds.map((tokenId) => {
    const mappingKey =	generalise(
      utils.mimcHash(
        [
          generalise(erc1155BalancesVarId).bigInt,
          generalise(userAddress).bigInt,
          generalise(tokenId).bigInt,
        ],
        "ALT_BN_254"
      )
    ).hex(32);
    mappingKeysForTokenOwners[mappingKey] = tokenId
  })


  commitments
    .filter(commitment => commitment.isNullified === false)
    .forEach(commitment => {
      if (commitment.name === 'balances' && mappingKeysForBalances[commitment.preimage.stateVarId]) {
        const tokenAddress = mappingKeysForBalances[commitment.preimage.stateVarId]

        if(state.balances[tokenAddress] == null) {
          state.balances[tokenAddress] = parseInt(commitment.preimage.value)
        } else {
          state.balances[tokenAddress] += parseInt(commitment.preimage.value)
        }
      } else if (commitment.name === 'tokenOwners' && mappingKeysForTokenOwners[commitment.preimage.stateVarId]) {
        const tokenId = mappingKeysForTokenOwners[commitment.preimage.stateVarId]

        if(state.tokenOwners[tokenId] == null) {
          state.tokenOwners[tokenId] = parseInt(commitment.preimage.value)
        } else {
          state.tokenOwners[tokenId] += parseInt(commitment.preimage.value)
        }
      } else if (commitment.name === 'swapProposals') {
        state.swapProposals[commitment.preimage.value.swapId] = commitment.preimage.value
      }
    })

  return state
}

module.exports = parseCommitments

// const inputCommitments = [
//       {
//           "_id": "0x283ecfc60c129066cc13e9c1dac537385f69c594602797d3240d6ee11a70fef8",
//           "name": "balances",
//           "mappingKey": "642829559307850963015472508762062935916233390536",
//           "secretKey": "0x00b82989df271ec097e3e273eef4dae2feafd1c9a0c124fdff3fd50240bef59d",
//           "preimage": {
//               "stateVarId": "0x0b702ea1a5b26d1df00e34ff69598e6da249212850662f3c9882fff533c0f33b",
//               "value": "100",
//               "salt": "0x00e60a77d9f6d682bc86d6ab3e221461872193321a1faa56a25bb9ed48e0a968",
//               "publicKey": "0x2dfd231767bfa34ab448595fe275a2d51e92d6edac27ccae5520a511d16232d8"
//           },
//           "isNullified": true,
//           "nullifier": "0x13ddffef1570c8a434b1226a8afd5631cc77f053e7d72a6c9ac8c05a65c17a48"
//       },
//       {
//           "_id": "0x26080fb1cdf2a3f8b0d4fb8536d573a897d49e73f5ea7721a335c42e170dab46",
//           "name": "balances",
//           "mappingKey": "642829559307850963015472508762062935916233390536",
//           "secretKey": "0x00b82989df271ec097e3e273eef4dae2feafd1c9a0c124fdff3fd50240bef59d",
//           "preimage": {
//               "stateVarId": "0x0b702ea1a5b26d1df00e34ff69598e6da249212850662f3c9882fff533c0f33b",
//               "value": "50",
//               "salt": "0x00a2b4967bf22d4fb286c99fd13ec9accf3914687d8a73a35220c52a213b0dc2",
//               "publicKey": "0x2dfd231767bfa34ab448595fe275a2d51e92d6edac27ccae5520a511d16232d8"
//           },
//           "isNullified": true,
//           "nullifier": "0x26bc6d4464b92aa4d43e455e53b51949a69d345e63ed626cf752282f5c045471"
//       },
//       {
//           "_id": "0x17c57ae9a897dd40aa7bbb11d82320077e179626da9abdcd187ac6fea72fe50d",
//           "name": "tokenOwners",
//           "mappingKey": "642829559307850963015472508762062935916233390536",
//           "secretKey": "0x00b82989df271ec097e3e273eef4dae2feafd1c9a0c124fdff3fd50240bef59d",
//           "preimage": {
//               "stateVarId": "0x0aebf617ab4edb2710fe5d0a1706bb4088c2739b3c64b9da3cd87d3ee7815088",
//               "value": "50",
//               "salt": "0x006a66ff085662a05d7f0f1d056b19367f80f608d251a460a97664095ec24012",
//               "publicKey": "0x2dfd231767bfa34ab448595fe275a2d51e92d6edac27ccae5520a511d16232d8"
//           },
//           "isNullified": false,
//           "nullifier": "0x2f8e4b57a911b72d7c8680eb9f4dd35b1b5550a3b46003a489f55b40ee261950"
//       },
//       {
//           "_id": "0x0057f3516503bdb850202377970c6e972375d8a130e7cb68c2b50c62b033639c",
//           "name": "balances",
//           "mappingKey": "642829559307850963015472508762062935916233390536",
//           "secretKey": "0x00b82989df271ec097e3e273eef4dae2feafd1c9a0c124fdff3fd50240bef59d",
//           "preimage": {
//               "stateVarId": "0x0b702ea1a5b26d1df00e34ff69598e6da249212850662f3c9882fff533c0f33b",
//               "value": "120",
//               "salt": "0x00c066f8ae01aa6724ce832cbd5f132a4dc787c52de39de8ed09735a2ce6ac4a",
//               "publicKey": "0x2dfd231767bfa34ab448595fe275a2d51e92d6edac27ccae5520a511d16232d8"
//           },
//           "isNullified": false,
//           "nullifier": "0x0103897d94834b94b0af9676c9340ebd971b68343fc74a9f266967fb6ee30f07"
//       },
//       {
//           "_id": "0x28bb819cb66be6a0f751e2d86948fbc954bef1ed649ae61bc74189ff8e5130a2",
//           "name": "swapProposals",
//           "mappingKey": "1",
//           "secretKey": "0x041508b575770ef29528c4551190686558288c161ebed154efa63c63b0351a8c",
//           "preimage": {
//               "stateVarId": "0x24ffde0f93972fecc747ffee15b6e9903e023d289563b1838cad9e1e65057721",
//               "value": {
//                   "swapAmountSent": "30",
//                   "swapAmountRecieved": "0",
//                   "swapTokenSentId": "0",
//                   "swapTokenSentAmount": "0",
//                   "swapTokenRecievedId": "1",
//                   "swapTokenRecievedAmount": "20",
//                   "swapId": "1",
//                   "swapSender": "642829559307850963015472508762062935916233390536",
//                   "swapReciever": "344073830386746567427978432078835137280280269756",
//                   "erc20AddressSent": "546832666083503441596631955110878224325536077575",
//                   "erc20AddressRecieved": "0",
//                   "pendingStatus": "1"
//               },
//               "salt": "0x006a9513722c0af7952f37b7fed495aeef3d58ce4c5d8158cd74067d86c72469",
//               "publicKey": "0x0567c84bae6136aae09dca5eb8546f67cde42d63afd49644ef5aa4d8ac5984c8"
//           },
//           "isNullified": false,
//           "nullifier": "0x1c571834c02bc755d71f9509f66db1524d681b0192ffedb4148e65c07bd826fc"
//       },
//       {
//           "_id": "0x2964bd19d435ce00466fafa5a763e831554f68b7853d48b90faac94ccac1801b",
//           "name": "tokenOwners",
//           "mappingKey": {
//               "_hex": "0xaebf617ab4edb2710fe5d0a1706bb4088c2739b3c64b9da3cd87d3ee7815088"
//           },
//           "secretKey": "0x00b82989df271ec097e3e273eef4dae2feafd1c9a0c124fdff3fd50240bef59d",
//           "preimage": {
//               "stateVarId": "0x0aebf617ab4edb2710fe5d0a1706bb4088c2739b3c64b9da3cd87d3ee7815088",
//               "value": "20",
//               "salt": "0x00840ec1cd3335cc16adcbc959412e9a73caa6dfba1b274787e92a67c732417c",
//               "publicKey": "0x2dfd231767bfa34ab448595fe275a2d51e92d6edac27ccae5520a511d16232d8"
//           },
//           "isNullified": false,
//           "nullifier": "0x2c99f30460c6f981e0bbe5ab0798b06fc590bdf34ec758664c6cbb508270d4a2"
//       }
//   ]

// const x = parseCommitments("0x70997970c51812dc3a010c7d01b50e0d17dc79c8", ["0x5FC8d32690cc91D4c39d9d3abcBD16989F875707", "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e"], [1,2,3,4,5,6,7,8,9])

// console.log(x(inputCommitments))
