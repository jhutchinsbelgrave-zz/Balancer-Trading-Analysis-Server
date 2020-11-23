var moment = require('moment');
const axios = require('axios').default;
var express = require('express');
var app = express();
const { port } = require('./config');
const { apiKey } = require('./config');
const { proxyAddr } = require('./config');
const cors = require("cors");

app.use(cors());

async function getBlockForTime(timestamp){
  const URL = `https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=${timestamp}&closest=before&apikey=${apiKey}`;
  const response = await axios.get(URL);
  const data = await response.data.result;
  return data;
}


async function getTransactions(startBlock, endBlock) {
	  //const proxyAddr = `0x6317C5e82A06E1d8bf200d21F4510Ac2c038AC81`;
    console.log(`Fetching Txs For ${proxyAddr} for blocks: ${startBlock}-${endBlock}`);

    const URL = `https://api.etherscan.io/api?module=account&action=txlist&address=${proxyAddr}&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${apiKey}`;

    const response = await axios.get(URL);
    const data = await response.data.result;
    return data;
}

async function createTimes(start, end, interval) {
	var endTime = moment();
	var startTime = endTime.clone().subtract(interval, 'days').unix();
	endTime = endTime.unix();
	return [startTime, endTime]
}

async function getBlocksforEachTime(startTime, endTime) {
	const startblock = Number(await getBlockForTime(startTime));
	const endblock = Number(await getBlockForTime(endTime));
	return [startblock, endblock]
}

async function getTranscation(startTime, endTime) {
  s = moment(startTime.valueOf().toString()).format('MM/DD/YYYY h:mm a');
  e = moment(endTime.valueOf().toString()).format('MM/DD/YYYY h:mm a');
  s = moment(s, 'MM/DD/YYYY h:mm a').unix();
  e = moment(e, 'MM/DD/YYYY h:mm a').unix();
  console.log(s);
  console.log(e);
  console.log("Errrr");
	var [startblock, endblock] = await getBlocksforEachTime(s, e);
	console.log(startblock);
	console.log(endblock);

  var trx = [];
  
  if (startblock == endblock) {
    let txsRange = await getTransactions(startblock, endblock);
		console.log("The tx length");
		console.log(txsRange.length);
		trx = trx.concat(txsRange);
  }

	while(startblock < endblock) {
		let endRange = startblock + 15000;
		let txsRange = await getTransactions(startblock, endRange);
		console.log("The tx length");
		console.log(txsRange.length);
		trx = trx.concat(txsRange);
		startblock = endRange + 1;
  }
  
  

	console.log(trx[0]);
	console.log(trx.length);
	startTime = moment.unix(startTime).format('dddd, MMMM Do, YYYY h:mm:ss A');
	endTime = moment.unix(endTime).format('dddd, MMMM Do, YYYY h:mm:ss A');
	return [trx, startblock, endblock, startTime, endTime];
}

async function getTotalTranscationData() {
	console.log('Starting');
	var [startTime, endTime] = await createTimes(null, null, 14);
	var [startblock, endblock] = await getBlocksforEachTime(startTime, endTime);
	console.log(startblock);
	console.log(endblock);

	var trx = [];

	while(startblock < endblock) {
		let endRange = startblock + 15000;
		let txsRange = await getTransactions(startblock, endRange);
		console.log("The tx length");
		console.log(txsRange.length);
		trx = trx.concat(txsRange);
		startblock = endRange + 1;
	}

	console.log(trx[0]);
	console.log(trx.length);
	startTime = moment.unix(startTime).format('dddd, MMMM Do, YYYY h:mm:ss A');
	endTime = moment.unix(endTime).format('dddd, MMMM Do, YYYY h:mm:ss A');
	return [trx, startblock, endblock, startTime, endTime];
}

async function getGasUsageStats(trx, trxLength) {
  var maxTx = null;
  var max = Number.MIN_VALUE;
  var minTx = null;
  var min = Number.MAX_VALUE;
  var avg = 0;

  for (index = 0; index < trxLength; index++) {
  	tx = trx[index];
  	gas = Number(tx.gasUsed);

  	if (gas > max) {
  		maxTx = tx;
  		max = gas;
  	}

  	if (gas < min) {
  		minTx = tx;
  		min = gas;
  	}

  	avg += gas;

  }

  avg = avg / trxLength;

  return [maxTx, max, minTx, min, avg]
}

async function getGasPricingStats(trx, trxLength) {
  var maxTx = null;
  var max = Number.MIN_VALUE;
  var minTx = null;
  var min = Number.MAX_VALUE;
  var avg = 0;

  for (index = 0; index < trxLength; index++) {
  	tx = trx[index];
  	gasPr = Number(tx.gasPrice);

  	if (gasPr > max) {
  		maxTx = tx;
  		max = gasPr;
  	}

  	if (gasPr < min) {
  		minTx = tx;
  		min = gasPr;
  	}

  	avg += gasPr;

  }

  avg = avg / trxLength;

  return [maxTx, max, minTx, min, avg]
}

async function getTrxFailureReport(trx, trxLength) {
  var failures = 0;
  var contractExecFail = 0;
  var transactionExecFail = 0;
  var passes = 0;

  for (index = 0; index < trxLength; index++) {
  	tx = trx[index];
  	var contractExec = Number(tx.isError);
  	var transactionExec = Number(tx.txreceipt_status);

  	if (contractExec == 1) {
  		contractExecFail++;
  	}

  	if (transactionExec == 0) {
  		transactionExecFail++;
  	}

  	if(contractExec == 0 && transactionExec == 1){
  		passes++;
  	} else {
  		failures++;
  	}

  }

  return [failures, contractExecFail, transactionExecFail, passes];
}

