var http = require('http'),
	url = require('url'),
    fs = require('fs'),
	querystring = require('querystring'),
//    mongodbconn = require('connect-mongo'),
//    mongoose = require('mongoose'),
    mongodb = require('mongodb');

var server = new mongodb.Server("192.168.0.133", 27017); //连接Mongodb
//var server = new mongodb.Server("localhost", 27017); //连接Mongodb
var conn = new mongodb.Db("dailyReport", server, {safe: false});

http.createServer(function (req, res) {

    req.setMaxListeners(0);

    var pathname = url.parse(req.url).pathname;
    var query = url.parse(req.url).query;
    console.log(" --------------- pathname : ", pathname, "\n ------------ query : ", query);

    // 加载用户
    if (pathname == "/loadUsers") {
        var udepnum = querystring.parse(query).udepnum;
        console.log("------------ 部门号 ------------ " + udepnum);
        conn.open(function(err, db) {
            db.collection("departments", function(err, collection){
                collection.find(function(err, cursor) {
                    cursor.toArray(function(err, data) {
                        for (var i=0; i<data.length; i++) {
                            if (data[i].dpnum == udepnum) {
                                console.log("\n -------------- 加载用户 ------------- \n", data[i]["dusers"]);
                                res.writeHead(200, {"Content-Type": "application/json"});
                                res.end(JSON.stringify({"dusers": data[i]["dusers"]}));
                                break;
                            }
                        }
                        conn.close();
                    });
                });
            });
        });
        // 加载部门
    } else if (pathname == "/loadDepartments") {
        conn.open(function(err, db) {
            db.collection("departments", function(err, collection){
                collection.find().toArray(function(err, data) {
                    console.log("\n -------------- 加载部门 ------------- \n", typeof data, data);
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.end(JSON.stringify({"departments": data}));
                    conn.close();
                });
            });
        });
        // 加载指定部门指定日期的用户
    } else if (pathname == "/loadDetail") {
        var udep = querystring.parse(query).udep;
        var querydate = querystring.parse(query).querydate;
        console.log("------------ udep ------------ " + udep);
        console.log("------------ querydate ------------ " + querydate);
        conn.open(function(err, db) {
            db.collection("dailyLogs", function(err, collection) {
                collection.find({logger_dpid: udep, date: querydate}).toArray(function(err, data) {
                    console.log("------------- data ------------ \n", data);
                    var results = new Array();
                    for (var i=0; i<data.length; i++) {
                        console.log("-------- data[i]--------- \n", data[i], data[i].modifylog.length);
                        var log = {
                            "logger_name": data[i].logger_name,
                            "done": data[i].modifylog[data[i].modifylog.length - 1].done,
                            "plan": data[i].modifylog[data[i].modifylog.length - 1].plan,
                            "remark": data[i].modifylog[data[i].modifylog.length - 1].remark
                        }
                        results.push(log);
                    }
                    console.log("--------- 加载指定部门的日志 --------- \n", typeof results, results);
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.end(JSON.stringify({"dusers": results}));
                    conn.close();
                });
            });
        });
        // 保存/修改日志
    } else if (pathname == "/submitLog") {
        var info = "";
        req.addListener('data', function(data){
            info += data;
        }).addListener('end', function(){
            info = querystring.parse(info);
            saveLog(info, req, res);
        });
        // 加载初始信息
    } else if (pathname == "/loadInitInfo") {
        conn.open(function(err, db) {
            db.collection("departments", function(err, collection){
                collection.find().toArray(function(err, data) {
                    console.log(" -------------- 部门所有信息 ------------- \n", typeof data, data);
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.end(JSON.stringify({"departments": data}));
                    conn.close();
                });
            });
        });
    // 加载某人当天日志
    } else if(pathname =="/loadTodayReport") {
        var info = "";
        req.addListener('data', function(data){
            info += data;
        }).addListener('end', function(){
            info = querystring.parse(info);
            queryLog(info, res);
        });
    }

    conn.on("close", function() {
        console.log(" ------------ db close ------------ \n");
    });

}).listen(8124, "127.0.0.1");
//}).listen(8124, "192.168.0.108");

