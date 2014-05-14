/*** 注意：依赖jquery-1.8.2.min.js；绑定快捷键依赖Mousetrap 库，要解除依赖请重写使用到Mousetrap.bind() 方法的地方；同步歌词依赖lrc.main.js ，需要解除依赖请直接使用yplayer.lite.js  ***/

/** 全局命名空间 **/
var Y = {
	/* 为不足两位的字符串补0 */
	add0: function(str){
		var str = str.toString();
		return (str.length<2)?('0'+str):(str);
	},

	/* 检查数组中是否存在指定值（或对象） */
	contains: function(array, elem){
		for(var i = 0, l = array.length; i < l; i ++){
			if(array[i] === elem){
				return true;
			}
		}
		return false;
	},

	/* 添加值或对象到数组末端，防止添加相同的值或对象 */
	push: function(arr, el){
		var contains = function(array, elem){
			for(var i = 0, l = array.length; i < l; i ++){
				if(array[i] === elem){
					return true;
				}
			}
			return false;
		};
		if(!contains(arr, el)){
			arr[arr.length] = el;
			return arr.length;
		}
}

};
/** 播放核心 **/
Y.audio = new Audio();
/** 指示当前播放的条目 **/
Y.nowPlayingId = null;
/** 文件列表 **/
Y.list = [];

Y.lyricsList = [];

/** DOM 元素 **/
Y.dom = {
	/* 播放按钮，同时用作添加文件按钮和暂停按钮 */
	play: $('#play'),
	/* 下一曲按钮 */
	next: $('#next'),
	/* 实际载入文件的对象，是一个input[type='file'] */
	file: $('#file'),
	/* 文件列表，是一个空的ul ，用于插入文件条目 */
	playlist: $('#playlist'),
	/* 进度条背景，width 为500px 的div */
	progress: $('#progress'),
	/* 进度条，一个没有设置宽度的span */
	nowprogress: $('#now'),
	/* 用于在操作栏上显示当前播放的文件名称的span */
	nowitem: $('#nowitem'),
	/* 音量滑条背景，一个span */
	volumebar: $('#volumebar'),
	/* 音量滑条，是一个span */
	volume: $('#volume'),
	/* 用于在操作栏上显示当前时间点和文件总时长的span 标签 */
	time: $('#time'),
	/* 菜单按钮 */
	menu: $('#menu'),
	/* 菜单div */
	childmenu: $('#childmenu'),
	/* 列表选项菜单按钮 */
	listoption: $('#listoption'),
	/* 播放选项菜单按钮 */
	playeroption: $('#playeroption'),
	/* 列表选项菜单div */
	listoptionmenu: $('#listoptionmenu'),
	/* 播放选项菜单div */
	playeroptionmenu: $('#playeroptionmenu'),
	/* 列表居左按钮 */
	listalignl: $('#listalignl'),
	/* 列表居中按钮 */
	listalignc: $('#listalignc'),
	/* 列表居右按钮 */
	listalignr: $('#listalignr'),
	/* 列表重绘按钮 */
	listredraw: $('#listredraw'),
	/* 切换随机状态的按钮 */
	toggleshuffle: $('#toggleshuffle'),
	/* 切换循环状态的按钮 */
	toggleloop: $('#toggleloop')
};

/** 设置，loop 指示循环设置，有三种值：no、single 和list ；shuffle 指示选择曲目时是否随机，有true 和false 两种值 **/
Y.settings = {
	loop: 'no',
	shuffle: false
};

/** 用于在loop 为no 时记录已经播放过的文件，避免重复播放 **/
Y.played = [];

/** 遍历指定目录，提取m4a 、mp3 、ogg 或lrc 格式文件 **/
Y.parseDir = function(files){
	var _self = this,
		songRe = /\.mp3$|\.m4a$|\.ogg$/i;
	if(files.length){
		for(var i = 0, l = files.length; i < l; i ++){
			/* Chrome 支持m4a 、mp3 和ogg 格式 */
			if(songRe.test(files[i].name)){
				_self.list.push(files[i]);
			}
		}
		return _self;
	}
};

