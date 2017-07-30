const express = require('express');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const path = require('path');
const exec = require('child_process').exec;
const PORT = 3000;
const app = express();
const Raspi = require('raspi-io');
const five = require('johnny-five');
const board = new five.Board({
	io: new Raspi()
});

const ops = {
	'forwards': function () {opsforward()},
	'backwards': function () {opsbackward()},
	'turnleft': function () {opsturnleft()},
	'turnright': function () {opsturnright()},
	'spinleft': function () {opsspinleft()},
	'spinright': function () {opsspinright()},
	'stop': function () {opsstop()}
};

// pin left-front, left-back, right-front, right-back
const CONFIG = ({
	port: 3000,
	readyPIN: 'P1-18',
	pins: ['P1-21',	'P1-23', 'P1-22', 'P1-24'],
	operations: ops
});

var pinReady, opspins = [];

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use('/static', express.static(path.join(__dirname, 'public')));

app.engine('.hbs', exphbs({  
	defaultLayout: 'main',
	extname: '.hbs',
	layoutsDir: path.join(__dirname, 'views/layouts')
}));

app.set('view engine', '.hbs');  
app.set('views', path.join(__dirname, 'views')) ;

app.get('/', function (req, res) {
	res.render('index');
});

app.post('/operate', function (request, response){
	var ops = request.body.ops;
	//console.log('ops ', ops);
	//console.log('operations ', CONFIG.operations);
	if (ops){
		CONFIG.operations[ops]();		
	}
	response.end();
});

function doOperation(cb){

}

// pin left-front, left-back, right-front, right-back
function opsforward(){
	setops([1,0,1,0]);
}

function opsbackward(){
	setops([0,1,0,1]);	
}

function opsturnleft(){
	setops([1,0,0,0]);
}

function opsturnright(){
	setops([0,0,1,0]);
}

function opsspinleft(){
	setops([1,0,0,1]);
}

function opsspinright(){
	setops([0,1,1,0]);
}

function opsstop(){
	setops([0,0,0,0]);
}

// pin left-front, left-back, right-front, right-back
function setops(ps){
	//console.log('pins ', opspins);
	if (opspins && opspins.length > 0){
		for(var p in ps){
			//console.log(p)
			var pin = opspins[p];
			if (pin){
				pin.low();
				if (ps[p] == 1)
					pin.high();
			}
		}
	}
}

app.post('/pin', function (request, response){
	var pinstatus = request.body.pinstatus;
	var pin = request.body.pin;
	//console.log('** pin ', device);
	//console.log('status ', pinstatus);
	//console.log('pin ', pin);
	pinOps(pin, status);
	response.end();
});

board.on('ready', function() {
	console.log('raspi-io board ready...');
	
	//indicate board is ready
	pinReady = initPin(this, CONFIG.readyPIN);

	// set thread pins
	initPins(this);
	
	// start web app in port 
	app.listen(CONFIG.port, function () {
		console.log('web app started - listening on port ' + CONFIG.port);
		pinReady.high();
	});
});

function strobe(board, pin){
	var state = 0x00;
	board.loop(500, function() {
		pin.write(state ^= 0x01);
	});
}

board.on('exit', function() {
	console.log('board exit...');
});

function initPins(board){
	for(var i in CONFIG.pins){
		opspins.push(initPin(board, CONFIG.pins[i]));
	}
}

function initPin(board, pinNo){
	var pinObj = new five.Pin(pinNo);
	pinExit(board, pinObj);
	return pinObj;
}

function pinExit(board, pin){
	board.on("exit", function() {
		pin.low();
		opsstop();
	});
}

function execOps(device, ops){
	if (device && ops) {
		cmdStatement = "sudo irsend SEND_ONCE " + device.toUpperCase() + " " + ops.toUpperCase();
		execCmd(cmdStatement);
	}
}

function execCmd(cmdStatement){
	console.log("call execute: " + cmdStatement);
	exec(cmdStatement, function (error, stdout, stderr) {			
		if (error) {
			console.error('exec error: ' , error);
			return;
		}
		console.log('stdout: ', stdout);
		console.log('stderr: ', stderr);
	});
}
