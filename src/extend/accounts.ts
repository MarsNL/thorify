'use strict';

const Tx = require('thorjs-tx');
const debug = require('debug')('thor:injector');
import utils from '../utils';
import { StringorNull, StringorNumber, RawTransaction, Clause, Transaction, Callback } from '../types';

const extendAccounts = function (web3: any): any {
  
  let proto = Object.getPrototypeOf(web3.eth.accounts);
  
  // signTransaction supoorts both callback and promise style
  proto.signTransaction = function signTransaction(tx: RawTransaction, privateKey: any, callback: Callback) {
    
    debug('tx to sign: %O', tx);
    utils.checkRawTx(tx);
    // remove 
    if (tx.hasOwnProperty('gasPrice'))
      delete tx.gasPrice;
    if (tx.hasOwnProperty('from'))
      delete tx.gasPrice;
    
    return Promise.all([
      new Promise((resolve, reject) => {
        if (tx.ChainTag) {
          return resolve(tx.ChainTag);
        } else {
          return web3.eth.getChainTag().then(function (chainTag: string) {
            return resolve(chainTag);
          })
        }
      }),
      new Promise((resolve, reject) => {
        if (tx.BlockRef) {
          return resolve(tx.BlockRef);
        } else {
          web3.eth.getBlockRef().then(function (blockRef: string) {
            return resolve(blockRef);
          })
        }
      })
    ]).then((ret: any) => {
      tx.ChainTag = <string>ret[0];
      tx.BlockRef = <string>ret[1];

      debug(tx);
      let thorTx = Tx(tx);
      let rawTx = thorTx.serialize(utils.santizeHex(privateKey));
      let result = {
        rawTransaction: utils.toPrefixedHex(rawTx.toString('hex'))
      };

      if (callback) {
        callback(null, result);
      }

      return result;
    }).catch((e) => {
      return Promise.reject(e);
    });
  }

}


export default extendAccounts;