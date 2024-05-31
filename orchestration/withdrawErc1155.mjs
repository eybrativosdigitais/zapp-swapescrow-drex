/* eslint-disable prettier/prettier, camelcase, prefer-const, no-unused-vars */
import config from "config";
import utils from "zkp-utils";
import GN from "general-number";
import fs from "fs";

import {
	getContractInstance,
	getContractAddress,
	registerKey,
} from "./common/contract.mjs";
import {
	storeCommitment,
	getCurrentWholeCommitment,
	getCommitmentsById,
	getAllCommitments,
	getInputCommitments,
	joinCommitments,
	splitCommitments,
	markNullified,
	getnullifierMembershipWitness,
	getupdatedNullifierPaths,
	temporaryUpdateNullifier,
	updateNullifierTree,
} from "./common/commitment-storage.mjs";
import {
	decodeCommitmentData,
	encodeCommitmentData,
	encryptBackupData
} from './common/backupData.mjs';
import { generateProof } from "./common/zokrates.mjs";
import { getMembershipWitness, getRoot } from "./common/timber.mjs";
import Web3 from "./common/web3.mjs";
import {
	poseidonHash,
} from "./common/number-theory.mjs";

const { generalise } = GN;
const db = "/app/orchestration/common/db/preimage.json";
const keyDb = "/app/orchestration/common/db/key.json";

export class WithdrawErc1155Manager {
	constructor(web3) {
	  this.web3 = web3;
	}
  
	async init() {
	  this.instance = await getContractInstance('SwapShield');
	  this.contractAddr = await getContractAddress('SwapShield');
	}

