"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("util");
var Redis = /** @class */ (function () {
    function Redis(client_connection) {
        this.client = client_connection;
    }
    Redis.prototype.sleep = function (ms) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve(true);
            }, ms);
        });
    };
    Redis.prototype.aquire_lock = function (lockname, lockExpireTime, operationId) {
        var _this = this;
        var getAsync = util_1.promisify(this.client.get).bind(this.client);
        return new Promise(function (resolve) {
            console.log(operationId + "   in check lockin process");
            var check_and_locked = function () {
                _this.client.watch(lockname, function () {
                    getAsync(lockname)
                        .then(function (res) {
                        if (!res) {
                            _this.client.multi().set(lockname, operationId, "EX", lockExpireTime, function (res) {
                                console.log(" try locked the transaction " + operationId + res);
                                console.log("locked the transaction " + operationId);
                                clearInterval(check);
                                resolve(operationId);
                            }).exec(function (multiExecError, results) {
                                if (multiExecError)
                                    throw multiExecError;
                                console.log("exec the transaction " + results);
                                if (results === null) {
                                    console.log("transaction " + operationId + " will re call because " + lockname + " already locked");
                                }
                                else {
                                    console.log("transaction  " + operationId + " locked the " + lockname + " ", results);
                                }
                            });
                        }
                        else {
                            console.log("transaction " + operationId + " will re call because " + lockname + " already locked");
                        }
                    });
                });
            };
            var check = setInterval(function () { return check_and_locked(); }, 3000);
        });
    };
    Redis.prototype.release_lock = function (lockname, operationId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.client.watch(lockname, function () {
                if (_this.client.get(lockname)) {
                    console.log('release the transaction lock for ' + operationId);
                    _this.client.multi().del(lockname)
                        .exec(function (multiExecError, results) {
                        if (multiExecError)
                            throw multiExecError;
                        if (results === null) {
                            console.log("other transaction locked");
                            resolve(operationId);
                        }
                        else {
                            console.log("transaction  " + operationId + " release  the " + lockname + " lock ", results);
                            resolve(operationId);
                        }
                    });
                }
                else {
                    reject("lock is not there or time out lock session");
                }
            });
        });
    };
    Redis.prototype.destroy = function () {
        this.client.end(true);
    };
    return Redis;
}());
exports.Redis = Redis;
// var conn=client.createClient()
// var check=new Redis(conn);
// check.acquire_lock("kaana123",4,"1")
