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
	encodeCommitmentData,
	encryptBackupData
} from './common/backupData.mjs';
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
import { generateProof } from "./common/zokrates.mjs";
import { getMembershipWitness, getRoot } from "./common/timber.mjs";
import Web3 from "./common/web3.mjs";
import {
	decompressStarlightKey,
	poseidonHash,
	encrypt,
	decrypt
} from "./common/number-theory.mjs";

const { generalise } = GN;
const db = "/app/orchestration/common/db/preimage.json";
const keyDb = "/app/orchestration/common/db/key.json";

export class WithdrawErc20Manager {
	constructor(web3) {
	  this.web3 = web3;
	}
  
	async init() {
		this.instance = await getContractInstance('SwapShield');
		this.contractAddr = await getContractAddress('SwapShield');
	}

 async  withdrawErc20(
	_erc20Address,
	_amount,
	_balances_msgSender_erc20Address_newOwnerPublicKey = 0,
	_balances_msgSender_erc20Address_0_oldCommitment = 0,
	_balances_msgSender_erc20Address_1_oldCommitment = 0
) {
	// Initialisation of variables:

	const instance = this.instance;

	const contractAddr = this.contractAddr;

	const web3 = this.web3;

	const msgValue = 0;
	const msgSender = generalise(config.web3.options.defaultAccount);
	const erc20Address = generalise(_erc20Address);
	const amount = generalise(_amount);
	let balances_msgSender_erc20Address_newOwnerPublicKey = generalise(
		_balances_msgSender_erc20Address_newOwnerPublicKey
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

	balances_msgSender_erc20Address_newOwnerPublicKey =
		_balances_msgSender_erc20Address_newOwnerPublicKey === 0
			? publicKey
			: balances_msgSender_erc20Address_newOwnerPublicKey;

	let balances_msgSender_erc20Address_stateVarId = 9;

	const balances_msgSender_erc20Address_stateVarId_key = msgSender;

	const balances_msgSender_erc20Address_stateVarId_valueKey = erc20Address;

	balances_msgSender_erc20Address_stateVarId = generalise(
		utils.mimcHash(
			[
				generalise(balances_msgSender_erc20Address_stateVarId).bigInt,
				balances_msgSender_erc20Address_stateVarId_key.bigInt,
				balances_msgSender_erc20Address_stateVarId_valueKey.bigInt,
			],
			"ALT_BN_254"
		)
	).hex(32);

	let balances_msgSender_erc20Address_preimage = await getCommitmentsById(
		balances_msgSender_erc20Address_stateVarId
	);

	const balances_msgSender_erc20Address_newCommitmentValue = generalise(
		parseInt(amount.integer, 10)
	);
	// First check if required commitments exist or not

	let [
		balances_msgSender_erc20Address_commitmentFlag,
		balances_msgSender_erc20Address_0_oldCommitment,
		balances_msgSender_erc20Address_1_oldCommitment,
	] = getInputCommitments(
		publicKey.hex(32),
		balances_msgSender_erc20Address_newCommitmentValue.integer,
		balances_msgSender_erc20Address_preimage
	);

	let balances_msgSender_erc20Address_witness_0;

	let balances_msgSender_erc20Address_witness_1;

	if (
		balances_msgSender_erc20Address_1_oldCommitment === null &&
		balances_msgSender_erc20Address_commitmentFlag
	) {
		balances_msgSender_erc20Address_witness_0 = await getMembershipWitness(
			"SwapShield",
			generalise(balances_msgSender_erc20Address_0_oldCommitment._id).integer
		);

		const tx = await splitCommitments(
			"SwapShield",
			"balances",
			balances_msgSender_erc20Address_newCommitmentValue,
			secretKey,
			publicKey,
			[9, balances_msgSender_erc20Address_stateVarId_key, balances_msgSender_erc20Address_stateVarId_valueKey],
			balances_msgSender_erc20Address_0_oldCommitment,
			balances_msgSender_erc20Address_witness_0,
			instance,
			contractAddr,
			web3
		);
		balances_msgSender_erc20Address_preimage = await getCommitmentsById(
			balances_msgSender_erc20Address_stateVarId
		);

		[
			balances_msgSender_erc20Address_commitmentFlag,
			balances_msgSender_erc20Address_0_oldCommitment,
			balances_msgSender_erc20Address_1_oldCommitment,
		] = getInputCommitments(
			publicKey.hex(32),
			balances_msgSender_erc20Address_newCommitmentValue.integer,
			balances_msgSender_erc20Address_preimage
		);
	}

	while (balances_msgSender_erc20Address_commitmentFlag === false) {
		balances_msgSender_erc20Address_witness_0 = await getMembershipWitness(
			"SwapShield",
			generalise(balances_msgSender_erc20Address_0_oldCommitment._id).integer
		);

		balances_msgSender_erc20Address_witness_1 = await getMembershipWitness(
			"SwapShield",
			generalise(balances_msgSender_erc20Address_1_oldCommitment._id).integer
		);

		const tx = await joinCommitments(
			"SwapShield",
			"balances",
			secretKey,
			publicKey,
			[9, balances_msgSender_erc20Address_stateVarId_key, balances_msgSender_erc20Address_stateVarId_valueKey],
			[
				balances_msgSender_erc20Address_0_oldCommitment,
				balances_msgSender_erc20Address_1_oldCommitment,
			],
			[
				balances_msgSender_erc20Address_witness_0,
				balances_msgSender_erc20Address_witness_1,
			],
			instance,
			contractAddr,
			web3
		);

		balances_msgSender_erc20Address_preimage = await getCommitmentsById(
			balances_msgSender_erc20Address_stateVarId
		);

		[
			balances_msgSender_erc20Address_commitmentFlag,
			balances_msgSender_erc20Address_0_oldCommitment,
			balances_msgSender_erc20Address_1_oldCommitment,
		] = getInputCommitments(
			publicKey.hex(32),
			balances_msgSender_erc20Address_newCommitmentValue.integer,
			balances_msgSender_erc20Address_preimage
		);
	}
	const balances_msgSender_erc20Address_0_prevSalt = generalise(
		balances_msgSender_erc20Address_0_oldCommitment.preimage.salt
	);
	const balances_msgSender_erc20Address_1_prevSalt = generalise(
		balances_msgSender_erc20Address_1_oldCommitment.preimage.salt
	);
	const balances_msgSender_erc20Address_0_prev = generalise(
		balances_msgSender_erc20Address_0_oldCommitment.preimage.value
	);
	const balances_msgSender_erc20Address_1_prev = generalise(
		balances_msgSender_erc20Address_1_oldCommitment.preimage.value
	);

	// Extract set membership witness:

	// generate witness for partitioned state
	balances_msgSender_erc20Address_witness_0 = await getMembershipWitness(
		"SwapShield",
		generalise(balances_msgSender_erc20Address_0_oldCommitment._id).integer
	);
	balances_msgSender_erc20Address_witness_1 = await getMembershipWitness(
		"SwapShield",
		generalise(balances_msgSender_erc20Address_1_oldCommitment._id).integer
	);
	const balances_msgSender_erc20Address_0_index = generalise(
		balances_msgSender_erc20Address_witness_0.index
	);
	const balances_msgSender_erc20Address_1_index = generalise(
		balances_msgSender_erc20Address_witness_1.index
	);
	const balances_msgSender_erc20Address_root = generalise(
		balances_msgSender_erc20Address_witness_0.root
	);
	const balances_msgSender_erc20Address_0_path = generalise(
		balances_msgSender_erc20Address_witness_0.path
	).all;
	const balances_msgSender_erc20Address_1_path = generalise(
		balances_msgSender_erc20Address_witness_1.path
	).all;

	// non-secret line would go here but has been filtered out

	// non-secret line would go here but has been filtered out

	// increment would go here but has been filtered out

	// Calculate nullifier(s):

	let balances_msgSender_erc20Address_0_nullifier = poseidonHash([
		BigInt(balances_msgSender_erc20Address_stateVarId),
		BigInt(secretKey.hex(32)),
		BigInt(balances_msgSender_erc20Address_0_prevSalt.hex(32)),
	]);
	let balances_msgSender_erc20Address_1_nullifier = poseidonHash([
		BigInt(balances_msgSender_erc20Address_stateVarId),
		BigInt(secretKey.hex(32)),
		BigInt(balances_msgSender_erc20Address_1_prevSalt.hex(32)),
	]);
	balances_msgSender_erc20Address_0_nullifier = generalise(
		balances_msgSender_erc20Address_0_nullifier.hex(32)
	); // truncate
	balances_msgSender_erc20Address_1_nullifier = generalise(
		balances_msgSender_erc20Address_1_nullifier.hex(32)
	); // truncate

	// Calculate commitment(s):

	const balances_msgSender_erc20Address_2_newSalt = generalise(
		utils.randomHex(31)
	);

	let balances_msgSender_erc20Address_change =
		parseInt(balances_msgSender_erc20Address_0_prev.integer, 10) +
		parseInt(balances_msgSender_erc20Address_1_prev.integer, 10) -
		parseInt(balances_msgSender_erc20Address_newCommitmentValue.integer, 10);

	balances_msgSender_erc20Address_change = generalise(
		balances_msgSender_erc20Address_change
	);

	let balances_msgSender_erc20Address_2_newCommitment = poseidonHash([
		BigInt(balances_msgSender_erc20Address_stateVarId),
		BigInt(balances_msgSender_erc20Address_change.hex(32)),
		BigInt(publicKey.hex(32)),
		BigInt(balances_msgSender_erc20Address_2_newSalt.hex(32)),
	]);

	balances_msgSender_erc20Address_2_newCommitment = generalise(
		balances_msgSender_erc20Address_2_newCommitment.hex(32)
	); // truncate

	// Call Zokrates to generate the proof:

	const allInputs = [
		erc20Address.integer,
		amount.integer,
		msgSender.integer,
		secretKey.integer,
		secretKey.integer,

		balances_msgSender_erc20Address_0_nullifier.integer,

		balances_msgSender_erc20Address_1_nullifier.integer,

		balances_msgSender_erc20Address_0_prev.integer,
		balances_msgSender_erc20Address_0_prevSalt.integer,
		balances_msgSender_erc20Address_1_prev.integer,
		balances_msgSender_erc20Address_1_prevSalt.integer,
		balances_msgSender_erc20Address_root.integer,
		balances_msgSender_erc20Address_0_index.integer,
		balances_msgSender_erc20Address_0_path.integer,
		balances_msgSender_erc20Address_1_index.integer,
		balances_msgSender_erc20Address_1_path.integer,
		balances_msgSender_erc20Address_newOwnerPublicKey.integer,
		balances_msgSender_erc20Address_2_newSalt.integer,
		balances_msgSender_erc20Address_2_newCommitment.integer,
	].flat(Infinity);
	const res = await generateProof("withdrawErc20", allInputs);
	const proof = generalise(Object.values(res.proof).flat(Infinity))
		.map((coeff) => coeff.integer)
		.flat(Infinity);

	// TODO: encrypt storeCommitment doc here
	// const backUpData1 = encrypt(storedCommitment1, ...)

	const commitment = {
		hash: balances_msgSender_erc20Address_2_newCommitment,
		name: "balances",
		mappingKey: balances_msgSender_erc20Address_stateVarId_key.integer,
		preimage: {
			stateVarId: generalise(balances_msgSender_erc20Address_stateVarId),
			value: balances_msgSender_erc20Address_change,
			salt: balances_msgSender_erc20Address_2_newSalt,
			publicKey: balances_msgSender_erc20Address_newOwnerPublicKey,
		},
		secretKey:
			balances_msgSender_erc20Address_newOwnerPublicKey.integer ===
			publicKey.integer
				? secretKey
				: null,
		isNullified: false,
	}
	const plainTextCommitments = encodeCommitmentData(commitment);

	const backUpData = encryptBackupData(plainTextCommitments);
	// Send transaction to the blockchain:

	const txData = await instance.methods
		.withdrawErc20(
			_erc20Address,
			amount.integer,
			[
				balances_msgSender_erc20Address_0_nullifier.integer,
				balances_msgSender_erc20Address_1_nullifier.integer,
			],
			balances_msgSender_erc20Address_root.integer,
			[balances_msgSender_erc20Address_2_newCommitment.integer],
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
		generalise(balances_msgSender_erc20Address_0_oldCommitment._id),
		secretKey.hex(32)
	);

	await markNullified(
		generalise(balances_msgSender_erc20Address_1_oldCommitment._id),
		secretKey.hex(32)
	);

	await storeCommitment(commitment);

	return { tx, encEvent };
}
}