/** 显示文件列表 **/
Y.showList = function(){
	var _self = this,
	/* 随机颜色对，用于列表条目，主要是为了看起来炫一点 */
	randomColorPair = function(){
		var h, s, l, a, h1, s1, l1, c = [];
		h = Math.floor(Math.random()*360);
		s = Math.floor(Math.random()*100);
		l = Math.floor(15 + Math.random()*70);
		a = 1;
		h1 = (h > 240)?(h - 120):(h + 120);
		s1 = Math.floor(15 + Math.random()*85);
		l1 = ((l-50) >= 0)?(l - 50):(l + 50);
		c.push('hsla(' + h + ', ' + s + '%, ' + l + '%, ' + a + ')');
		c.push('hsla(' + h1 + ', ' + s1 + '%, ' + l1 + '%, ' + a + ')');
		return c;
	},
	colorPair;
	// easyAnim(_self.dom.playlist[0]).hide();
	_self.dom.playlist.html('');
	for(var i = 0, l = _self.list.length; i < l; i ++){
		var item = $('<li></li>'),
			name = _self.list[i].name.replace(/\.mp3$|\.m4a$|\.ogg$/i, '').replace(/^\d{2,}(\ |\.|\-)/i, '');
		colorPair = randomColorPair();
		item.html((name.length > 20)?((name).substr(0, 15) + '...'):(name)).attr('title', _self.list[i].name).attr('onclick', 'Y.play(' + i + ');').css({'backgroundColor': colorPair[0], 'color': colorPair[1]});
		// item.style.borderRadius = Math.floor(Math.random()*20) + 'px';
		_self.dom.playlist[0].appendChild(item[0]);
		console.log(item[0]);
	}
	easyAnim(_self.dom.playlist[0]).show(1000);
};

/** 播放和继续，包括第一次播放（核心的src 属性不存在，并且当前条目为null ，此时会随机挑选一条来播放） **/
Y.play = function(num){
	var _self = this,
		data = '',
		createBlobURL = (window.URL && URL.createObjectURL.bind(URL)) || (window.webkitURL && webkitURL.createObjectURL.bind(webkitURL)) || window.createObjectURL,
		nowplayingTop = 0,
		nowname = '';
	/* 列表不存在时不能播放 */
	if(_self.list.length){
		/* 没有传入参数 */
		if(num == undefined){
			/* 没有传入参数，核心src 属性有定义，核心处于paused 状态，说明当前正处于某个文件的暂停状态，此时继续播放 */
			if(_self.audio.src && _self.audio.paused){
				_self.dom.playlist.children().eq(_self.nowPlayingId).attr('class', 'nowplaying');
				_self.audio.play();
			/* 没有传入参数，核心src 未定义，说明是载入文件后的第一次播放，而且是通过播放按钮触发（如果是列表中的文件触发会传入参数），随机选择一个文件播放 */
			}else if(!_self.audio.src){
				num = Math.floor(Math.random()*_self.list.length);
				data = createBlobURL(_self.list[num]);
				_self.audio.src = data;
				_self.audio.play();
				_self.nowPlayingId = num;
				_self.dom.playlist.children().eq(num).attr('class', 'nowplaying');
			}
		/* 有传入参数 */
		}else{
			/* 参数与正在播放id 不同，且核心src 属性有定义，说明用户切换了歌曲 */
			if((num != _self.nowPlayingId) && _self.audio.src){
				_self.dom.playlist.children().eq(_self.nowPlayingId).attr('class', '');
				data = createBlobURL(_self.list[num]);
				_self.audio.src = data;
				_self.audio.play();
				_self.nowPlayingId = num;
				_self.dom.playlist.children().eq(num).attr('class', 'nowplaying');
			/* 参数与正在播放id 不同，且核心src 属性no定义，说明是第一次播放，而且是通过文件列表触发，此时播放指定文件 */
			}else if((num != _self.nowPlayingId) && !_self.audio.src){
				data = createBlobURL(_self.list[num]);
				_self.audio.src = data;
				_self.audio.play();
				_self.nowPlayingId = num;
				_self.dom.playlist.children().eq(num).attr('class', 'nowplaying');
			/* 参数与正在播放id 相同，核心src 属性有定义，且核心处于paused 状态，可能是单曲循环状态下切换曲目时由playNext 方法触发（也可能是当前曲目暂停时用户点击文件列表中当前播放条目触发） */
			}else if((num == _self.nowPlayingId) && _self.audio.src && _self.audio.paused){
				_self.audio.play();
				_self.dom.playlist.children().eq(num).attr('class', 'nowplaying');
			/* 参数与正在播放id 相同，核心src 属性有定义，且核心正处于播放状态，可能是用户选择重新绘制列表后请求重新突出显示当前条目，也可能是正在播放时用户点击文件列表中当前播放条目触发，统一处理成突出显示当前条目 */
			}else if((num == _self.nowPlayingId) && _self.audio.src && !_self.audio.paused){
				_self.dom.playlist.children().eq(num).attr('class', 'nowplaying');
			}
		}
	}else{
		return false;
	}
	/* 在当前条目中显示文件名 */
	nowname = _self.list[_self.nowPlayingId].name.replace(/\.mp3$|\.m4a$|\.ogg$/i, '').replace(/^\d{2,}(\ |\.|\-)/i, '');
	_self.dom.nowitem.html(nowname);
	/* 在页面标题栏现实文件名 */
	$(document).attr('title', nowname + ' - Yplayer');
	/* 设置中关闭循环时，将当前条目记录在“已经播放过”数组中 */
	/* 切换播放按钮外观为暂停键 */
	_self.dom.play.css({'backgroundImage': 'url(\'Pause.png\')'}).attr({'title': '暂停'});
	/* 计算文档当前可见位置与当前条目之间的距离，120 是为顶部播放器操作栏空出的高度 */
	nowplayingTop = ($(document).height() - $('.nowplaying').get(0).offsetTop <= (window.innerHeight - 120))?($('.nowplaying').get(0).offsetTop):($('.nowplaying').get(0).offsetTop - 120);
	/* 滑动文档使当前条目处于可见位置 */
	$('body').animate({scrollTop: nowplayingTop + 'px'}, {queue: false, duration: 300});
	if(_self.settings.loop == 'no'){
		_self.push(_self.played, _self.nowPlayingId);
	}
	return false;
};

