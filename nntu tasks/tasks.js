const https = require('https');
var http = require('http');
const url = require('url');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const options = {
    key: fs.readFileSync('/etc/ssl/nntuapp.reg.ru.key'),
    cert: fs.readFileSync('/etc/ssl/nntuapp.reg.ru.crt')
};

var db = new sqlite3.Database("tasks.db");

function loadTasks(id, _callback) {
    var now = new Date().getTime()/1000;
    var output = [];
    let sql = `SELECT * FROM TASKS WHERE groupID = ? AND deadline > ?`
    db.all(sql, id, now, (err, rows) => {
        if (err){
            console.log(`Ничего не нашлось: ${now}`);
            _callback(output)
            return
        }
        rows.forEach(row => {
            output.push({
                'id': row.id,
                'title': row.title,
                'description': row.description,
                'subject': row.subject,
                'priority': row.priorityID,
                'deadline': row.deadline
            })
        });
        console.log(output)
        _callback(output)
    });
}

function addGroup(groupName, _callback){
    let sql = `INSERT INTO GROUPS(groupName) VALUES (?)`;
    db.run(sql, groupName, (err) => {
        if (err) { 
            console.log(err);
            return 
        }
        _callback()
    })
}

function getGroupID(groupName, _callback){
    let sql = `SELECT * FROM GROUPS WHERE groupName = ?`
    db.all(sql, groupName, function(err, rows){
        if (err) {
            console.log(err)
            _callback(0)
        }
        if (rows.length == 0){
            addGroup(groupName, function(){
                getGroupID(groupName, function(id){
                    _callback(id)
                    return
                })
            })
        }
        else {
            _callback(rows[0].id)
        }
    })
}

function addTask(task, groupName){
    getGroupID(groupName, function(id){
        let sql = `INSERT INTO TASKS(title, description, subject, groupID, priorityID, deadline) VALUES (?, ?, ?, ?, ? ,?)`;
        let stmt = db.prepare(sql);
        console.log(task)
        stmt.run(task.title, task.description, task.subject, id, task.priority, task.deadline)
    })
}

function removeTask(id){
    let sql = `DELETE FROM TASKS WHERE ID = ?`;
    let stmt = db.prepare(sql);
    stmt.run(id);
}

let task = {
    'title': 'hihi',
    'description': 'hehe',
    'subject': 'haha',
    'groupName': '18САИ1',
    'priority': 1,
    'deadline': 1000000
}

function handle(request, response){
    let object = url.parse(request.url, true).query;
    let method = object.method;
    console.log(object)
    switch (method) {
        case 'get':
            let groupName = object.groupName
            if (groupName != null){
                getGroupID(groupName, (id) => {
                    loadTasks(id, (tasks) => {
                        response.writeHead(200, {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type"});
                        var json = JSON.stringify({
                            tasks: tasks
                        });
                        console.log(json);
                        response.end(json);
                    })
                })
            }
            break
        case 'add':
            if (object.task != null && object.groupName != null) {
                addTask(JSON.parse(object.task), object.groupName);
            }
            response.writeHead(200, {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type"});
            var json = JSON.stringify({
                status: 'ok'
            });
            response.end(json);
            break
        case 'delete':
            if (object.id != null){
                removeTask(object.id)
            }
            response.writeHead(200, {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type"});
            var json = JSON.stringify({
                status: 'ok'
            });
            response.end(json);
            break
    }
}

https.createServer(options, handle).listen(8002)
http.createServer(handle).listen(3002)
console.log('Server has started!!')