pragma solidity ^0.8.0;

contract MidnightAccessControl {
    mapping(string => address) private fileOwners;
    mapping(string => mapping(address => bool)) private fileAccess;

    event FileRegistered(string fileCID, address owner);
    event AccessGranted(string fileCID, address user);
    event AccessRevoked(string fileCID, address user);

    function registerFile(string memory fileCID) public {
        require(fileOwners[fileCID] == address(0), "File already registered");
        fileOwners[fileCID] = msg.sender;
        fileAccess[fileCID][msg.sender] = true;
        emit FileRegistered(fileCID, msg.sender);
    }

    function grantAccess(string memory fileCID, address user) public {
        require(fileOwners[fileCID] == msg.sender, "Not the file owner");
        fileAccess[fileCID][user] = true;
        emit AccessGranted(fileCID, user);
    }

    function revokeAccess(string memory fileCID, address user) public {
        require(fileOwners[fileCID] == msg.sender, "Not the file owner");
        fileAccess[fileCID][user] = false;
        emit AccessRevoked(fileCID, user);
    }

    function isAuthorized(string memory fileCID, address user) public view returns (bool) {
        if(fileOwners[fileCID] == address(0)) {
            return false; // File not registered
        }
        return fileAccess[fileCID][user];
    }


    
}
