var koa = require('koa');
var fs = require('fs');
var path = require('path');
var app = koa();
var config = require('./config');
var bodyHandle = require('./bodyHandle');

app.use(function *(){
    var self = this;
    var index = './index.html';
    if (self.request.path === '/fileList') {
        fileList = [];
        function walk(path){    
            var dirList = fs.readdirSync(path);
            dirList.forEach(function(item){
                    if (!item.match(/^\./)) {  //过滤隐藏文件
                        if(fs.statSync(path + '/' + item).isDirectory()){
                                walk(path + '/' + item, path);
                        }
                        fileList.push({ id: path + '/' + item, path: path + '/' + item, fileName: item, pid: path });
                    }
            });
        }

        walk(config.root);
        self.body = fileList;
    }

    var file = '.' + decodeURI(self.request.path);
    try {
        if(!fs.statSync(file).isDirectory()){
            var data = fs.readFileSync(file, {encoding: 'utf-8'});
            var query = self.request.query;
            if (query.source_code && file.match(/.js$/)) {
                data = bodyHandle.addHighlight(data, 'js');
                data = bodyHandle.insertPrism(data);
                self.body = data;
            }
            else if (query.source_code && file.match(/.html$/)) {
                data = bodyHandle.addHighlight(data, 'html');
                data = bodyHandle.insertPrism(data);
                self.body = data;
            }
            else if (query.result && file.match(/.js$/)) {
                try {
                    self.body = bodyHandle.addScript(data);
                }
                catch(e) {
                    self.body = e;
                }
            }
            else if (query.result && file.match(/.md$/)) {
                try {
                    self.body = bodyHandle.transMarkDown(data);
                }
                catch(e) {
                    self.body = e;
                }
            }
            else {
                self.body = data;
            }
        }
        else {
            self.body = '';
        }
    }
    catch(e) {}
});


app.listen(config.port);