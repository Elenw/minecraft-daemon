/**
 * Created by bangbang93 on 14-10-31.
 */
var spawn = require('child_process').spawn;
var events = require('events');
var util = require('util');
var path = require('path');

var java;

/**
 *
 * @param name
 * @param serverPath
 * @param jarFile
 * @param options
 * @constructor
 */
var BMCDLauncher = function(name, serverPath, jarFile, options){
    this.name = name;
    this.path = serverPath;
    this.options = options || [];
    this.args = ['-jar', path.join(serverPath, jarFile), '--nojline'].concat(this.options);
};

util.inherits(BMCDLauncher, events.EventEmitter);

BMCDLauncher.prototype.start = function (){
    var that = this;
    if (that.isRunning){
        return false;
    }
    that.server = spawn(java, that.args,{
        cwd: that.path
    });
    that.stdin = that.server.stdin;
    that.stdout = that.server.stdout;
    that.stderr = that.server.stderr;
    that.stdout.on('data', function (data){
        that.emit('stdout', data);
        that.emit('output', data);
        that.output(data.toString());
    });
    that.stderr.on('data', function (data){
        that.emit('stderr', data);
        that.emit('output', data);
        that.output(data.toString());
    });
    that.server.on('exit', function (code, signal){
        console.log(that.name + ' exit:' + code + ' ' + signal);
        that.emit('exit', code, signal);
        that.isRunning = false;
    });
    that.server.on('error', function (err) {
        that.emit('error', err);
        console.log(JSON.parse(err));
    });
    that.pid = that.server.pid;
    this.isRunning = true;
    return true;
};

BMCDLauncher.prototype.stop = function (){
    var that = this;
    that.stdin.write('stop\n');
};

BMCDLauncher.prototype.kill = function (signal){
    var that = this;
    that.server.kill(signal || 'SIGKILL');
};

BMCDLauncher.prototype.console = [];

BMCDLauncher.prototype.output = function (str){
    str = Buffer.isBuffer(str)?str.toString():str;
    if (this.console.length > 200){
        this.console.shift();
    }
    this.console.push(str);
};

BMCDLauncher.prototype.input = function (command){
    this.output(command + '\n');
    this.stdin.write(command + '\n');
};

BMCDLauncher.prototype.isRunning = false;

module.exports = function (javaPath){
    java = javaPath;
    return BMCDLauncher;
};