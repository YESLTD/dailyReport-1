var http = require('http'),
	url = require('url'),
	querystring = require('querystring'),
//    mongodbconn = require('connect-mongo'),
//    mongoose = require('mongoose'),
    mongodb = require('mongodb');

var server = new mongodb.Server("localhost", 27017); //连接Mongodb
var conn = new mongodb.Db("dailyReport", server, {safe: false});

http.createServer(function (req, res) {
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
    // 加载指定部门的用户
    } else if (pathname == "/loadDetail") {
        var udep = querystring.parse(query).udep;
        console.log("------------ udep ------------ " + udep);
        conn.open(function(err, db) {
            db.collection("dailyLogs", function(err, collection) {
                collection.find({logger_dpid: udep}).toArray(function(err, data) {
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
            saveLog(info, req);
        });
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
    }
    conn.on("close", function() {
        console.log(" ------------ db close ------------ \n");
    });

}).listen(8124, "127.0.0.1");

// 插入日志
function saveLog(info, req) {
    console.log("------ info ---------- \n", info);
    // 客户端IP
    var ip = req.connection.remoteAddress;
//    console.log("-------- ip ----- ", ip);
    // 时间戳
    var ts = new Date().getTime();
    var i = ts % 1000;
    var t = new mongodb.BSONPure.Timestamp(i, Math.floor(ts * 0.001));
//    console.log("--------- timestamp ----- ", t);
    conn.open(function(err, db) {
        db.collection("dailyLogs", function(err, collection) {
            collection.find({logger_id: info.logger_id, date: info.date}).toArray(function(err, data) {
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
                            console.log("---------------- 插入日志成功 ----------- \n");
                        } else {
                            console.log("----------------- 插入日志失败 ----------- \n");
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
                        {logger_id: info.logger_id, date: info.date},
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
                    console.log("------------------- 更新后的Log为 ---------------\n", data);
                }
                conn.close();
            });
        });
    });
}

console.log('Server running at http://127.0.0.1:8124/');


