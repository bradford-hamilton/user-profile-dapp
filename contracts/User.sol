pragma solidity ^0.4.19;

contract UserProfile {
  mapping(address => uint) private addressToIndex;
  mapping(bytes16 => uint) private usernameToIndex;

  address[] private addresses;
  bytes16[] private usernames;
  bytes[] private ipfsHashes;

  function UserProfile() public {
    addresses.push(msg.sender);
    usernames.push('self');
    ipfsHashes.push('none');
  }

  function hasUser(address _userAddress) public view returns (bool) {
    return (addressToIndex[_userAddress] > 0 || _userAddress == addresses[0]);
  }

  function usernameTaken(bytes16 _username) public view returns (bool) {
    return (usernameToIndex[_username] > 0 || _username == 'self');
  }

  function createUser(bytes16 _username, bytes _ipfsHash) public returns (bool) {
    require(!hasUser(msg.sender));
    require(!usernameTaken(_username));

    addresses.push(msg.sender);
    usernames.push(_username);
    ipfsHashes.push(_ipfsHash);

    addressToIndex[msg.sender] = addresses.length - 1;
    usernameToIndex[_username] = addresses.length - 1;

    return true;
  }

  function updateUser(bytes _ipfsHash) public returns (bool) {
    require(hasUser(msg.sender));

    ipfsHashes[addressToIndex[msg.sender]] = _ipfsHash;

    return true;
  }

  function getUserCount() public view returns (uint) {
    return addresses.length;
  }

  function getAddressByIndex(uint _index) public view returns (address) {
    require(_index < addresses.length);

    return addresses[_index];
  }

  function getUsernameByIndex(uint _index) public view returns (bytes16) {
    require(_index < addresses.length);

    return usernames[_index];
  }

  function getIpfsHashByIndex(uint _index) public view returns (bytes) {
    require(_index < addresses.length);

    return ipfsHashes[_index];
  }

  function getUserByAddress(address _userAddress) public view returns (uint, bytes16, bytes) {
    return (
      addressToIndex[_userAddress],
      usernames[addressToIndex[_userAddress]],
      ipfsHashes[addressToIndex[_userAddress]]
    );
  }

  function getIndexByAddress(address _userAddress) public view returns (uint) {
    require(hasUser(_userAddress));

    return addressToIndex[_userAddress];
  }

  function getUsernameByAddress(address _userAddress) public view returns (bytes16) {
    require(hasUser(_userAddress));

    return usernames[addressToIndex[_userAddress]];
  }

  function getIpfsHashByAddress(address _userAddress) public view returns (bytes) {
    require(hasUser(_userAddress));

    return ipfsHashes[addressToIndex[_userAddress]];
  }

  function getUserByUsername(bytes16 _username) public view returns (uint, address, bytes) {
    return (
      usernameToIndex[_username],
      addresses[usernameToIndex[_username]],
      ipfsHashes[usernameToIndex[_username]]
    );
  }

  function getIndexByUsername(bytes16 _username) public view returns (uint) {
    require(usernameTaken(_username));

    return usernameToIndex[_username];
  }

  function getAddressByUsername(bytes16 _username) public view returns (address) {
    require(usernameTaken(_username));

    return addresses[usernameToIndex[_username]];
  }

  function getIpfsHashByUsername(bytes16 _username) public view returns (bytes) {
    require(usernameTaken(_username));

    return ipfsHashes[usernameToIndex[_username]];
  }
}
