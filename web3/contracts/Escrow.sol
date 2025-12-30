// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Escrow is ERC1155Holder, Ownable, ReentrancyGuard {
    IERC1155 public voucherToken;
    
    uint256 public escrowCounter;
    
    enum EscrowStatus { Active, Released, Refunded, Disputed }
    
    struct EscrowRecord {
        address seller;
        address buyer;
        uint256 voucherId;
        uint256 amount;
        uint256 ethAmount;
        EscrowStatus status;
        uint256 createdAt;
        bool exists;
    }
    
    mapping(uint256 => EscrowRecord) public escrows;
    
    event EscrowCreated(uint256 indexed escrowId, address indexed seller, address indexed buyer, uint256 voucherId, uint256 amount, uint256 ethAmount);
    event VoucherReleased(uint256 indexed escrowId, address indexed buyer);
    event EscrowRefunded(uint256 indexed escrowId, address indexed seller);
    event EscrowDisputed(uint256 indexed escrowId, address indexed disputer);
    event DisputeResolved(uint256 indexed escrowId, address winner);

    constructor(address _voucherToken) Ownable(msg.sender) {
        voucherToken = IERC1155(_voucherToken);
    }

    function createEscrow(
        address buyer,
        uint256 voucherId,
        uint256 amount,
        uint256 ethAmount
    ) external nonReentrant returns (uint256) {
        require(buyer != address(0), "Invalid buyer address");
        require(buyer != msg.sender, "Cannot create escrow with yourself");
        require(amount > 0, "Amount must be greater than 0");
        require(ethAmount > 0, "ETH amount must be greater than 0");
        
        voucherToken.safeTransferFrom(msg.sender, address(this), voucherId, amount, "");
        
        escrowCounter++;
        escrows[escrowCounter] = EscrowRecord({
            seller: msg.sender,
            buyer: buyer,
            voucherId: voucherId,
            amount: amount,
            ethAmount: ethAmount,
            status: EscrowStatus.Active,
            createdAt: block.timestamp,
            exists: true
        });
        
        emit EscrowCreated(escrowCounter, msg.sender, buyer, voucherId, amount, ethAmount);
        return escrowCounter;
    }

    function buyAndRelease(uint256 escrowId) external payable nonReentrant {
        EscrowRecord storage escrow = escrows[escrowId];
        
        require(escrow.exists, "Escrow does not exist");
        require(escrow.status == EscrowStatus.Active, "Escrow not active");
        require(msg.sender == escrow.buyer, "Only buyer can purchase");
        require(msg.value >= escrow.ethAmount, "Insufficient ETH sent");
        
        escrow.status = EscrowStatus.Released;
        
        voucherToken.safeTransferFrom(address(this), escrow.buyer, escrow.voucherId, escrow.amount, "");
        
        (bool success, ) = escrow.seller.call{value: escrow.ethAmount}("");
        require(success, "ETH transfer to seller failed");
        
        if(msg.value > escrow.ethAmount) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - escrow.ethAmount}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit VoucherReleased(escrowId, escrow.buyer);
    }

    function refundEscrow(uint256 escrowId) external nonReentrant {
        EscrowRecord storage escrow = escrows[escrowId];
        
        require(escrow.exists, "Escrow does not exist");
        require(escrow.status == EscrowStatus.Active, "Escrow not active");
        require(msg.sender == escrow.seller, "Only seller can refund");
        
        escrow.status = EscrowStatus.Refunded;
        
        voucherToken.safeTransferFrom(address(this), escrow.seller, escrow.voucherId, escrow.amount, "");
        
        emit EscrowRefunded(escrowId, escrow.seller);
    }

    function disputeEscrow(uint256 escrowId) external {
        EscrowRecord storage escrow = escrows[escrowId];
        
        require(escrow.exists, "Escrow does not exist");
        require(escrow.status == EscrowStatus.Active, "Escrow not active");
        require(msg.sender == escrow.seller || msg.sender == escrow.buyer, "Not a party to escrow");
        
        escrow.status = EscrowStatus.Disputed;
        
        emit EscrowDisputed(escrowId, msg.sender);
    }

    function resolveDispute(uint256 escrowId, bool releaseToBuyer) external onlyOwner nonReentrant {
        EscrowRecord storage escrow = escrows[escrowId];
        
        require(escrow.exists, "Escrow does not exist");
        require(escrow.status == EscrowStatus.Disputed, "Escrow not disputed");
        
        if(releaseToBuyer) {
            escrow.status = EscrowStatus.Released;
            voucherToken.safeTransferFrom(address(this), escrow.buyer, escrow.voucherId, escrow.amount, "");
            emit DisputeResolved(escrowId, escrow.buyer);
        } else {
            escrow.status = EscrowStatus.Refunded;
            voucherToken.safeTransferFrom(address(this), escrow.seller, escrow.voucherId, escrow.amount, "");
            emit DisputeResolved(escrowId, escrow.seller);
        }
    }

    function getEscrow(uint256 escrowId) external view returns (
        address seller,
        address buyer,
        uint256 voucherId,
        uint256 amount,
        uint256 ethAmount,
        EscrowStatus status,
        uint256 createdAt,
        bool exists
    ) {
        EscrowRecord memory escrow = escrows[escrowId];
        return (
            escrow.seller,
            escrow.buyer,
            escrow.voucherId,
            escrow.amount,
            escrow.ethAmount,
            escrow.status,
            escrow.createdAt,
            escrow.exists
        );
    }

    function getActiveEscrowsForUser(address user) external view returns (uint256[] memory) {
        uint256 count = 0;
        for(uint256 i = 1; i <= escrowCounter; i++) {
            if((escrows[i].seller == user || escrows[i].buyer == user) && escrows[i].status == EscrowStatus.Active) {
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for(uint256 i = 1; i <= escrowCounter; i++) {
            if((escrows[i].seller == user || escrows[i].buyer == user) && escrows[i].status == EscrowStatus.Active) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }
}
