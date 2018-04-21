/* eslint-disable */
import Web3 from 'web3';
import contract from 'truffle-contract';
import ipfsAPI from 'ipfs-api';
import jQuery from 'jquery';
import 'bootstrap';
import userProfileAbi from '../../build/contracts/UserProfile.json';
import '../stylesheets/app.scss';

const UserProfile = contract(userProfileAbi);
// local node
// const ipfs = ipfsAPI('localhost', '5001');
const ipfs = ipfsAPI('ipfs.infura.io', '5001', { protocol: 'https' });
let accounts;
let account;

window.$ = window.jQuery = jQuery;

window.App = {
  start() {
    const self = this;

    ipfs.id((err, res) => {
      if (err) throw err
      console.log(`
        Connected to IPFS node! ${res.id}, ${res.agentVersion}, ${res.protocolVersion}
      `);
    });

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts((err, accs) => {
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

      const ethAddressIput = $('#sign-up-eth-address').val(accounts[0]);

      $('#sign-up-button')
        .click((event) => {
          event.preventDefault();
          self.createUser();
          return false;
        });

      self.getUsers();
    });
  },

  createUser() {
    const username = $('#sign-up-username').val();
    const title = $('#sign-up-title').val();
    const intro = $('#sign-up-intro').val();
    let ipfsHash = '';
    const userJson = {
      username: username,
      title: title,
      intro: intro
    };
    const buffer = [Buffer.from(JSON.stringify(userJson))];
    let app;

    ipfs.add(buffer, (err, res) => {
      if (err) throw err
      ipfsHash = res[0].hash

      UserProfile.deployed()
        .then((instance) => {
          instance.createUser(
            username,
            ipfsHash,
            { gas: 200000, from: web3.eth.accounts[0] }
          )
          .then(() => console.log('Great Success!'))
          .catch((error) => console.log('Error: ', error));
        });
    });
  },

  getSingleUser(instance, i) {
    const instanceUsed = instance;
    const userCardId = `user-card-${i}`;
    let username;
    let ipfsHash;
    let address;

    return instanceUsed.getUsernameByIndex.call(i)
      .then((username) => {
        $(`#${userCardId}`).find('.card-title').text(username);

        return instanceUsed.getIpfsHashByIndex.call(i);
      })
      .then((ipfsHash) => {
        const asciiHash = web3.toAscii(ipfsHash);

        if (asciiHash !== 'none') {
          const url = `https://ipfs.io/ipfs/${asciiHash}`;

          $.getJSON(url, (userJson) => {
            $(`#${userCardId}`).find('.card-subtitle').text(userJson.title);
            $(`#${userCardId}`).find('.card-text').text(userJson.intro);
          });
        }

        return instanceUsed.getAddressByIndex.call(i);
      })
      .then((resAddress) => {
        address = resAddress;
        $(`#${userCardId}`).find('.card-eth-address').text(address);

        return true;
      })
      .catch((error) => console.log(`Error getting user #${i}: ${error}`));
  },

  getUsers() {
    const self = this;
    let instanceUsed;

    UserProfile.deployed()
      .then((contractInstance) => {
        instanceUsed = contractInstance;

        return instanceUsed.getUserCount.call();
      })
      .then((userCount) => {
        userCount = userCount.toNumber();

        const usersDiv = $('#users-div');
        let rowCount = 0;
        let currentRow;

        for (var i = 0; i < userCount; i++) {
          const userCardId = `user-card-${i}`;

          if (i % 4 == 0) {
            const currentRowId = `user-row-${rowCount}`;
            const userRowTemplate = `<div class="row" id="${currentRowId}"></div>`;
            usersDiv.append(userRowTemplate);
            currentRow = $(`#${currentRowId}`);
            rowCount++;
          }

          var userTemplate = `
            <div class="col-lg-3 mt-1 mb-1" id="${userCardId}">
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
            </div>
          `;
          currentRow.append(userTemplate);
        }

        for (var i = 0; i < userCount; i++) {
          self.getSingleUser(instanceUsed, i);
        }
      });
  },
};

window.addEventListener('load', () => {
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
