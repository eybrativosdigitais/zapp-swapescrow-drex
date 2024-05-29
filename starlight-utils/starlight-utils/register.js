require('dotenv').config();
const crypto = require('crypto');
const fs = require('fs');
const { ethers, JsonRpcProvider } = require('ethers');
const { generalise, GN } = require('general-number');
const abi = require('./swapescrow-shield.abi.json');
const erc20Abi = require('./ierc20.abi.json');
const config = require('../config/default.js');

function generateRandomHex(length) {
  const bufSecret = crypto.randomBytes(length);
  const secretKey =  `0x${bufSecret.toString('hex')}`;
  return secretKey;
}

// function for extended Euclidean Algorithm
// (used to find modular inverse)
function gcdExtended(a, b, _xy) {
	const xy = _xy;
	if (a === 0n) {
		xy[0] = 0n;
		xy[1] = 1n;
		return b;
	}
	const xy1 = [0n, 0n];
	const gcd = gcdExtended(b % a, a, xy1);

	// Update x and y using results of recursive call
	xy[0] = xy1[1] - (b / a) * xy1[0];
	xy[1] = xy1[0]; // eslint-disable-line prefer-destructuring

	return gcd;
}


// Function to compute a/b mod m
function modDivide(a, b, m = config.BN128_PRIME_FIELD) {
	const aa = ((a % m) + m) % m; // check the numbers are mod m and not negative
	const bb = ((b % m) + m) % m; // do we really need this?
	const inv = modInverse(bb, m);
	return (((inv * aa) % m) + m) % m;
}

// Function to find modulo inverse of b.
function modInverse(b, m = config.BN128_PRIME_FIELD) {
	const xy = [0n, 0n]; // used in extended GCD algorithm
	const g = gcdExtended(b, m, xy);
	if (g !== 1n) throw new Error("Numbers were not relatively prime");
	// m is added to handle negative x
	return ((xy[0] % m) + m) % m;
}

/**
Point addition on the babyjubjub curve
*/
function add(p, q) {
	const { JUBJUBA: a, JUBJUBD: d } = config.BABYJUBJUB;
  const Fp = config.BN128_GROUP_ORDER; // the prime field used with the curve E(Fp)
  const one = BigInt(1);
	const u1 = p[0];
	const v1 = p[1];
	const u2 = q[0];
	const v2 = q[1];
	const uOut = modDivide(u1 * v2 + v1 * u2, one + d * u1 * u2 * v1 * v2, Fp);
	const vOut = modDivide(
		v1 * v2 - a * u1 * u2,
		one - d * u1 * u2 * v1 * v2,
		Fp
	);
	if (!isOnCurve([uOut, vOut])) {
		throw new Error("Addition point is not on the babyjubjub curve");
  }
	return [uOut, vOut];
}

/*
Elliptic Curve arithmetic - isOnCurve
*/
function isOnCurve(p) {
  const { JUBJUBA: a, JUBJUBD: d } = config.BABYJUBJUB;
  const Fp = config.BN128_GROUP_ORDER; // the prime field used with the curve E(Fp)
  const one = BigInt(1);
  const uu = (p[0] * p[0]) % Fp;
  const vv = (p[1] * p[1]) % Fp;
  const uuvv = (uu * vv) % Fp;
  return (a * uu + vv) % Fp === (one + d * uuvv) % Fp;
}

/**
Create a Starlight compressed public key from a point
This is a quick fix to allow EC compressed keys (usually 256 bits) to fit into a field
It should be called by a function which retries until this doesn't return null
@param {GeneralNumber} publicKeyPoint
@return {GeneralNumber} publicKey
*/
function compressStarlightKey(publicKeyPoint) {
  const Fp = config.BN128_GROUP_ORDER; // the prime field used with the curve E(Fp)
	const yBits = publicKeyPoint[1].binary;
	if (yBits.length >= 253) return null;
	const xBits = publicKeyPoint[0].binary;
	const sign = xBits[xBits.length - 1];
	const publicKey = new GN(sign + yBits.padStart(253, "0"), "binary");
	if (publicKey.bigInt >= Fp) return null;
	return publicKey;
}