function queryLog(info, res) {
    console.log("-------- 查询当天是否写了日报，POST参数----------- \n", info);
    conn.open(function(err, db) {
        db.collection("dailyLogs", function(err, collection) {
            collection.find({"logger_id":info.logger_id, "date":info.date}).toArray(function(err, data) {
                console.log("----------------- 查询结果为 ----------------- \n", data, data.length);
                if (!data || data=="") {
                    var results = {
                        "exist": false
                    }
                    console.log("----------- 此人当天未曾写日报 ------------- \n");
                } else {
                    console.log("----------- 此人当天已经写过日报 -------------- \n", data, typeof data);
                    console.log("----------- 此人当天日报记录 --------------\n", data[0].modifylog);
                    var newestLog = data[0].modifylog[data[0].modifylog.length - 1];
                    var results = {
                        "exist": true,
                        "done": newestLog.done,
                        "plan": newestLog.plan,
                        "remark": newestLog.remark
                    }
                    console.log("----- results: ---\n", results);
                }
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify({"results": results}));
                conn.close();
            });
        });
    });
}


// 插入日志
function saveLog(info, req, res) {
    console.log("------ info ---------- \n", info);
    // 客户端IP
    var ip = req.connection.remoteAddress;
//    console.log("-------- ip ----- ", ip);
    // 时间戳
    var ts = new Date().getTime();
    var i = ts % 1000;
//    var t = new mongodb.BSONPure.Timestamp(i, Math.floor(ts * 0.001));
    var t = Math.floor(ts * 0.001);
//    console.log("--------- timestamp ----- ", t);
    conn.open(function(err, db) {
        db.collection("dailyLogs", function(err, collection) {
            collection.find({"logger_id": info.logger_id, "date": info.date}).toArray(function(err, data) {
                console.log("-------------- err ------------------ ", err);
                console.log("------------- 查询是否有重复log ------------ \n", data);
                // 不重复
                if (data == "" || !data) {
                    collection.insert({
                        "date": info.date,
                        "logger_name": info.logger_name,
                        "logger_id": info.logger_id,
                        "logger_dpid": info.logger_dpid,
                        "logger_dpname": info.logger_dpname,
                        "modifylog": [{"done": info.done, "plan": info.plan, "remark": info.remark, "lastEditor": ip, "lastModifiedTime": t}]
                    }, function(err, data) {
                        if (data) {
                            res.writeHead(200, {"Content-Type": "application/json"});
                            res.end(JSON.stringify({"status": "insertsuc"}));
                            console.log("---------------- 插入日志成功 ----------- \n");
                            conn.close();
                        } else {
                            res.writeHead(200, {"Content-Type": "application/json"});
                            res.end(JSON.stringify({"status": "insertfail"}));
                            console.log("----------------- 插入日志失败 ----------- \n");
                            conn.close();
                        }
                    });
                } else {
                    //todo _id
                    console.log(" --------- 有重复log, id为------------\n", data, typeof data);
                    var newModifyLog = {
                        "done": info.done,
                        "plan": info.plan,
                        "remark": info.remark,
                        "lastEditor": ip,
                        "lastModifiedTime": t
                    };
                    collection.update(
                        {"logger_id": info.logger_id, "date": info.date},
                        {   $set: {
                            "date": info.date,
                            "logger_name": info.logger_name,
                            "logger_id": info.logger_id,
                            "logger_dpid": info.logger_dpid,
                            "logger_dpname": info.logger_dpname
                        },
                            $push: {
                                modifylog: newModifyLog
                            }
                        });
                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.end(JSON.stringify({"status": "modified"}));
                    console.log("------------------- 更新后的Log为 ---------------\n", data);
                    conn.close();
                }
            });
        });
    });
}

console.log('Server running at http://127.0.0.1:8124/');


