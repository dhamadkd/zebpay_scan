const Web3 = require("web3");
const infura_config = require("../config/infura_chains.json")


// Unpad address method
const AddressWithoutPadding = function (address)
    {
        if (address.startsWith("0x"))
            address = address.substr(2);
        do
        {
            if (address.startsWith("00"))
            {
                address = address.substr(2);
            }
            else
                break;
        } while (true);
        return "0x" + address;
    }

//fetch information from infura config and create provider url for web3
//make changes in config to use different chain or api key on infura
const rpcUrl = infura_config['protocol'] + infura_config['chain'] + infura_config['chain_suffix'] + infura_config['api_key'];
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

const getTransactionInfo = async function(txid) {
  let tx = null;
  try{
    tx = await web3.eth.getTransaction(txid.toString());
  }
  catch(err){
    console.log("error: " + err.toString());
    return {"error:" : err.toString()};
  }
  try{
    if(tx){
      if(tx['value'] != 0){ // It is a normal ether transaction
        let result = {};
        result["block"] = {"blockHeight": tx["blockNumber"]};
        result["outs"] = [
          {
            "address": tx["to"],
            "value": tx["value"]
          }
        ];
        result["ins"] = [
          {
            "address": tx["from"],
            "value": "-" + tx["value"]
          }
        ];
        result["hash"]= tx["hash"];
        result["currency"] = "ETH";
        result["chain"] = "ETH.main";
        result["state"] = "confirmed";
        result["depositType"] = "account";
        return result;
      }
      else { // it is a token transfer of contract execution
        let receipt =  await web3.eth.getTransactionReceipt(txid.toString());
        let result = {};
        result["block"] = {"blockHeight": receipt["blockNumber"]};
        let out_arr = [];
        let in_arr = [];
        for(i=0;i<receipt["logs"].length;i++){
          // for token transfer first log topic code is 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
          if(receipt["logs"][i]["topics"][0] == '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef')
          {
            let out_tx = {
              "address": AddressWithoutPadding(receipt["logs"][i]["topics"][2]),// third value in topics is receipient address
              "value": web3.utils.toBN(receipt["logs"][i]["data"]).toString(),
              "type": "token",
              "coinspecific": {
              "tokenAddress": receipt["logs"][i]["address"]
              }
            };
            out_arr.push(out_tx)
            let in_tx = {
              "address": AddressWithoutPadding(receipt["logs"][i]["topics"][1]),// second value in topics is sender address
              "value": "-" + web3.utils.toBN(receipt["logs"][i]["data"]).toString(),
              "type": "token",
              "coinspecific": {
                "tokenAddress": receipt["logs"][i]["address"]
              }
            }
            in_arr.push(in_tx);
          }
          else if(receipt["logs"][i]["topics"][0]=='0x59bed9ab5d78073465dd642a9e3e76dfdb7d53bcae9d09df7d0b8f5234d5a806'){
            let tx_input = tx.input;
            let input_data = '0x' + tx_input.slice(10);  // get only data without function selector
            let params = web3.eth.abi.decodeParameters(['address','uint256'], input_data);
            let out_tx = {
              "address": params[0],
              "value": params[1],
              "type": "transfer",
              "coinspecific": {
              "tracehash": receipt["transactionHash"]
              }
            };
            out_arr.push(out_tx)
            let in_tx = {
              "address": receipt["to"],
              "value": '-' +  params[1],
              "type": "transfer",
              "coinspecific": {
                "tracehash": receipt["transactionHash"]
              }
            }
            in_arr.push(in_tx);
          }
        }
        // following are the common output for both token transfer and contract execution
        result["outs"] = out_arr;
        result["ins"] = in_arr;
        result["hash"]= receipt["hash"];
        result["currency"] = "ETH";
        result["chain"] = "ETH.main";
        result["state"] = "confirmed";
        result["depositType"] = "Contract";
        return result;
      }    
    }
    else{
      console.log("Message: " +   "Invalid transaction ID on mainnet");
      return {"Message" : "Invalid transaction ID on mainnet"};
    }
  }
  catch(err){
    console.log("error: " + err.toString());
    return {"error:" : "Some error occured"};
  }
}

// const getTransactionReceipt = async function(txid) {
//         return await web3.eth.getTransactionReceipt(txid.toString());
// }

exports.getTransactionInfo = getTransactionInfo;
// exports.getTransactionReceipt = getTransactionReceipt;

