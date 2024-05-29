// SPDX-License-Identifier: CC0

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

import "./verify/IVerifier.sol";
import "./merkle-tree/MerkleTree.sol";
import "./ERC1155Token.sol";

contract SwapShield is MerkleTree {
    enum FunctionNames {
        depositErc20,
        depositErc1155,
        startSwapFromErc20ToErc1155,
        startSwapFromErc20ToErc20,
        startSwapFromErc1155ToErc1155,
        startSwapFromErc1155ToErc20,
        completeSwapFromErc20ToErc1155,
        completeSwapFromErc1155ToErc20,
        completeSwapFromErc20ToErc20,
        completeSwapFromErc1155ToErc1155,
        cancelSwap,
        withdrawErc20,
        withdrawErc1155,
        joinCommitments,
        splitCommitments
    }

    address deployer;

    IVerifier public verifier;

    mapping(uint256 => uint256[]) public vks; // indexed to by an enum uint(FunctionNames)

    event EncryptedData(uint256[] cipherText, uint256[2] ephPublicKey);

    mapping(uint256 => uint256) public nullifiers;

    mapping(uint256 => uint256) public commitmentRoots;

    uint256 public latestRoot;

    mapping(address => uint256) public zkpPublicKeys;

    struct Inputs {
        uint256[] newNullifiers;
        uint256 commitmentRoot;
        uint256[] newCommitments;
        uint256[][] cipherText;
        uint256[2][] encKeys;
        uint256[] customInputs;
    }

    IERC20 public erc20;
    IERC1155 public erc1155;

    error CommitmentNullified(uint256 nullifierId);
    error CommitmentRootDontExist();
    error ProofInvalid();
    error TransferFailed(address from, address to, uint256 amount);

    constructor(address verifierAddress) {
        verifier = IVerifier(verifierAddress);
        deployer = msg.sender;
    }

    function setVerificationKeys(uint256[][] memory vk) external {
        require(msg.sender == deployer, "Only the deployer can set the verification keys");
        for (uint256 i = 0; i < vk.length; i++) {
            vks[i] = vk[i];
        }
    }

    function registerZKPPublicKey(uint256 pk) external {
        zkpPublicKeys[msg.sender] = pk;
    }

    function verify(uint256[] calldata proof, uint256 functionId, Inputs memory _inputs) private {
        uint256[] memory customInputs = _inputs.customInputs;
        uint256[] memory newNullifiers = _inputs.newNullifiers;

        for (uint256 i = 0; i < newNullifiers.length; i++) {
            uint256 n = newNullifiers[i];
            if (nullifiers[n] != 0) 
          			require(nullifiers[n] == 0, "Nullifier already exists");
            nullifiers[n] = n;
        }

        uint256[] memory newCommitments = _inputs.newCommitments;
        if (commitmentRoots[_inputs.commitmentRoot] != _inputs.commitmentRoot) 
          require(commitmentRoots[_inputs.commitmentRoot] == _inputs.commitmentRoot, "Input commitmentRoot does not exist.");

        uint256 encInputsLen = 0;

        for (uint256 i = 0; i < _inputs.cipherText.length; i++) {
            encInputsLen += _inputs.cipherText[i].length + 2;
        }

        uint256[] memory inputs = new uint256[](
            customInputs.length + newNullifiers.length + (newNullifiers.length > 0 ? 1 : 0) + newCommitments.length
                + encInputsLen
        );

        if (functionId == uint256(FunctionNames.depositErc20)) {
            uint256 k = 0;

            inputs[k++] = customInputs[0];
            inputs[k++] = customInputs[1];
            inputs[k++] = newCommitments[0];
            inputs[k++] = 1;
        }

        if (functionId == uint256(FunctionNames.depositErc1155)) {
            uint256 k = 0;

            inputs[k++] = customInputs[0];
            inputs[k++] = customInputs[1];
            inputs[k++] = newCommitments[0];
            inputs[k++] = 1;
        }

        if (functionId == uint256(FunctionNames.startSwapFromErc20ToErc1155)) {
            uint256 k = 0;

            inputs[k++] = customInputs[0];
            inputs[k++] = newNullifiers[0];
            inputs[k++] = newNullifiers[1];
            inputs[k++] = _inputs.commitmentRoot;
            inputs[k++] = newCommitments[0];
            inputs[k++] = newNullifiers[2];
            inputs[k++] = newCommitments[1];
            for (uint256 j = 0; j < _inputs.cipherText[0].length; j++) {
                inputs[k++] = _inputs.cipherText[0][j];
            }
            inputs[k++] = _inputs.encKeys[0][0];
            inputs[k++] = _inputs.encKeys[0][1];
        }

        if (functionId == uint256(FunctionNames.startSwapFromErc20ToErc20)) {
            uint256 k = 0;

            inputs[k++] = customInputs[0];
            inputs[k++] = newNullifiers[0];
            inputs[k++] = newNullifiers[1];
            inputs[k++] = _inputs.commitmentRoot;
            inputs[k++] = newCommitments[0];
            inputs[k++] = newNullifiers[2];
            inputs[k++] = newCommitments[1];
            for (uint256 j = 0; j < _inputs.cipherText[0].length; j++) {
                inputs[k++] = _inputs.cipherText[0][j];
            }
            inputs[k++] = _inputs.encKeys[0][0];
            inputs[k++] = _inputs.encKeys[0][1];
        }

        if (functionId == uint256(FunctionNames.startSwapFromErc1155ToErc1155)) {
            uint256 k = 0;

            inputs[k++] = customInputs[0];
            inputs[k++] = newNullifiers[0];
            inputs[k++] = newNullifiers[1];
            inputs[k++] = _inputs.commitmentRoot;
            inputs[k++] = newCommitments[0];
            inputs[k++] = newNullifiers[2];
            inputs[k++] = newCommitments[1];
            for (uint256 j = 0; j < _inputs.cipherText[0].length; j++) {
                inputs[k++] = _inputs.cipherText[0][j];
            }
            inputs[k++] = _inputs.encKeys[0][0];
            inputs[k++] = _inputs.encKeys[0][1];
        }

        if (functionId == uint256(FunctionNames.startSwapFromErc1155ToErc20)) {
            uint256 k = 0;

            inputs[k++] = customInputs[0];
            inputs[k++] = newNullifiers[0];
            inputs[k++] = newNullifiers[1];
            inputs[k++] = _inputs.commitmentRoot;
            inputs[k++] = newCommitments[0];
            inputs[k++] = newNullifiers[2];
            inputs[k++] = newCommitments[1];
            for (uint256 j = 0; j < _inputs.cipherText[0].length; j++) {
                inputs[k++] = _inputs.cipherText[0][j];
            }
            inputs[k++] = _inputs.encKeys[0][0];
            inputs[k++] = _inputs.encKeys[0][1];
        }

        if (functionId == uint256(FunctionNames.completeSwapFromErc20ToErc1155)) {
            uint256 k = 0;

            inputs[k++] = newCommitments[0];
            inputs[k++] = newCommitments[1];
            inputs[k++] = newNullifiers[0];
            inputs[k++] = newNullifiers[1];
            inputs[k++] = _inputs.commitmentRoot;
            inputs[k++] = newCommitments[2];
            inputs[k++] = newNullifiers[2];
            inputs[k++] = newCommitments[3];
            for (uint256 j = 0; j < _inputs.cipherText[0].length; j++) {
                inputs[k++] = _inputs.cipherText[0][j];
            }
            inputs[k++] = _inputs.encKeys[0][0];
            inputs[k++] = _inputs.encKeys[0][1];
        }

        if (functionId == uint256(FunctionNames.completeSwapFromErc1155ToErc20)) {
            uint256 k = 0;

            inputs[k++] = newCommitments[0];
            inputs[k++] = newNullifiers[0];
            inputs[k++] = newNullifiers[1];
            inputs[k++] = _inputs.commitmentRoot;
            inputs[k++] = newCommitments[1];
            inputs[k++] = newCommitments[2];
            inputs[k++] = newNullifiers[2];
            inputs[k++] = newCommitments[3];
            for (uint256 j = 0; j < _inputs.cipherText[0].length; j++) {
                inputs[k++] = _inputs.cipherText[0][j];
            }
            inputs[k++] = _inputs.encKeys[0][0];
            inputs[k++] = _inputs.encKeys[0][1];
        }

        if (functionId == uint256(FunctionNames.completeSwapFromErc20ToErc20)) {
            uint256 k = 0;

            inputs[k++] = newCommitments[0];
            inputs[k++] = newNullifiers[0];
            inputs[k++] = newNullifiers[1];
            inputs[k++] = _inputs.commitmentRoot;
            inputs[k++] = newCommitments[1];
            inputs[k++] = newCommitments[2];
            inputs[k++] = newNullifiers[2];
            inputs[k++] = newCommitments[3];
            for (uint256 j = 0; j < _inputs.cipherText[0].length; j++) {
                inputs[k++] = _inputs.cipherText[0][j];
            }
            inputs[k++] = _inputs.encKeys[0][0];
            inputs[k++] = _inputs.encKeys[0][1];
        }

        if (functionId == uint256(FunctionNames.completeSwapFromErc1155ToErc1155)) {
            uint256 k = 0;

            inputs[k++] = newCommitments[0];
            inputs[k++] = newNullifiers[0];
            inputs[k++] = newNullifiers[1];
            inputs[k++] = _inputs.commitmentRoot;
            inputs[k++] = newCommitments[1];
            inputs[k++] = newCommitments[2];
            inputs[k++] = newNullifiers[2];
            inputs[k++] = newCommitments[3];
            for (uint256 j = 0; j < _inputs.cipherText[0].length; j++) {
                inputs[k++] = _inputs.cipherText[0][j];
            }
            inputs[k++] = _inputs.encKeys[0][0];
            inputs[k++] = _inputs.encKeys[0][1];
        }

        if (functionId == uint256(FunctionNames.cancelSwap)) {
            uint256 k = 0;
            inputs[k++] = newCommitments[0];
            inputs[k++] = newCommitments[1];
            inputs[k++] = newNullifiers[0];
            inputs[k++] = _inputs.commitmentRoot;
            inputs[k++] = newCommitments[2];
            inputs[k++] = 1;
        }

        if (functionId == uint256(FunctionNames.withdrawErc20)) {
            uint256 k = 0;

            inputs[k++] = customInputs[0];
            inputs[k++] = customInputs[1];
            inputs[k++] = newNullifiers[0];
            inputs[k++] = newNullifiers[1];
            inputs[k++] = _inputs.commitmentRoot;
            inputs[k++] = newCommitments[0];
            inputs[k++] = 1;
        }

        if (functionId == uint256(FunctionNames.withdrawErc1155)) {
            uint256 k = 0;

            inputs[k++] = customInputs[0];
            inputs[k++] = customInputs[1];
            inputs[k++] = newNullifiers[0];
            inputs[k++] = newNullifiers[1];
            inputs[k++] = _inputs.commitmentRoot;
            inputs[k++] = newCommitments[0];
            inputs[k++] = 1;
        }

        if (functionId == uint256(FunctionNames.joinCommitments)) {
            uint256 k = 0;
            inputs[k++] = newNullifiers[0];
            inputs[k++] = newNullifiers[1];
            inputs[k++] = _inputs.commitmentRoot;
            inputs[k++] = newCommitments[0];
            inputs[k++] = 1;
        }

        if (functionId == uint256(FunctionNames.splitCommitments)) {
            uint256 k = 0;
            inputs[k++] = newNullifiers[0];
            inputs[k++] = _inputs.commitmentRoot;
            inputs[k++] = newCommitments[0];
            inputs[k++] = newCommitments[1];
            inputs[k++] = 1;
        }

        bool result = verifier.verify(proof, inputs, vks[functionId]);
 
        require(result, "The proof has not been verified by the contract");

        if (newCommitments.length > 0) {
            latestRoot = insertLeaves(newCommitments);
            commitmentRoots[latestRoot] = latestRoot;
        }
    }

    function joinCommitments(
        uint256[] calldata newNullifiers,
        uint256 commitmentRoot,
        uint256[] calldata newCommitments,
        uint256[] calldata proof
    ) public {
        Inputs memory inputs;

        inputs.customInputs = new uint256[](1);
        inputs.customInputs[0] = 1;
        inputs.newNullifiers = newNullifiers;
        inputs.commitmentRoot = commitmentRoot;
        inputs.newCommitments = newCommitments;

        verify(proof, uint256(FunctionNames.joinCommitments), inputs);
    }

    function splitCommitments(
        uint256[] calldata newNullifiers,
        uint256 commitmentRoot,
        uint256[] calldata newCommitments,
        uint256[] calldata proof
    ) public {
        Inputs memory inputs;

        inputs.customInputs = new uint256[](1);
        inputs.customInputs[0] = 1;
        inputs.newNullifiers = newNullifiers;
        inputs.commitmentRoot = commitmentRoot;
        inputs.newCommitments = newCommitments;

        verify(proof, uint256(FunctionNames.splitCommitments), inputs);
    }

    uint256 public swapIdCounter;

    struct swapStruct {
        uint256 swapAmountSent;
        uint256 swapAmountRecieved;
        uint256 swapTokenSentId;
        uint256 swapTokenSentAmount;
        uint256 swapTokenRecievedId;
        uint256 swapTokenRecievedAmount;
        uint256 swapId;
        address swapSender;
        address swapReciever;
        address erc20AddressSent;
        address erc20AddressRecieved;
        uint256 pendingStatus;
    }

    function depositErc20(
        address erc20Address,
        uint256 amount,
        uint256[] calldata newCommitments,
        uint256[] calldata proof
    ) public {
        erc20 = IERC20(erc20Address);
        bool transferSuccessful = erc20.transferFrom(msg.sender, address(this), amount);
        if (!transferSuccessful) revert TransferFailed(msg.sender, address(this), amount);

        Inputs memory inputs;

        inputs.customInputs = new uint256[](3);
        inputs.customInputs[0] = uint256(uint160(address(erc20Address)));
        inputs.customInputs[1] = amount;
        inputs.customInputs[2] = 1;
        inputs.newCommitments = newCommitments;

        verify(proof, uint256(FunctionNames.depositErc20), inputs);
    }

    function depositErc1155(
        address erc1155Address,
        uint256 amount,
        uint256 tokenId,
        uint256[] calldata newCommitments,
        uint256[] calldata proof
    ) public {
        erc1155 = IERC1155(erc1155Address);
        erc1155.safeTransferFrom(msg.sender, address(this), tokenId, amount, " ");

        Inputs memory inputs;

        inputs.customInputs = new uint256[](3);
        inputs.customInputs[0] = amount;
        inputs.customInputs[1] = tokenId;
        inputs.customInputs[2] = 1;
        inputs.newCommitments = newCommitments;

        verify(proof, uint256(FunctionNames.depositErc1155), inputs);
    }

    function startSwapFromErc20ToErc1155(Inputs calldata inputs, uint256[] calldata proof) public {
        verify(proof, uint256(FunctionNames.startSwapFromErc20ToErc1155), inputs);

        for (uint256 j = 0; j < inputs.cipherText.length; j++) {
            // this seems silly (it is) but its the only way to get the event to emit properly
            uint256[2] memory ephKeyToEmit = inputs.encKeys[j];
            uint256[] memory cipherToEmit = inputs.cipherText[j];
            emit EncryptedData(cipherToEmit, ephKeyToEmit);
        }

        swapIdCounter++;
    }

    function startSwapFromErc20ToErc20(Inputs calldata inputs, uint256[] calldata proof) public {
        verify(proof, uint256(FunctionNames.startSwapFromErc20ToErc20), inputs);

        for (uint256 j = 0; j < inputs.cipherText.length; j++) {
            // this seems silly (it is) but its the only way to get the event to emit properly
            uint256[2] memory ephKeyToEmit = inputs.encKeys[j];
            uint256[] memory cipherToEmit = inputs.cipherText[j];
            emit EncryptedData(cipherToEmit, ephKeyToEmit);
        }

        swapIdCounter++;
    }

    function startSwapFromErc1155ToErc1155(Inputs calldata inputs, uint256[] calldata proof) public {
        verify(proof, uint256(FunctionNames.startSwapFromErc1155ToErc1155), inputs);

        for (uint256 j = 0; j < inputs.cipherText.length; j++) {
            // this seems silly (it is) but its the only way to get the event to emit properly
            uint256[2] memory ephKeyToEmit = inputs.encKeys[j];
            uint256[] memory cipherToEmit = inputs.cipherText[j];
            emit EncryptedData(cipherToEmit, ephKeyToEmit);
        }

        swapIdCounter++;
    }

    function startSwapFromErc1155ToErc20(Inputs calldata inputs, uint256[] calldata proof) public {
        verify(proof, uint256(FunctionNames.startSwapFromErc1155ToErc20), inputs);

        for (uint256 j = 0; j < inputs.cipherText.length; j++) {
            // this seems silly (it is) but its the only way to get the event to emit properly
            uint256[2] memory ephKeyToEmit = inputs.encKeys[j];
            uint256[] memory cipherToEmit = inputs.cipherText[j];
            emit EncryptedData(cipherToEmit, ephKeyToEmit);
        }

        swapIdCounter++;
    }

    function completeSwapFromErc20ToErc1155(Inputs calldata inputs, uint256[] calldata proof) public {
        verify(proof, uint256(FunctionNames.completeSwapFromErc20ToErc1155), inputs);

        for (uint256 j = 0; j < inputs.cipherText.length; j++) {
            // this seems silly (it is) but its the only way to get the event to emit properly
            uint256[2] memory ephKeyToEmit = inputs.encKeys[j];
            uint256[] memory cipherToEmit = inputs.cipherText[j];
            emit EncryptedData(cipherToEmit, ephKeyToEmit);
        }
    }

    function completeSwapFromErc1155ToErc20(Inputs calldata inputs, uint256[] calldata proof) public {
        verify(proof, uint256(FunctionNames.completeSwapFromErc1155ToErc20), inputs);

        for (uint256 j = 0; j < inputs.cipherText.length; j++) {
            // this seems silly (it is) but its the only way to get the event to emit properly
            uint256[2] memory ephKeyToEmit = inputs.encKeys[j];
            uint256[] memory cipherToEmit = inputs.cipherText[j];
            emit EncryptedData(cipherToEmit, ephKeyToEmit);
        }
    }

    function completeSwapFromErc20ToErc20(Inputs calldata inputs, uint256[] calldata proof) public {
        verify(proof, uint256(FunctionNames.completeSwapFromErc20ToErc20), inputs);

        for (uint256 j = 0; j < inputs.cipherText.length; j++) {
            // this seems silly (it is) but its the only way to get the event to emit properly
            uint256[2] memory ephKeyToEmit = inputs.encKeys[j];
            uint256[] memory cipherToEmit = inputs.cipherText[j];
            emit EncryptedData(cipherToEmit, ephKeyToEmit);
        }
    }

    function completeSwapFromErc1155ToErc1155(Inputs calldata inputs, uint256[] calldata proof) public {
        verify(proof, uint256(FunctionNames.completeSwapFromErc1155ToErc1155), inputs);

        for (uint256 j = 0; j < inputs.cipherText.length; j++) {
            // this seems silly (it is) but its the only way to get the event to emit properly
            uint256[2] memory ephKeyToEmit = inputs.encKeys[j];
            uint256[] memory cipherToEmit = inputs.cipherText[j];
            emit EncryptedData(cipherToEmit, ephKeyToEmit);
        }
    }

    function cancelSwap(
        uint256[] calldata newNullifiers,
        uint256 commitmentRoot,
        uint256[] calldata newCommitments,
        uint256[] calldata proof
    ) public {
        Inputs memory inputs;

        inputs.customInputs = new uint256[](1);
        inputs.customInputs[0] = 1;
        inputs.newNullifiers = newNullifiers;
        inputs.commitmentRoot = commitmentRoot;
        inputs.newCommitments = newCommitments;

        verify(proof, uint256(FunctionNames.cancelSwap), inputs);
    }

    function withdrawErc20(
        address erc20Address,
        uint256 amount,
        uint256[] calldata newNullifiers,
        uint256 commitmentRoot,
        uint256[] calldata newCommitments,
        uint256[] calldata proof
    ) public {
        Inputs memory inputs;

        inputs.customInputs = new uint256[](3);
        inputs.customInputs[0] = uint256(uint160(address(erc20Address)));
        inputs.customInputs[1] = amount;
        inputs.customInputs[2] = 1;
        inputs.newNullifiers = newNullifiers;
        inputs.commitmentRoot = commitmentRoot;
        inputs.newCommitments = newCommitments;

        verify(proof, uint256(FunctionNames.withdrawErc20), inputs);

        erc20 = IERC20(erc20Address);
        bool transferSuccessful = erc20.transfer(msg.sender, amount);
        if (!transferSuccessful) revert TransferFailed(address(this), msg.sender, amount);
    }

    function withdrawErc1155(
        uint256 tokenId,
        uint256 amount,
        uint256[] calldata newNullifiers,
        uint256 commitmentRoot,
        uint256[] calldata newCommitments,
        uint256[] calldata proof
    ) public {
        Inputs memory inputs;

        inputs.customInputs = new uint256[](3);
        inputs.customInputs[0] = tokenId;
        inputs.customInputs[1] = amount;
        inputs.customInputs[2] = 1;
        inputs.newNullifiers = newNullifiers;
        inputs.commitmentRoot = commitmentRoot;
        inputs.newCommitments = newCommitments;

        verify(proof, uint256(FunctionNames.withdrawErc1155), inputs);

        erc1155.safeTransferFrom(address(this), msg.sender, tokenId, amount, "");
    }

    function onERC1155Received(address, address, uint256, uint256, bytes memory) external pure returns (bytes4) {
        // here you can (but don't have to) define your own logic - emit an event, set a storage value, ...

        // this is the required return value described in the EIP-721
        return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
    }
}
