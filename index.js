"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var redis = require("redis");
var redis_lock_1 = require("redis-lock-in-ts/lib/db/redis-lock");
var connection_1 = require("redis-lock-in-ts/lib/cache/connection");
var connection;
function init(url, db) {
    return new Promise(function (resolve, reject) {
        if (db == "redis") {
            var previous_connection_1;
            connection_1.AppCache.getConnection().then(function (res) {
                previous_connection_1 = res;
                connection = res;
                console.log("connection form cache" + JSON.stringify(res));
                if (previous_connection_1) {
                    try {
                        previous_connection_1.client('id', function (err, res) {
                            console.log("previous connection live success of id " + res);
                            // console.log("connection success"+ err)
                            var lock_initial = new redis_lock_1.Redis(previous_connection_1);
                            resolve(lock_initial);
                        });
                    }
                    catch (e) {
                        // console.log("previous connection failed reason"+ e)
                        var conn = redis.createClient(url);
                        connection = conn;
                        // console.log("previous connection failed")
                        conn.on('error', function (res) {
                            console.log("error");
                        });
                        connection_1.AppCache.setConnection(conn);
                        var lock_initial = new redis_lock_1.Redis(conn);
                        resolve(lock_initial);
                    }
                }
                else {
                    var conn = redis.createClient(url);
                    console.log("new connection success");
                    conn.on('error', function (res) {
                        console.log("error");
                    });
                    conn.client('id', function (err, res) {
                        console.log("new connection live success of id " + res);
                    });
                    // console.log("connection to cache"+ conn)
                    connection_1.AppCache.setConnection(conn);
                    var lock_initial = new redis_lock_1.Redis(conn);
                    resolve(lock_initial);
                }
            }).catch(function (e) { console.log(e); });
        }
        else {
            reject(null);
        }
    });
}
exports.init = init;