 async  withdrawErc1155(
	_erc1155Address,
	_tokenId,
	_amount,
	_tokenOwners_msgSender_tokenId_newOwnerPublicKey = 0,
	_tokenOwners_msgSender_tokenId_0_oldCommitment = 0,
	_tokenOwners_msgSender_tokenId_1_oldCommitment = 0
) {
	// Initialisation of variables:

	const instance = this.instance;

	const contractAddr = this.contractAddr;
	const web3 = this.web3;

	const msgValue = 0;
	const msgSender = generalise(config.web3.options.defaultAccount);
	const erc1155Address = generalise(_erc1155Address);
	const tokenId = generalise(_tokenId);
	const amount = generalise(_amount);
	let tokenOwners_msgSender_tokenId_newOwnerPublicKey = generalise(
		_tokenOwners_msgSender_tokenId_newOwnerPublicKey
	);

	// Read dbs for keys and previous commitment values:

	if (!fs.existsSync(keyDb))
		await registerKey(utils.randomHex(31), "SwapShield", true);
	const keys = JSON.parse(
		fs.readFileSync(keyDb, "utf-8", (err) => {
			console.log(err);
		})
	);
	const secretKey = generalise(keys.secretKey);
	const publicKey = generalise(keys.publicKey);

	// read preimage for decremented state

	tokenOwners_msgSender_tokenId_newOwnerPublicKey =
		_tokenOwners_msgSender_tokenId_newOwnerPublicKey === 0
			? publicKey
			: tokenOwners_msgSender_tokenId_newOwnerPublicKey;

	let tokenOwners_msgSender_tokenId_stateVarId = 15;

	const tokenOwners_msgSender_tokenId_stateVarId_key = msgSender;

	const tokenOwners_msgSender_tokenId_stateVarId_valueKey = tokenId;

	tokenOwners_msgSender_tokenId_stateVarId = generalise(
		utils.mimcHash(
			[
				generalise(tokenOwners_msgSender_tokenId_stateVarId).bigInt,
				tokenOwners_msgSender_tokenId_stateVarId_key.bigInt,
				tokenOwners_msgSender_tokenId_stateVarId_valueKey.bigInt,
			],
			"ALT_BN_254"
		)
	).hex(32);

	let tokenOwners_msgSender_tokenId_preimage = await getCommitmentsById(
		tokenOwners_msgSender_tokenId_stateVarId
	);

	const tokenOwners_msgSender_tokenId_newCommitmentValue = generalise(
		parseInt(amount.integer, 10)
	);
	// First check if required commitments exist or not

	let [
		tokenOwners_msgSender_tokenId_commitmentFlag,
		tokenOwners_msgSender_tokenId_0_oldCommitment,
		tokenOwners_msgSender_tokenId_1_oldCommitment,
	] = getInputCommitments(
		publicKey.hex(32),
		tokenOwners_msgSender_tokenId_newCommitmentValue.integer,
		tokenOwners_msgSender_tokenId_preimage
	);

	let tokenOwners_msgSender_tokenId_witness_0;

	let tokenOwners_msgSender_tokenId_witness_1;

	if (
		tokenOwners_msgSender_tokenId_1_oldCommitment === null &&
		tokenOwners_msgSender_tokenId_commitmentFlag
	) {
		tokenOwners_msgSender_tokenId_witness_0 = await getMembershipWitness(
			"SwapShield",
			generalise(tokenOwners_msgSender_tokenId_0_oldCommitment._id).integer
		);

		const tx = await splitCommitments(
			"SwapShield",
			"tokenOwners",
			tokenOwners_msgSender_tokenId_newCommitmentValue,
			secretKey,
			publicKey,
			[15, tokenOwners_msgSender_tokenId_stateVarId_key,tokenOwners_msgSender_tokenId_stateVarId_valueKey],
			tokenOwners_msgSender_tokenId_0_oldCommitment,
			tokenOwners_msgSender_tokenId_witness_0,
			instance,
			contractAddr,
			web3
		);
		tokenOwners_msgSender_tokenId_preimage = await getCommitmentsById(
			tokenOwners_msgSender_tokenId_stateVarId
		);

		[
			tokenOwners_msgSender_tokenId_commitmentFlag,
			tokenOwners_msgSender_tokenId_0_oldCommitment,
			tokenOwners_msgSender_tokenId_1_oldCommitment,
		] = getInputCommitments(
			publicKey.hex(32),
			tokenOwners_msgSender_tokenId_newCommitmentValue.integer,
			tokenOwners_msgSender_tokenId_preimage
		);
	}

	while (tokenOwners_msgSender_tokenId_commitmentFlag === false) {
		tokenOwners_msgSender_tokenId_witness_0 = await getMembershipWitness(
			"SwapShield",
			generalise(tokenOwners_msgSender_tokenId_0_oldCommitment._id).integer
		);

		tokenOwners_msgSender_tokenId_witness_1 = await getMembershipWitness(
			"SwapShield",
			generalise(tokenOwners_msgSender_tokenId_1_oldCommitment._id).integer
		);

		const tx = await joinCommitments(
			"SwapShield",
			"tokenOwners",
			secretKey,
			publicKey,
			[15, tokenOwners_msgSender_tokenId_stateVarId_key, tokenOwners_msgSender_tokenId_stateVarId_valueKey],
			[
				tokenOwners_msgSender_tokenId_0_oldCommitment,
				tokenOwners_msgSender_tokenId_1_oldCommitment,
			],
			[
				tokenOwners_msgSender_tokenId_witness_0,
				tokenOwners_msgSender_tokenId_witness_1,
			],
			instance,
			contractAddr,
			web3
		);

		tokenOwners_msgSender_tokenId_preimage = await getCommitmentsById(
			tokenOwners_msgSender_tokenId_stateVarId
		);

		[
			tokenOwners_msgSender_tokenId_commitmentFlag,
			tokenOwners_msgSender_tokenId_0_oldCommitment,
			tokenOwners_msgSender_tokenId_1_oldCommitment,
		] = getInputCommitments(
			publicKey.hex(32),
			tokenOwners_msgSender_tokenId_newCommitmentValue.integer,
			tokenOwners_msgSender_tokenId_preimage
		);
	}
	const tokenOwners_msgSender_tokenId_0_prevSalt = generalise(
		tokenOwners_msgSender_tokenId_0_oldCommitment.preimage.salt
	);
	const tokenOwners_msgSender_tokenId_1_prevSalt = generalise(
		tokenOwners_msgSender_tokenId_1_oldCommitment.preimage.salt
	);
	const tokenOwners_msgSender_tokenId_0_prev = generalise(
		tokenOwners_msgSender_tokenId_0_oldCommitment.preimage.value
	);
	const tokenOwners_msgSender_tokenId_1_prev = generalise(
		tokenOwners_msgSender_tokenId_1_oldCommitment.preimage.value
	);

	// Extract set membership witness:

	// generate witness for partitioned state
	tokenOwners_msgSender_tokenId_witness_0 = await getMembershipWitness(
		"SwapShield",
		generalise(tokenOwners_msgSender_tokenId_0_oldCommitment._id).integer
	);
	tokenOwners_msgSender_tokenId_witness_1 = await getMembershipWitness(
		"SwapShield",
		generalise(tokenOwners_msgSender_tokenId_1_oldCommitment._id).integer
	);
	const tokenOwners_msgSender_tokenId_0_index = generalise(
		tokenOwners_msgSender_tokenId_witness_0.index
	);
	const tokenOwners_msgSender_tokenId_1_index = generalise(
		tokenOwners_msgSender_tokenId_witness_1.index
	);
	const tokenOwners_msgSender_tokenId_root = generalise(
		tokenOwners_msgSender_tokenId_witness_0.root
	);
	const tokenOwners_msgSender_tokenId_0_path = generalise(
		tokenOwners_msgSender_tokenId_witness_0.path
	).all;
	const tokenOwners_msgSender_tokenId_1_path = generalise(
		tokenOwners_msgSender_tokenId_witness_1.path
	).all;

	// non-secret line would go here but has been filtered out

	// non-secret line would go here but has been filtered out

	// increment would go here but has been filtered out

	// Calculate nullifier(s):

	let tokenOwners_msgSender_tokenId_0_nullifier = poseidonHash([
		BigInt(tokenOwners_msgSender_tokenId_stateVarId),
		BigInt(secretKey.hex(32)),
		BigInt(tokenOwners_msgSender_tokenId_0_prevSalt.hex(32)),
	]);
	let tokenOwners_msgSender_tokenId_1_nullifier = poseidonHash([
		BigInt(tokenOwners_msgSender_tokenId_stateVarId),
		BigInt(secretKey.hex(32)),
		BigInt(tokenOwners_msgSender_tokenId_1_prevSalt.hex(32)),
	]);
	tokenOwners_msgSender_tokenId_0_nullifier = generalise(
		tokenOwners_msgSender_tokenId_0_nullifier.hex(32)
	); // truncate
	tokenOwners_msgSender_tokenId_1_nullifier = generalise(
		tokenOwners_msgSender_tokenId_1_nullifier.hex(32)
	); // truncate

	// Calculate commitment(s):

	const tokenOwners_msgSender_tokenId_2_newSalt = generalise(
		utils.randomHex(31)
	);

	let tokenOwners_msgSender_tokenId_change =
		parseInt(tokenOwners_msgSender_tokenId_0_prev.integer, 10) +
		parseInt(tokenOwners_msgSender_tokenId_1_prev.integer, 10) -
		parseInt(tokenOwners_msgSender_tokenId_newCommitmentValue.integer, 10);

	tokenOwners_msgSender_tokenId_change = generalise(
		tokenOwners_msgSender_tokenId_change
	);

	let tokenOwners_msgSender_tokenId_2_newCommitment = poseidonHash([
		BigInt(tokenOwners_msgSender_tokenId_stateVarId),
		BigInt(tokenOwners_msgSender_tokenId_change.hex(32)),
		BigInt(publicKey.hex(32)),
		BigInt(tokenOwners_msgSender_tokenId_2_newSalt.hex(32)),
	]);

	tokenOwners_msgSender_tokenId_2_newCommitment = generalise(
		tokenOwners_msgSender_tokenId_2_newCommitment.hex(32)
	); // truncate

	// Call Zokrates to generate the proof:

	const allInputs = [
		tokenId.integer,
		amount.integer,
		msgSender.integer,
		secretKey.integer,
		secretKey.integer,

		tokenOwners_msgSender_tokenId_0_nullifier.integer,

		tokenOwners_msgSender_tokenId_1_nullifier.integer,

		tokenOwners_msgSender_tokenId_0_prev.integer,
		tokenOwners_msgSender_tokenId_0_prevSalt.integer,
		tokenOwners_msgSender_tokenId_1_prev.integer,
		tokenOwners_msgSender_tokenId_1_prevSalt.integer,
		tokenOwners_msgSender_tokenId_root.integer,
		tokenOwners_msgSender_tokenId_0_index.integer,
		tokenOwners_msgSender_tokenId_0_path.integer,
		tokenOwners_msgSender_tokenId_1_index.integer,
		tokenOwners_msgSender_tokenId_1_path.integer,
		tokenOwners_msgSender_tokenId_newOwnerPublicKey.integer,
		tokenOwners_msgSender_tokenId_2_newSalt.integer,
		tokenOwners_msgSender_tokenId_2_newCommitment.integer,
	].flat(Infinity);
	const res = await generateProof("withdrawErc1155", allInputs);
	const proof = generalise(Object.values(res.proof).flat(Infinity))
		.map((coeff) => coeff.integer)
		.flat(Infinity);

	// TODO: encrypt storeCommitment doc here
	// const backUpData1 = encrypt(storedCommitment1, ...)

	const commitment = {
		hash: tokenOwners_msgSender_tokenId_2_newCommitment,
		name: "tokenOwners",
		mappingKey: tokenOwners_msgSender_tokenId_stateVarId_key.integer,
		preimage: {
			stateVarId: generalise(tokenOwners_msgSender_tokenId_stateVarId),
			value: tokenOwners_msgSender_tokenId_change,
			salt: tokenOwners_msgSender_tokenId_2_newSalt,
			publicKey: tokenOwners_msgSender_tokenId_newOwnerPublicKey,
		},
		secretKey:
			tokenOwners_msgSender_tokenId_newOwnerPublicKey.integer ===
			publicKey.integer
				? secretKey
				: null,
		isNullified: false,
	}
	const plainTextCommitments = encodeCommitmentData(commitment);

	const backUpData = encryptBackupData(plainTextCommitments)

	// Send transaction to the blockchain:

	const txData = await instance.methods
		.withdrawErc1155(
			tokenId.integer,
			amount.integer,
			[
				tokenOwners_msgSender_tokenId_0_nullifier.integer,
				tokenOwners_msgSender_tokenId_1_nullifier.integer,
			],
			tokenOwners_msgSender_tokenId_root.integer,
			[tokenOwners_msgSender_tokenId_2_newCommitment.integer],
			proof,
			[backUpData]
		)
		.encodeABI();

	let txParams = {
		from: config.web3.options.defaultAccount,
		to: contractAddr,
		gas: config.web3.options.defaultGas,
		gasPrice: config.web3.options.defaultGasPrice,
		data: txData,
		chainId: await web3.eth.net.getId(),
	};

	const key = config.web3.key;

	const signed = await web3.eth.accounts.signTransaction(txParams, key);

	const sendTxn = await web3.eth.sendSignedTransaction(signed.rawTransaction);

	let tx = await instance.getPastEvents("NewLeaves");

	tx = tx[0];

	if (!tx) {
		throw new Error(
			"Tx failed - the commitment was not accepted on-chain, or the contract is not deployed."
		);
	}

	let encEvent = "";

	try {
		encEvent = await instance.getPastEvents("EncryptedData");
	} catch (err) {
		console.log("No encrypted event");
	}

	// Write new commitment preimage to db:

	await markNullified(
		generalise(tokenOwners_msgSender_tokenId_0_oldCommitment._id),
		secretKey.hex(32)
	);

	await markNullified(
		generalise(tokenOwners_msgSender_tokenId_1_oldCommitment._id),
		secretKey.hex(32)
	);

	await storeCommitment(commitment);

	return { tx, encEvent };
}
}
