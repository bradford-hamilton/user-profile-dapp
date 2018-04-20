/* eslint-disable */
import Web3 from 'web3';
import contract from 'truffle-contract';
import ipfsAPI from 'ipfs-api';
import jQuery from 'jquery';
import 'bootstrap';

import userProfileAbi from '../../build/contracts/UserProfile.json';
import '../stylesheets/app.scss';

window.$ = window.jQuery = jQuery;

var accounts;
var account;
var UserProfile = contract(userProfileAbi);

// local node
// const ipfs = ipfsAPI('localhost', '5001');
const ipfs = ipfsAPI('ipfs.infura.io', '5001', {protocol: 'https'});

window.App = {
  start: function() {
    var self = this;

    ipfs.id(function(err, res) {
      if (err) throw err
      console.log('Connected to IPFS node!', res.id, res.agentVersion, res.protocolVersion);
    });

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err !== null) {
        alert('There was an error fetching your accounts.');
        return;
      }

      if (accs.length == 0) {
        alert('Couldn\'t get any accounts! Make sure your Ethereum client is configured correctly.');
        return;
      }

      accounts = accs;
      account = accounts[0];
      UserProfile.setProvider(web3.currentProvider);

      var ethAddressIput = $('#sign-up-eth-address').val(accounts[0]);

      $('#sign-up-button')
        .click(function(e) {
          e.preventDefault();
          self.createUser();
          return false;
        });

      self.getUsers();
    });
  },

  createUser: function() {
    var username = $('#sign-up-username').val();
    var title = $('#sign-up-title').val();
    var intro = $('#sign-up-intro').val();
    var ipfsHash = 'none';
    var app;

    console.log('Creating user: ', username, title, intro, ipfsHash);

    UserProfile.deployed()
      .then(function(instance) {
        instance.createUser(username, ipfsHash, { gas: 200000, from: web3.eth.accounts[0] })
          .then(function() {
            console.log('Great Success!');
          })
          .catch(function(error) {
            console.log('Error: ', error);
          });
    });
  },

  getSingleUser: function(instance, i) {
    var instanceUsed = instance;
    var username;
    var ipfsHash;
    var address;
    var userCardId = 'user-card-' + i;

    return instanceUsed.getUsernameByIndex.call(i)
      .then(function(_username) {
        console.log('username:', username = web3.toAscii(_username), i);
        $('#' + userCardId).find('.card-title').text(username);

        return instanceUsed.getIpfsHashByIndex.call(i);
      })
      .then(function(_ipfsHash) {
        console.log('ipfsHash:', ipfsHash = web3.toAscii(_ipfsHash), i);

        if (ipfsHash !== 'none') {
          var url = 'https://ipfs.io/ipfs/' + ipfsHash;

          console.log('getting user info from', url);

          $.getJSON(url, function(userJson) {
            console.log('got user info from ipfs', userJson);
            $('#' + userCardId).find('.card-subtitle').text(userJson.title);
            $('#' + userCardId).find('.card-text').text(userJson.intro);
          });
        }

        return instanceUsed.getAddressByIndex.call(i);
      })
      .then(function(_address) {
        console.log('address:', address = _address, i);
        $('#' + userCardId).find('.card-eth-address').text(address);

        return true;
      })
      .catch(function(error) {
        // There was an error! Handle it.
        console.log('error getting user #', i, ':', error);
      });
  },

  getUsers: function() {
    var self = this;
    var instanceUsed;

    UserProfile.deployed()
      .then(function(contractInstance) {

        instanceUsed = contractInstance;

        return instanceUsed.getUserCount.call();

      })
      .then(function(userCount) {
        userCount = userCount.toNumber();

        console.log('User count', userCount);

        var rowCount = 0;
        var usersDiv = $('#users-div');
        var currentRow;

        for (var i = 0; i < userCount; i++) {
          var userCardId = 'user-card-' + i;

          if(i % 4 == 0) {
            var currentRowId = 'user-row-' + rowCount;
            var userRowTemplate = '<div class="row" id="' + currentRowId + '"></div>';
            usersDiv.append(userRowTemplate);
            currentRow = $('#' + currentRowId);
            rowCount++;
          }

          var userTemplate = `
            <div class="col-lg-3 mt-1 mb-1" id="` + userCardId + `">
              <div class="card bg-gradient-primary text-white card-profile p-1">
                <div class="card-body">
                  <h5 class="card-title"></h5>
                  <h6 class="card-subtitle mb-2"></h6>
                  <p class="card-text"></p>
                  <p class="eth-address m-0 p-0">
                    <span class="card-eth-address"></span>
                  </p>
                </div>
              </div>
            </div>`;
          currentRow.append(userTemplate);
        }

        console.log("getting users...");

        for (var i = 0; i < userCount; i++) {
          self.getSingleUser(instanceUsed, i);
        }
      });
  },
};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn(`
      Using web3 detected from external source. If you find that your accounts
      don't appear or you have 0 MetaCoin, ensure you've configured that source
      properly. If using MetaMask, see the following link. Feel free to delete this
      warning. :) http://truffleframework.com/tutorials/truffle-and-metamask
    `);
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn(`
      No web3 detected. Falling back to http://127.0.0.1:9545. You should remove
      this fallback when you deploy live, as it's inherently insecure. Consider
      switching to Metamask for development. More info here:
      http://truffleframework.com/tutorials/truffle-and-metamask
    `);
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9545'));
  }

  App.start();
});
