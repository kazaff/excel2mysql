# excel2mysql
帮朋友老糙写的小玩意儿

##安装
下载源码后，在终端中进入到源码目录，执行：

> npm install


##配置

用编辑器打开`app.js`文件，修改其中如下代码片段：

```javascript
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'laocao'
});
```
根据你实际的数据库配置信息进行修改。


##使用
为了方便使用，可以在终端切换root权限后，执行：

> npm link

这样就可以在终端中直接使用"excel2mysql"命令，如下：

> kazaffdeMacBook-Pro:~ kazaff$ excel2mysql ./test.xls

上述命令后跟的第一个参数为需要导入的excel文件的地址，请根据实际情况填写。

如没有按照上面提供的`npm link`方式配置的话，只能执行下面的命令(**先保证终端所处于项目目录下**)：

> node app.js ./test.xls


##其他问题
直接报警，谢谢合作
