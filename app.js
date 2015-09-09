#!/usr/bin/env node

var excel = require('excel-stream');
var fs = require('fs');
var async = require('async');

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'laocao'
});

//拿到需要读取的excel文件位置，读取命令后面紧跟的字符串参数
var excelFile = process.argv[2];
var line_num = 1; //目前解析到的行号，用于中途退出时保存游标
var DATA = [];  //存放excel中的所有数据
var USER = {}; //存放数据中出现的所有用户信息(hash)

console.log("解析excel文件中...");
//解析单行数据结构
fs.createReadStream(excelFile)
  .pipe(excel())
  .on('data', function(row){

    if(row && row['time'] != 0){

      var list = row['list'].split(" ");
      var log = [];
      for(i=0,max=list.length; i<max; i++){
        var name = list[i].replace(/[0-9|\.]/g,'');
        var money = list[i].replace(/[^0-9|^\.]/g, '');

        var obj = {};
        obj.name = name;
        obj.money = money;
        obj.order = i+1;
        log.push(obj);
      }
      row['list'] = log;
      DATA.push(row);
    }
  })
  .on('end', function(){
    //console.log(DATA[0]['list'][0]);
    console.log("解析excel文件成功");

    async.eachSeries(['connectdb', 'getUser', 'insertUser', 'insertPocket'], function(item, callback){
      if(item == 'connectdb'){
        console.log("连接数据库ing");
        //连接mysql
        connection.connect();
        //todo err

        console.log("已连接数据库");
        callback();

      }else if(item == 'getUser'){
        console.log("过滤本次导入数据中出现的所有用户");
        //获取所有用户姓名，如果数据中存在重名用户，则自动被覆盖
        for(var i=0; i < DATA.length; i++){
          var name = DATA[i]['boss'];
          if(!USER[name]){
            USER[name] = 0;
          }

          for(var j=0; j < DATA[i]['list'].length; j++){
            name = DATA[i]['list'][j]['name'];
            if(!USER[name]){
              USER[name] = 0;
            }
          }
        }
        console.log("过滤完毕");
        callback();

      }else if(item == 'insertUser'){
        console.log("向数据库创建新出现的用户");
        //把用户插入到用户表，并存储在内存中kv结构（k:用户名, v:用户id）
        async.each(Object.keys(USER), function(item, cb){
          connection.query("SELECT id FROM `user` WHERE ?", {name: item}, function(err, result){
            //todo err
            if(result.length){
              USER[item] = result[0].id;
              cb();
            }else{
              connection.query("INSERT INTO user SET ?", {name: item}, function(err, result){
                //todo err
                USER[item] = result.insertId;
                cb();
              });
            }
          });
        }, function(err){
          //todo err

          console.log("创建完毕");
          callback();
        });

      }else if(item == 'insertPocket'){
        console.log("导入红包及抢红包日志数据");

        async.each(DATA, function(item, cb){
          //把红包数据插入到红包表
          connection.query("INSERT INTO pocket SET ?",
                          {
                            user_id: USER[item.boss],
                            message: item.message,
                            total: item.total,
                            amount: item.cost,
                            post_time: item.time
                          },
                          function(err, result){
            //todo err

            //同时把对应红包的领取记录数据插入到领取记录表
            var pocket_id = result.insertId;
            async.each(item.list, function(log, in_cb){

              connection.query("INSERT INTO log SET ?",
                              {
                                user_id: USER[log.name],
                                pocket_id: pocket_id,
                                money: log.money,
                                order: log.order
                              },
                              function(err, result){
                //todo err

                in_cb();
              });

            }, function(err){
              //todo err

              cb();
            });
          });

        }, function(err){
          //todo err

          console.log("导入完毕");
          callback();
        });
      }
    }, function(err){
      //todo err

      console.log("恭喜您，本次导入成功，不成功也没办法～");
      connection.end();
    });
  });
