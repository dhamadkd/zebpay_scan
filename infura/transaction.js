const Web3 = require("web3");
const infura_config = require("../config/infura_chains.json")

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

const rpcUrl = infura_config['protocol'] + infura_config['chains'][0] + infura_config['chain_suffix'] + infura_config['api_key'];
const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

const getTransactionByHash = async function(txid) {
  let receipt = null;
  try{
    receipt = await web3.eth.getTransaction(txid.toString());
  }
  catch(err){
    console.log("method error: " + err);
    return {"message":"Invalid transaction ID on mainnet"};
  }

  if(receipt){
    if(receipt['value'] != 0){
      let result = {};
      result["block"] = {"blockHeight": receipt["blockNumber"]};
      result["outs"] = [
        {
          "address": receipt["to"],
          "value": receipt["value"]
        }
      ];
      result["ins"] = [
        {
          "address": receipt["from"],
          "value": "-" + receipt["value"]
        }
      ];
      result["hash"]= receipt["hash"];
      result["currency"] = "ETH";
      result["chain"] = "ETH.main";
      result["state"] = "confirmed";
      result["depositType"] = "account";
      return result;
  }
  else{
    let receipt =  await web3.eth.getTransactionReceipt(txid.toString());
      let result = {};
      result["block"] = {"blockHeight": receipt["blockNumber"]};
      let out_arr = [];
      let in_arr = [];
      for(i=0;i<receipt["logs"].length;i++){
        if(receipt["logs"][i]["topics"][0] == '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef')
        {
          let out_tx = {
            "address": AddressWithoutPadding(receipt["logs"][i]["topics"][2]),
            "value": web3.utils.toBN(receipt["logs"][i]["data"]).toString(),
            "type": "transfer",
            "coinspecific": {
              "tokenAddress": receipt["logs"][i]["address"]
            }
          };
          out_arr.push(out_tx)
          let in_tx =         {
            "address": AddressWithoutPadding(receipt["logs"][i]["topics"][1]),
            "value": "-" + web3.utils.toBN(receipt["logs"][i]["data"]).toString(),
            "type": "transfer",
            "coinspecific": {
              "tokenAddress": receipt["logs"][i]["address"]
            }
          }
          in_arr.push(in_tx);
        }
      }
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
}

const getTransactionReceipt = async function(txid) {
        return await web3.eth.getTransactionReceipt(txid.toString());
}

exports.getTransactionByHash = getTransactionByHash;
// exports.getTransactionReceipt = getTransactionReceipt;