/** 暂停 **/
Y.pause = function(){
	var _self = this;
	if(!_self.audio.paused){
		_self.audio.pause();
		_self.dom.play.css({'backgroundImage': 'url(\'Play.png\')'}).attr({'title': '播放'});
	}
};

/** 跳到指定时间点上 **/
Y.jumpTo = function(time){
	var _self = this;
	if(time <= _self.audio.duration){
		_self.audio.currentTime = time;
	}
};

/** 调整音量 **/
Y.updateVolume = function(volume){
	var _self = this;
	if((volume <= 1) && (volume >= 0)){
		_self.audio.volume = volume;
		/* 这个方法同时还负责调整音量条的外观 */
		_self.dom.volume.css({'width': volume * 100 + 'px'});
		_self.dom.volumebar.attr({'title': '音量：' + Math.floor(_self.audio.volume*100).toString() + '%'});
	}
};

/** 调整进度条的宽度（视觉长度）和时间标记中的数字 **/
Y.barProgress = function(){
	var _self = this,
		current = 0,
		bRangesLength = 0,
		bValue = 0,
		buffer = 0,
		cu = 0,
		du = 0;
	(_self.audio.currentTime > 0 && _self.audio.currentTime < _self.audio.duration) ? current = Math.floor((500 / _self.audio.duration) * _self.audio.currentTime) : current = 0;
	_self.dom.nowprogress.css({'width': current + 'px'});
	bRangesLength = _self.audio.buffered.length;
	bValue = _self.audio.buffered.end(bRangesLength - 1);
	buffer = Math.floor((500 * bValue) / _self.audio.duration);
	_self.dom.progress.css({'width': buffer + 'px'});
	cu = _self.add0(Math.floor(_self.audio.currentTime/60).toString())+':'+_self.add0(Math.floor(_self.audio.currentTime%60).toString());
	du = _self.add0(Math.floor(_self.audio.duration/60).toString())+':'+_self.add0(Math.floor(_self.audio.duration%60).toString());
	_self.dom.time.html(cu + '/' + du);
};