async function getTradingVolume(trx, trxLength) {
	tr = trx[0];

	//const URL = `https://api.etherscan.io/api?module=account&action=txlist&address=${proxyAddr}&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${apiKey}`;
}


app.get('/', async function (req, res) {
  console.log("bang");
  res.send({message: 'Hello World!!!!!!!!'});
});

app.get('/gas-usage', async function (req, res) {
  var [trx, startblock, endblock, startTime, endTime] = await getTotalTranscationData();
  const trxLength = trx.length;

  var [maxTx, max, minTx, min, avg] = await getGasUsageStats(trx, trxLength);


  res.write(`~~~~~~~~~~Gas Usage Report for ${startTime} - ${endTime} ~~~~~~~~~~~`);
  res.write('\n \n \n \n \n \nMax Gas Usage per Transaction is:  ');
  res.write(max.toString());
  res.write('\n--> From Transaction: \n');
  res.write(JSON.stringify(maxTx));


  res.write('\n \n \n \n \n \nMin Gas Usage per Transaction is:   ')
  res.write(min.toString());
  res.write('\n--> From Transaction:');
  res.write(JSON.stringify(minTx));

  res.write('\n \n \n \n \n \nAvgerage Gas Usage per Transaction is:  ')
  res.write(avg.toString());
  res.end();
});

app.get('/gas-pricing', async function (req, res) {
  var [trx, startblock, endblock, startTime, endTime] = await getTotalTranscationData();
  const trxLength = trx.length;

  var [maxTx, max, minTx, min, avg] = await getGasPricingStats(trx, trxLength);

  res.write(`~~~~~~~~~~Gas Pricing Report for ${startTime} - ${endTime}~~~~~~~~~~~`);
  res.write('\n \n \n \n \n \nMax Gas Price per Transaction is:  ');
  res.write(max.toString());
  res.write('\n--> From Transaction: \n');
  res.write(JSON.stringify(maxTx));


  res.write('\n \n \n \n \n \nMin Gas Price per Transaction is:   ')
  res.write(min.toString());
  res.write('\n--> From Transaction:');
  res.write(JSON.stringify(minTx));

  res.write('\n \n \n \n \n \nAvgerage Gas Price per Transaction is:  ')
  res.write(avg.toString());
  res.end();
});

app.get('/tx-failure-report', async function (req, res) {
  var [trx, startblock, endblock, startTime, endTime] = await getTotalTranscationData();
  const trxLength = trx.length;

  var [failures, contractExecFail, transactionExecFail, passes] = await getTrxFailureReport(trx, trxLength);

  res.write(`~~~~~~~~~~Transaction Failure Report for ${startTime} - ${endTime}~~~~~~~~~~~`);
  res.write('\n \n \n \n \n \nTotal number of Contract Execution Failures is:  ');
  res.write(contractExecFail.toString());

  res.write('\n \n \n \n \n \nTotal number of Transaction Execution Failures is:  ')
  res.write(transactionExecFail.toString());

  res.write('\n \n \n \n \n \nTotal number of Failures is: ')
  res.write(failures.toString());
  res.write('\nFail Rate: ')
  res.write(((failures / trxLength) * 100).toString() + "%");

  res.write('\n \n \n \n \n \nTotal number of Passes is: ')
  res.write(passes.toString());
  res.write('\nPass Rate: ')
  res.write(((passes / trxLength) * 100).toString() + "%");

  res.end();
});

app.get('/trading-volume', async function (req, res) {
  var [trx, startblock, endblock, startTime, endTime] = await getTotalTranscationData();
  const trxLength = trx.length;

  var [failures, contractExecFail, transactionExecFail, passes] = await getTradingVolume(trx, trxLength, endblock);

  res.write(`~~~~~~~~~~Trading Report for ${startTime} - ${endTime}~~~~~~~~~~~`);
  res.write('\n \n \n \n \n \nTotal number of Contract Execution Failures is:  ');
  res.write(contractExecFail.toString());

  res.write('\n \n \n \n \n \nTotal number of Transaction Execution Failures is:  ')
  res.write(transactionExecFail.toString());

  res.write('\n \n \n \n \n \nTotal number of Failures is: ')
  res.write(failures.toString());
  res.write('\nFail Rate: ')
  res.write(((failures / trxLength) * 100).toString() + "%");

  res.write('\n \n \n \n \n \nTotal number of Passes is: ')
  res.write(passes.toString());
  res.write('\nPass Rate: ')
  res.write(((passes / trxLength) * 100).toString() + "%");

  res.end();
});

app.get('/getTransactions', async function (req, res) {
  console.log(req.query);
  const [startTime, endTime] = [req.query.start, req.query.end];
  
  var [trx, startblock, endblock, startT, endT] = await getTranscation(startTime, endTime);
  const trxLength = trx.length;
  console.log(trx[1]);
  console.log(trxLength);


  //res.send({transactions: JSON.stringify(trx[1])});
  res.send({transactions: trx});
});



app.listen(port || 5000, function () {
  console.log(`Example app listening on port ${port}!`);
});

