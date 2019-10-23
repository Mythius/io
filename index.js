var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');

function save(n,t){
	fs.writeFile(n,t,e=>{
		console.log(e);
	});
}
function read(n,c){
	fs.readFile(n,(e,b)=>{
		if(e) console.log(e);
		else c(b.toString());
	});
}

const path = __dirname + '/';
const port = 80;
const fps = 10;
var uniq=0;

var userinputs = [];
var users = [];
var ids = [];

http.listen(port,()=>{console.log(`=== Serving Port: ${port} ===\n`)});

app.get('/',(req,res)=>{res.sendFile(path+'index.html')});

io.on('connection',(socket)=>{
	var user;
	socket.emit('getname');
	socket.on('name',n=>{
		socket.emit('getall',users);
		user = new player(n);
		io.emit('new',user);
		socket.emit('id',user.id);
		console.log(n+' connected');
	});
	socket.on('input',i=>{
		if(user.size<1){
			kill(user.id);
		} else ids.push(user.id);
		if(!user.killed) userinputs.push(i);
	});
	socket.on('disconnect',()=>{
		if(user) kill(user.id);
	});
	function kill(id){
		if(user){
  			io.emit('kill',id);
  			users.splice(users.indexOf(user),1);
  			console.log(user.name + ' died');
		}
	}
});


class player{
	constructor(name){
		this.name = name;
		this.id = uniq++;
		this.x = random(0,1920);
		this.y = random(0,900);
		this.size = 10;
		this.killed = false;
		this.color = `rgb(${random(0,255)},${random(0,255)},${random(0,255)})`;
		users.push(this);
	}
}

function loop(){
	var l = users.length;
	while(l--){
		if(ids.indexOf(users[l].id)<0) users.splice(l,1);
	}
	io.emit('render',users);
	handle();
	userinputs=[];
	ids=[];
	io.emit('getInput');
	console.log(users);
}

function handle(){
	for(let u of userinputs){
		let USER = users.filter(p=>p.id==u.id);
		if(USER.length){
			for(let id of u.clicked){
				let usr = users.filter(p=>p.id==id);
				if(usr.length){
					usr = usr[0];
					USER = USER[0];
					if (USER.id == usr.id){
						usr.size++;
					} else usr.size--;
					if(usr.size==0){
						io.emit('kill',usr.id);
					}
				}
			}
		}
	}
}

function random(min,max){
	return min+Math.floor(Math.random()*(max-min+1));
}

setInterval(loop,1000/fps);