/** 播放下一个文件 **/
Y.playNext = function(){
	var _self = this;
	/* 单曲循环时 */
	if(_self.settings.loop == 'single'){
		_self.play(_self.nowPlayingId);
		return false;
	/* 列表循环时 */
	}else if(_self.settings.loop == 'list'){
		/* 列表循环+随机 */
		if(_self.settings.shuffle){
			_self.play(Math.floor(Math.random()*_self.list.length));
			return false;
		/* 列表循环+顺序 */
		}else{
			if(_self.nowPlayingId < _self.list.length){
				_self.play(_self.nowPlayingId+1);
				return false;
			}else{
				_self.play(0);
				return false;
			}
		}
	/* 关闭循环时 */
	}else if(_self.settings.loop == 'no'){
		/* 关闭循环+随机 */
		if(_self.settings.shuffle){
			var sxloop = function(){
				/* “已经播放过”数组与文件列表长度一样，说明所有文件都已经播放过了，直接返回（如果不做这个判断，在所有文件播放结束后会陷入死循环 */
				if(_self.played.length == _self.list.length){
					return false;
				}else{
					var num = Math.floor(Math.random()*_self.list.length);
					if(!_self.contains(_self.played, num)){
						_self.play(num);
						return false;
					}else{
						sxloop();
					}
				}
			};
			sxloop();
		/* 关闭循环+顺序 */
		}else{
			/* 关闭循环+顺序播放，在列表末尾要做一个判断，因为播放到了列表末尾并不表示列表头部的曲目播放过 */
			if(_self.nowPlayingId < _self.list.length-1){
				var num = _self.nowPlayingId + 1;
				var xloop = function(){
					/* “已经播放过”数组与文件列表长度一样，说明所有文件都已经播放过了，直接返回（如果不做这个判断，在所有文件播放结束后会陷入死循环 */
					if(_self.played.length == _self.list.length){
						return false;
					}else{
						if(!_self.contains(_self.played, num)){
							_self.play(num);
							return false;
						}else{
							num ++;
							xloop();
						}
					}
				};
				xloop();
				return false;
			}else{
				var num = 0;
				var xloop = function(){
					/* “已经播放过”数组与文件列表长度一样，说明所有文件都已经播放过了，直接返回（如果不做这个判断，在所有文件播放结束后会陷入死循环 */
					if(_self.played.length == _self.list.length){
						return false;
					}else{
						if(!_self.contains(_self.played, num)){
							_self.play(num);
							return false;
						}else{
							num ++;
							xloop();
						}
					}
				};
				xloop();
				return false;
			}
		}
	}
};

/** 切换循环状态（是否随机挑选下一曲），整个播放选项设置是参考我的诺基亚手机自带播放器设计的 **/
Y.toggleLoop = function(){
	var _self = this,
		loopArray = ['no', 'single', 'list'],
		loopImgArray = ['url(\'Delete.png\')', 'url(\'Lock.png\')', 'url(\'Paper.png\')'],
		nowLoop = loopArray.indexOf(Y.settings.loop);
	if(nowLoop == 0){
		_self.played.length = 0;
	}
	if(nowLoop < loopArray.length-1){
		_self.settings.loop = loopArray[nowLoop+1];
		_self.dom.toggleloop.css({'backgroundImage': loopImgArray[nowLoop+1]});
	}else{
		_self.settings.loop = loopArray[0];
		_self.dom.toggleloop.css({'backgroundImage': loopImgArray[0]});
	}
	return false;
};

/** 切换随机状态 **/
Y.toggleShuffle = function(){
	var _self = this;
	_self.settings.shuffle = !_self.settings.shuffle;
	_self.dom.toggleshuffle.css({'backgroundImage': (_self.settings.shuffle)?('url(\'Clock.png\')'):('url(\'Remove.png\')')});
	return false;
};

