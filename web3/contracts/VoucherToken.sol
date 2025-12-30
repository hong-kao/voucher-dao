// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VoucherToken is ERC1155, Ownable{
    //token id => token name
    mapping (uint256 => string) public voucher_names;

    //token id => face value (in wei)
    mapping(uint256 => uint256) public face_values;

    //track token ids that have been created
    mapping(uint256 => bool) public token_exists;

    //events
    event VoucherTypeCreated(uint256 indexed token_id, string name, uint256 face_value);
    event VouchersMinted(address indexed to, uint256 indexed token_id, uint256 amount);
    event VouchersBurned(address indexed from, uint256 indexed token_id, uint256 amount);

    constructor() ERC1155("") Ownable(msg.sender){}

    function create_voucher_type(
        uint256 token_id, 
        string memory name,
        uint256 face_value
    ) external onlyOwner{
        require(!token_exists[token_id], "Token ID already exists");

        token_exists[token_id] = true;
        voucher_names[token_id] = name;
        face_values[token_id] = face_value;

        emit VoucherTypeCreated(token_id, name, face_value);
    }

    function mint(
        address to,
        uint256 token_id, 
        uint256 amount
    ) external onlyOwner{
        require(token_exists[token_id], "Token ID does not exist");

        _mint(to, token_id, amount, "");

        emit VouchersMinted(to, token_id, amount);
    }

    function mint_batch(
        address to,
        uint256[] memory token_ids,
        uint256[] memory amounts
    ) external onlyOwner{
        for(uint256 i=0; i<token_ids.length; i++){
            require(token_exists[token_ids[i]], "Token ID does not exist");
        }

        _mintBatch(to, token_ids, amounts, "");
    }

    function burn(
        address from,
        uint256 token_id,
        uint256 amount
    ) external {
        require(
            from == msg.sender || isApprovedForAll(from, msg.sender),
            "Not authorized to burn"
        );

        _burn(from, token_id, amount);
        emit VouchersBurned(from, token_id, amount);
    }

    function get_voucher_info(
        uint256 token_id
    ) external view returns (
        string memory name,
        uint256 face_value,
        bool exists
    ){
        return (voucher_names[token_id], face_values[token_id], token_exists[token_id]);
    }
}