// JavaScript Document

$(function(){
	//创造数据库判断是否存在 建表db_user 三个字段 user_name，user_tit和 user_intro
	//创建一个数据库对象，包含4个参数
    //分别为数据库名称，版本号，数据库描述，数据库大小
	var database = null;
	var db = openDatabase('mydata','','database','3*1024*1024');
	db.transaction(function(tx){
			tx.executeSql('CREATE TABLE IF NOT EXISTS db_user(user_name TEXT,user_tit TEXT,user_intro TEXT)',[]);
			//alert("built!");
		});
	
	//load用户数据 	
    //清除已有列表保证最新
	//不用body.onload()的方法，由于该函数在所有资源都加载完毕后才会执行，所以直接写在$(function(){});中就可以保证在网页DOM加载完毕后执行
	
        //alert("list!");
		db.transaction(function(tx){
			tx.executeSql('SELECT * FROM db_user',[],function(tx,rs){
					//alert("select right!");
					//选取最新的一条作为信息输出
				    var i=rs.rows.length-1;
					//alert(i);
					var uname = rs.rows.item(i).user_name;
					//alert(uname);
					var utitle = rs.rows.item(i).user_tit;
					var uintro = rs.rows.item(i).user_intro;
					$("#user_name").html(uname);
					//var n= $("#user_name").val();
					//alert(n);
					$("#user_tit").html(utitle);
					$("#user_intro").html(uintro);
					
				});
			
		});
		

 
	
	
		
	//获取字段写入数据库
	$("#user_defy").click(function(){
    	//若数据库存在
			if(db){
			//alert("db");
			var user_name = $("#user_name_defy").val();
			//alert(user_name);
			var user_title = $("#user_tit_defy").val();
		    //alert(name);
			//var _content_to_html = _content.replace("\r\n","<br>");
			//var _time = new Date().toUTCString();
			var user_p = $("#user_intro_defy").val();
			//alert(_time);
			// 当有空白时用户确认是否记录
			if(user_name==""||user_title ==""||user_p==""){
				if(window.confirm("你不想写出自己的信息么？请补充完整")){
					//确认写入数据库
					//alert("yes!");
					var user_name1 = "Ryan";
					var user_title1 = "无言";
			        var user_p1 = "正常情况下是心能常喜。有脾气的时候是傲娇的。逃不出自己的围城。爱大叫 爱大笑。过着干净的、犯二的、忙碌的小日子。【点击右上进入个人档修改】";
					var sqlstr = "INSERT INTO db_user VALUES(?,?,?)";
					db.transaction(function(tx){
						tx.executeSql(sqlstr,[user_name1,user_title1,user_p1],function(tx,rs){
							alert("已保存");
							//window.location.reload();
							window.history.go(0);
							},
							function(tx,error){
									alert(error.source + ":" +error.message);
								}
							);
							//alert("built!");
							});
					}
					else{
						return false;
						}
				}else{
					    //存入数据库
						var sqlstr1 = "INSERT INTO db_user VALUES(?,?,?)";
						db.transaction(function(tx){
						tx.executeSql(sqlstr1,[user_name,user_title,user_p],function(tx,rs){
							alert("已保存");
							},
							function(tx,error){
									alert(error.source + ":" +error.message);
								}
							);
							//alert("built!");
							});
				};
				
					
			
		};	
		});		
		 
	});