/** 初始化，注意所有DOM 操作都需要return false 来阻止浏览器默认动作（因为使用a 标签作为按钮） **/
Y.init = function(){
	var _self = this;
	_self.updateVolume(0.7);
	/* 添加文件夹/播放/暂停功能都在一个按钮上 */
	_self.dom.play.on('click', function(){
		if(_self.list.length == 0){ /* 没有列表时需要先载入文件 */
			_self.dom.file.click();
			return false;
		}else{
			if(_self.audio.paused){
				_self.play();
				return false;
			}else{
				_self.pause();
				return false;
			}
		}
	});
	/* 点击播放下一个文件 */
	_self.dom.next.on('click', function(){
		if(_self.list.length){
			_self.playNext();
			return false;
		}else{
			return false;
		}
	});
	/* 点击调整音量 */
	_self.dom.volumebar.on('click', function(e){
		var x = e.pageX - this.offsetLeft;
		_self.updateVolume(x / 100);
	});
	/* 拖动调整音量，由于音量条比较细，这个拖动模拟使用并不是很方便，但是暂时没有其他方案 */
	_self.dom.volumebar.onmousedown = function(e){
		this.mousevalid = true;
	};
	_self.dom.volumebar.onmouseup = function(e){
		this.mousevalid = false;
	};
	_self.dom.volumebar.onmouseout = function(e){
		this.mousevalid = false;
	};
	_self.dom.volumebar.onmousemove = function(e){
		var x = e.pageX - this.offsetLeft;
		if(this.mousevalid){
			_self.updateVolume(x / 100);
		}
	};
	/* 载入文件夹（中的文件） */
	_self.dom.file[0].onchange = function(){
		_self.parseDir(_self.dom.file[0].files).showList();
		if(_self.list.length){
			/* 按钮外观切换为播放键 */
			_self.dom.play.css({'backgroundImage': 'url(\'Play.png\')'}).attr({'title': '播放'});
		}
	};
	/* 实时更新进度条 */
	_self.audio.addEventListener('timeupdate', function(){
			_self.barProgress();
		}
	);
	/* 播放结束时的动作 */
	_self.audio.addEventListener('ended', function(){
			if(_self.nowPlayingId != null){
				/* 解除当前条目的突出显示 */
				_self.dom.playlist.children().eq(_self.nowPlayingId).attr({'class': ''});
				/* 清空条目显示 */
				_self.dom.nowitem.html('');
				/* 时间显示中的“当前时间”置零 */
				var du = _self.add0(Math.floor(_self.audio.duration/60).toString())+':'+_self.add0(Math.floor(_self.audio.duration%60).toString());
				_self.dom.time.html('00:00/' + du);
				/* 播放下一个文件 */
				_self.playNext();
			}
		}
	);
	/* 用户在进度条上点击时跳到相应时间点 */
	_self.dom.progress.on('click', function(e){
		var x = e.pageX - this.offsetLeft,
			rate = x / 500,
			targetTime = rate * _self.audio.duration;
		_self.jumpTo(targetTime);
		_self.play();
	});
	/* 显示和隐藏二级菜单 */
	_self.dom.menu.on('click', function(e){
		var x = this.offsetLeft + 32,
			y = this.offsetTop + 32;
		_self.dom.childmenu.css({'left': x.toString()+'px', 'top': y.toString()+'px'});
		if(!_self.dom.childmenu.is(':visible')){
			_self.dom.childmenu.show(300);
		}else{
			_self.dom.childmenu.hide(300);
		}
		if(_self.dom.listoptionmenu.is(':visible')){
			_self.dom.listoptionmenu.hide(300);
		}
		if(_self.dom.playeroptionmenu.is(':visible')){
			_self.dom.playeroptionmenu.hide(300);
		}
		return false;
	});
	/* 显示和隐藏列表选项菜单 */
	_self.dom.listoption.on('click', function(e){
		var x = this.offsetLeft + this.parentElement.offsetLeft + 32,
			y = this.offsetTop + this.parentElement.offsetTop + 32;
		_self.dom.listoptionmenu.css({'left': x.toString()+'px', 'top': y.toString()+'px'});
		if(_self.dom.playeroptionmenu.is(':visible')){
			_self.dom.playeroptionmenu.hide(300);
		}
		if(!_self.dom.listoptionmenu.is(':visible')){
			_self.dom.listoptionmenu.show(300);
			return false;
		}else{
			_self.dom.listoptionmenu.hide(300);
			return false;
		}
	});
	/* 显示和隐藏播放选项菜单 */
	_self.dom.playeroption.on('click', function(e){
		var x = this.offsetLeft + this.parentElement.offsetLeft + 32,
			y = this.offsetTop + this.parentElement.offsetTop + 32;
		_self.dom.playeroptionmenu.css({'left': x.toString()+'px', 'top': y.toString()+'px'});
		if(_self.dom.listoptionmenu.is(':visible')){
			_self.dom.listoptionmenu.hide(300);
		}
		if(!_self.dom.playeroptionmenu.is(':visible')){
			_self.dom.playeroptionmenu.show(300);
			return false;
		}else{
			_self.dom.playeroptionmenu.hide(300);
			return false;
		}
	});
	/* 文件列表居左 */
	_self.dom.listalignl.on('click', function(){
		_self.dom.playlist.css({'textAlign': 'left'});
		_self.dom.listoptionmenu.hide(300);
		return false;
	});
	/* 文件列表居中 */
	_self.dom.listalignc.on('click', function(){
		_self.dom.playlist.css({'textAlign': 'center'});
		_self.dom.listoptionmenu.hide(300);
		return false;
	});
	/* 文件列表居右 */
	_self.dom.listalignr.on('click', function(){
		_self.dom.playlist.css({'textAlign': 'right'});
		_self.dom.listoptionmenu.hide(300);
		return false;
	});
	/* 重绘列表（重新生成列表DOM 元素，这个过程会重新配制随机色） */
	_self.dom.listredraw.on('click', function(){
		_self.showList();
		/* 此时列表中没有突出显示当前条目，请求突出显示（在play 方法中已经处理过，不会干扰正常的播放） */
		if(!_self.audio.paused && (_self.nowPlayingId != null)){
			_self.play(_self.nowPlayingId);
		}
		_self.dom.listoptionmenu.hide(300);
		return false;
	});
	/* 切换随机状态 */
	_self.dom.toggleshuffle.on('click', function(){
		_self.toggleShuffle();
		return false;
	});
	/* 切换循环状态 */
	_self.dom.toggleloop.on('click', function(){
		_self.toggleLoop();
		return false;
	});
	/* 绑定快捷键 */
	/* Ctrl + up ：音量加 */
	Mousetrap.bind('ctrl+up', function(){
			var volume = _self.audio.volume;
			if(volume < 1){
				volume += 0.01;
				_self.updateVolume(volume);
			}
			return false;
		}
	);
	/* Ctrl + down ：音量减 */
	Mousetrap.bind('ctrl+down', function(){
			var volume = _self.audio.volume;
			if(volume > 0){
				volume -= 0.01;
				_self.updateVolume(volume);
			}
			return false;
		}
	);
	/* Ctrl + right ：下一曲 */
	Mousetrap.bind('ctrl+right', function(){
			_self.playNext();
			return false;
		}
	);
	/* 空格键：播放/暂停 */
	Mousetrap.bind('space', function(){
			if(_self.audio.paused){
				_self.play();
				return false;
			}else{
				_self.pause();
				return false;
			}
		}
	);
	/* 下面四个快捷键是列表相关，特意挑选了w 、a 、s 、d 四个键 */
	/* w ：重绘列表 */
	Mousetrap.bind('w', function(){
			_self.showList();
			/* 此时列表中没有突出显示当前条目，请求突出显示（在play 方法中已经处理过，不会干扰正常的播放） */
			if(!_self.audio.paused && (_self.nowPlayingId != null)){
				_self.play(_self.nowPlayingId);
			}
			_self.dom.listoptionmenu.hide(300);
			return false;
		}
	);
	/* a ：列表居左 */
	Mousetrap.bind('a', function(){
			_self.dom.playlist.css({'textAlign': 'left'});
			_self.dom.listoptionmenu.hide(300);
			return false;
		}
	);
	/* s ：列表居中 */
	Mousetrap.bind('s', function(){
			_self.dom.playlist.css({'textAlign': 'center'});
			_self.dom.listoptionmenu.hide(300);
			return false;
		}
	);
	/* d ：列表居右 */
	Mousetrap.bind('d', function(){
			_self.dom.playlist.css({'textAlign': 'right'});
			_self.dom.listoptionmenu.hide(300);
			return false;
		}
	);
	/* Ctrl + l ：切换循环状态（Control Loop ） */
	Mousetrap.bind('ctrl+l', function(){
			_self.toggleLoop();
			return false;
		}
	);
	/* Ctrl + r ：切换随机状态（Control Random ），不用Ctrl + s （Control Shuffle ）是因为这个组合是浏览器默认的保存网页 */
	Mousetrap.bind('ctrl+r', function(){
			_self.toggleShuffle();
			return false;
		}
	);
};