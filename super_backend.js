const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const keys = require('./keys');

db = new sqlite3.Database("appttable.db");

// function backup(name){
//     const today = new Date();
//     const month = String(today.getMonth() + 1);
//     const stringMoment = String(today.getDate()) + "." + month + "." + String(today.getFullYear()) + " " + String(today.getHours()) + "_" + String(today.getMinutes()) + "_" + String(today.getSeconds());
//     fs.copyFile('appttable.db', 'backups/' + stringMoment + '.db', function(err){
//         if (err){
//             console.err('Произошла ошибка при копировании файла в папку бекапов, время: ' + stringMoment + ' Группа: ' + name, err);
//         } else {
//             console.log('Создан бекап от ' + stringMoment + ' Группа: ' + name);
//         }
//     });
// }


function addTimeTable(groupName, startTimes, stopTimes, days, weeks, rooms, names, types, teachers, notes){
    groupName = groupName.replace(/-/g,'')
    groupName = groupName.replace(/'/g,'')
    groupName = groupName.replace(/"/g,'')
    groupName = groupName.replace(/DROP/g,'')

    const addTableSQL = "CREATE TABLE IF NOT EXISTS '" + groupName + "' (startTime text, stopTime text, day int, weeks text, rooms text, name text, type text, teacher text, note text);";
    db.run(addTableSQL, function(){
        const today = new Date();
        const month = String(today.getMonth() + 1);
        const stringMoment = String(today.getDate()) + "." + month + "." + String(today.getFullYear()) + " " + String(today.getHours()) + "_" + String(today.getMinutes()) + "_" + String(today.getSeconds());
        var renameSQL = "ALTER TABLE '" + groupName + "' RENAME TO '" + groupName + " " + stringMoment + "';"
        db.run(renameSQL, function(){
            const newSQL = "CREATE TABLE IF NOT EXISTS '" + groupName + "' (startTime text, stopTime text, day int, weeks text, rooms text, name text, type text, teacher text, note text);";
            db.run(newSQL, function(){
                // backup(String(groupName));
                console.log('Создан бекап от ' + stringMoment + ' Группа: ' + groupName);
                const addLessonSQL = "INSERT INTO '" + groupName + "' VALUES (?,?,?,?,?,?,?,?,?);";
                var addstmt = db.prepare(addLessonSQL);
                for (var i = 0; i <= startTimes.length; i ++){
                    if (i == startTimes.length){
                        addstmt.finalize();
                    } else {
                        addstmt.run(startTimes[i], stopTimes[i], days[i], weeks[i], rooms[i], names[i], types[i], teachers[i], notes[i]);
                    }
                }           
            });
        });
    });
};


function getTT(group ,_callback) {
    group = group.replace(/-/g,'')
    group = group.replace(/'/g,'')
    group = group.replace(/"/g,'')
    group = group.replace(/DROP/g,'')
    
    var estartTimes = [];
    var estopTimes = [];
    var edays = [];
    var eweeks = [];
    var erooms = [];
    var enames = [];
    var etypes = [];
    var eteachers = [];
    var enotes = [];
    var sql = "SELECT * FROM '" + group + "';";
    // var stmt = db.prepare(sql);
    db.all(sql, (err,rows) => {
        if (err) {
            _callback(estartTimes, estopTimes, edays, eweeks, erooms, enames, etypes, eteachers, enotes);
            console.error('Не нашлось ничего: ', err);
        } else {
            for (var i = 0; i <= rows.length; i ++){
                if (i == rows.length){
                    _callback(estartTimes, estopTimes, edays, eweeks, erooms, enames, etypes, eteachers, enotes);
                } else {
                    var row = rows[i];
                    estartTimes.push(row.startTime);
                    estopTimes.push(row.stopTime);
                    edays.push(row.day);
                    eweeks.push(row.weeks);
                    erooms.push(row.rooms)
                    enames.push(row.name);
                    etypes.push(row.type);
                    eteachers.push(row.teacher);
                    enotes.push(row.note);
                }
            }
        }
    });
}

var http = require("http");
const { get } = require('https');
const { toNamespacedPath } = require('path');
http.createServer(function(request, response){
    if (request.method == 'POST'){
        var body = '';
        var editing = false;
        var groupName = '';
        var startTimes = [];
        var stopTimes = [];
        var days = [];
        var weeks = [];
        var rooms = [];
        var names = [];
        var types = [];
        var teachers = [];
        var notes = [];

        function one(){
            getTT(groupName, function(estartTimes, estopTimes, edays, eweeks, erooms, enames, etypes, eteachers, enotes){
                if (estartTimes.length != 0){
                    response.writeHead(200, {"Content-Type": "application/json"});
                } else {
                    response.writeHead(404, {"Content-Type": "application/json"});
                }
                var json = JSON.stringify({
                    startTimes : estartTimes,
                    stopTimes : estopTimes,
                    days: edays,
                    weeks: eweeks,
                    rooms: erooms,
                    names: enames,
                    types: etypes,
                    teachers: eteachers,
                    notes: enotes
                });
                response.end(json);
            });
        }
        function two(){
            response.writeHead(200, {"Content-Type": "application/json"});
            var json = JSON.stringify({
                status: 'ok'
            });
            response.end(json);
        }
        request.on("data",function (data) {
            body += data;
            console.log('' + data);
        })
        request.on("end", function() {
            if (body.includes(keys.receive())){ //Получение расписания
                var jsonData = JSON.parse(body);
                groupName += jsonData.groupName;
                one()
            } else if (body.includes(keys.post())){ //Редактирование расписания
                editing = true;
                var jsonData = JSON.parse(body);
                groupName = jsonData.groupName;
                startTimes = jsonData.startTimes;
                stopTimes = jsonData.stopTimes;
                days = jsonData.days;
                weeks = jsonData.weeks;
                rooms = jsonData.rooms;
                names = jsonData.names;
                types = jsonData.types;
                teachers = jsonData.teachers;
                notes = jsonData.notes;
                addTimeTable(groupName, startTimes, stopTimes, days, weeks, rooms, names, types, teachers, notes);
                two()
            }
        })
    } else {
        response.writeHead(200, {"Content-Type": "text/html, charset = utf-8"});
        response.write("<DOCTYPE html>\n"+
        "<html>\n"+ 
        "<head>\n" +
        "<meta charset = 'utf-8'>\n" +
        "</head>\n" +
        "<body>\n");
        response.write("Расписание не найдено")
        response.end(" </body>\n </html>\n");
        console.log("Кто-то попробовал попасть на страницу");
    }
}).listen(3000, '0.0.0.0');
// }).listen();
console.log("Сервер запущен ура!!!");