/**
Scalar multiplication on a babyjubjub curve
@param {String} scalar - scalar mod q (will wrap if greater than mod q, which is probably ok)
@param {Object} h - curve point in u,v coordinates
*/
function scalarMult(scalar, h, form = "Edwards") {
	const { INFINITY, JUBJUBE, JUBJUBC } = config.BABYJUBJUB;
  const Fq = JUBJUBE / JUBJUBC;
	const a = ((BigInt(scalar) % Fq) + Fq) % Fq; // just in case we get a value that's too big or negative
	const exponent = a.toString(2).split(""); // extract individual binary elements
	let doubledP = [...h]; // shallow copy h to prevent h being mutated by the algorithm
	let accumulatedP = INFINITY;
	for (let i = exponent.length - 1; i >= 0; i--) {
		const candidateP = add(accumulatedP, doubledP, form);
		accumulatedP = exponent[i] === "1" ? candidateP : accumulatedP;
		doubledP = add(doubledP, doubledP, form);
	}
	if (!isOnCurve(accumulatedP))
		throw new Error(
			"Scalar multiplication point is not on the babyjubjub curve"
		);
	return accumulatedP;
}

async function main() {

  const provider = new JsonRpcProvider(process.env.STARLIGHT_RPC_URL);
  const defaultAccountSigner = new ethers.Wallet(process.env.STARLIGHT_DEFAULT_ACCOUNT_KEY, provider);
  const defaultAccountAddress = await defaultAccountSigner.getAddress();
  console.log("Generating ECDH keys using BabyJubJub curve to the defaultAccount: ", 
  defaultAccountAddress);

  const registerNewKey = false;

  // Define the contract
  const escrowShieldContract = new ethers.Contract( 
    process.env.STARLIGHT_ESCROWSHIELD_ADDRESS, 
    abi, 
    defaultAccountSigner
  );
    
  console.log("Connected to ",
    process.env.STARLIGHT_ESCROWSHIELD_ADDRESS,
    "via this Ethereum JSON-RPC server: ", 
    process.env.STARLIGHT_RPC_URL
  );
  
  let secretKey;
  let publicKey;

  if (registerNewKey) {
    secretKey = generalise(generateRandomHex(31));
    let publicKeyPoint = generalise(
      scalarMult(secretKey.hex(32), config.BABYJUBJUB.GENERATOR),
    );
    publicKey = compressStarlightKey(publicKeyPoint);

    while (publicKey === null) {
      console.log("generated secret key is larger than public key - resetting...");
      secretKey = generalise(generateRandomHex(31));
      publicKeyPoint = generalise(
        scalarMult(secretKey.hex(32), config.BABYJUBJUB.GENERATOR),
      );
      publicKey = compressStarlightKey(publicKeyPoint);
    }

    console.log("Saving BabyJubJub ECDH key to EscrowShield Contract. They are:");
    console.log("secretKey:", secretKey.integer);
    console.log("publicKey:", publicKey.integer);

    const keyJson = {
      secretKey: secretKey.integer,
      publicKey: publicKey.integer, // not req
    };
    const keyJsonStringified = JSON.stringify(keyJson, null, 4);

    const keyDbPath =
      __dirname.substring(0, __dirname.lastIndexOf('zapp-swapescrow')) +
      'zapp-swapescrow/orchestration/common/db/key.json';
    
    console.log("Writing key\n", 
    keyJsonStringified, "\n",
    "to keyDbPath: ",
    keyDbPath);

    fs.writeFileSync(keyDbPath, keyJsonStringified);

  } else {
    const keyDbPath = 'key.json';
    const keyJson = JSON.parse(fs.readFileSync(keyDbPath, 'utf-8'));
    secretKey = generalise(keyJson.secretKey);
    publicKey = generalise(keyJson.publicKey);
    console.log("Reading BabyJubJub ECDH key from key.json. They are:");
    console.log("secretKey:", secretKey.integer);
    console.log("publicKey:", publicKey.integer);
  }

  const txParams = {
    gas: config.web3.options.defaultGas,
    gasPrice: config.web3.options.defaultGasPrice,
  };
  const tx = await escrowShieldContract.registerZKPPublicKey(publicKey.integer, txParams);
  console.log("registerKey - Transaction params to register public key in EscrowShield is:", 
  txParams);
  console.log("registerKey -",
  "Transaction has been sent and the tx hash to register public key in EscrowShield is:", 
  tx.hash);
  const txReceipt = await tx.wait()
  console.log("registerKey - Tx was processed. Result:", txReceipt.status);
  
  if (txReceipt.status !== 1) {
    console.error("registerKey - Transaction failed. Exiting...");
    return;
  }

  if (registerNewKey) {
    
  }

  const defaultAccountPubKey = await escrowShieldContract.zkpPublicKeys(defaultAccountAddress);
  console.log("defaultAccountPubKey registered into EscrowShield: ", defaultAccountPubKey);
}

try {
  main();
} catch (error) {
  console.error(error);
}