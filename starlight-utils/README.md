# Check EscrowShield Member Registered Public Key

This small plugin registers Zapp user's public key or query if it is registered in the EscrowShield 
contract. This is necessary for transfers. The sender needs to know the receipient's public key 
to encrypt the commitment. Starlight uses ECDH to it. The keys are based o Baby JubJub Elliptic Curve -
https://docs.iden3.io/publications/pdfs/Baby-Jubjub.pdf

## Usage

Check the ABI referencies in register.js and query.js.
Also, adjust .env file with RPC Url data, EscrowShield contract, sender, receipient addresses parameters.
Then:

### To generate and register new Public Key

```shell
npm install
node register.js
```

### To query the Public Key for existing accounts

Do not forget to edit query.js file and to set the accounts you want to query.

```shell
npm install
node query.js
```
