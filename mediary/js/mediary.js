// JavaScript Document

// *mediary javascript


$(function(){
//创建一个数据库对象，包含4个参数
//分别为数据库名称，版本号，数据库描述，数据库大小
	var database = null;
	var db = openDatabase('mydata','','database','3*1024*1024');
	db.transaction(function(tx){
			tx.executeSql('CREATE TABLE IF NOT EXISTS Medata(time TEXT,title TEXT,content TEXT)',[]);
			//alert("built!");
		});

//load数据 history页JS
//history页面载入数据库已有文章 	
//清除已有列表保证最新
	$("#show").click(function(){
		
		//alert("list!");
		var _list = $("#_list").get(0);
		//alert("list1!");
		
		for(var i = _list.childNodes.length-1; i>=0; i--){
			_list.removeChild(_list.childNodes[i]);
			//alert("list!");
			}
		
		db.transaction(function(tx){
			tx.executeSql('SELECT * FROM Medata',[],function(tx,rs){
					//alert("select right!");
					//用倒序保证后写的在前面
				    for(var i=rs.rows.length-1; i>=0; i--){
					//alert("rows right!");
					var li_dom = document.createElement('li');
					var title_dom = document.createElement('h4');
					var time_dom = document.createElement('h6');
					var content_dom = document.createElement('pre');
					title_dom.innerHTML = rs.rows.item(i).title;
					time_dom.innerHTML = rs.rows.item(i).time;
					content_dom.innerHTML = rs.rows.item(i).content;
					li_dom.appendChild(title_dom);
					li_dom.appendChild(time_dom);
					li_dom.appendChild(content_dom);
					_list.appendChild(li_dom);
					}
				});
			
		});
		

		});
	
	

	
// save funtion 记住按钮点击事件 write页
    $("#add").click(function(){
    	//若数据库存在
			if(db){
			var _title = $("#title").val();
			//alert(_title);
			var _content = $("#content").val();
			//var _content_to_html = _content.replace("\r\n","<br>");
			//var _time = new Date().toUTCString();
			var _time = new Date().toLocaleString();
			//alert(_time);
			// 当有空白时用户确认是否记录
			if(_title==""||_content==""){
				if(window.confirm("你想交白卷么？")){
					//确认写入数据库
					//alert("yes!");
					var _title_van = "又一次没有写题目";
					var _content_van = "什么都没写，你能看出什么？";
					var sqlstr = "INSERT INTO Medata VALUES(?,?,?)";
					db.transaction(function(tx){
						tx.executeSql(sqlstr,[_time,_title_van,_content_van],function(tx,rs){
							alert("已保存");
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
						var sqlstr1 = "INSERT INTO Medata VALUES(?,?,?)";
						db.transaction(function(tx){
						tx.executeSql(sqlstr1,[_time,_title,_content],function(tx,rs){
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