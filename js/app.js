(function(){
	var Board = function(width,height,tileSize) {
		var _width = width || 6;
		var _height = height || 6;
		var _tileSize = tileSize || 128;
		
		var _map = [];
		var _mapNextIndex = { x : 0, y : 0 };
		
		// for recording purposes
		var images = []; // { image, x, y, type}, ...
		
		// constants
		var _tileIndex = {
			TILE_2_2 : 0,
			TILE_2_1 : 1,
			TILE_1_1 : 2,
			TILE_1_2 : 3,
			
		};
		
		var _tileTypes = [
			{ h_factor : 2, w_factor : 2 },
			{ h_factor : 2, w_factor : 1 },
			{ h_factor : 1, w_factor : 1 },
			{ h_factor : 1, w_factor : 2 },
			
		];
		
		this.init = function() {
			// initialize map
			for (var y = 0; y < _height; y++)
			{
				_map[y] = _map[y] || [];
				for (var x = 0; x < _width; x++)
				{
					_map[y][x] = 0;
				}
			}
			_mapNextIndex.x = 0;
			_mapNextIndex.y = 0;
		};
		this.init();
		
		var random = function(n) {
			n = n || 0;
			return Math.floor(Math.random()*n);
		};
		
		var getRandomTileIndex = function() {
			var tile;
			
			var x = _mapNextIndex.x,
				y = _mapNextIndex.y;
			var is_x_free = x+1 < _width && _map[y][x+1] === 0,
				is_y_free = y+1 < _height && _map[y+1][x] === 0;
			
			if (is_x_free && is_y_free)
				tile = random(4);
			else if (is_x_free)
				tile = random(2) + 2;
			else if (is_y_free)
				tile = random(2) + 1;
			else
				tile = _tileIndex.TILE_1_1;
			
			return tile;
		};
		
		var setMapNextIndex = function(tileIndex) {
			var x = _mapNextIndex.x,
				y = _mapNextIndex.y;
				
			switch (tileIndex)
			{
				case _tileIndex.TILE_2_2:
					_map[y][x] = 1;
					_map[y][x+1] = 1;
					_map[y+1][x] = 1;
					_map[y+1][x+1] = 1;
					x += 2;
					break;
				case _tileIndex.TILE_2_1:
					_map[y][x] = 1;
					_map[y+1][x] = 1;
					x++;
					break;
				case _tileIndex.TILE_1_2:
					_map[y][x] = 1;
					_map[y][x+1] = 1;
					x += 2;
					break;
				case _tileIndex.TILE_1_1:
					_map[y][x] = 1;
					x++;
					break;
			}
			
			if (x === _width)
				x--;
				
			while (y < _height && _map[y][x] === 1)
			{
				x++;
				if (x === _width)
				{
					x = 0;
					y++;
				}
			}
			
			_mapNextIndex.x = x;
			_mapNextIndex.y = y;
		};
		
		this.addImage = function(image,draw) {
			
			if (_mapNextIndex.x === _width && _mapNextIndex.y === _height)
				return;
			
			var tileIndex = getRandomTileIndex();
			var params = {
				x : _tileSize * _mapNextIndex.x,
				y : _tileSize * _mapNextIndex.y,
				w : _tileSize * _tileTypes[tileIndex].w_factor,
				h : _tileSize * _tileTypes[tileIndex].h_factor
			};
			
			// draw here
			draw(params);
			
			// save
			images.push({
				img : image.src,
				x : params.x,
				y : params.y,
				tile : tileIndex
			});
			
			setMapNextIndex(tileIndex);
		};
	};

	function handleDragOver(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		c.className = "outset-shadow";
	}

	function handleDragLeave(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		c.className = "inset-shadow";
	}

	function handleDrop(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		c.className = "inset-shadow";
		
		var files = evt.dataTransfer.files;
		for (var i = 0; i < files.length; i++)
		{
			// Only process image files
			var imageType = /image.*/;
			if (!files[i].type.match(imageType))
				continue;
				
			var reader = new FileReader();
			
			reader.onerror = function(e) {
				alert("Error code: " + e.target.error.code);
			};
			
			reader.onload = function(e) {
				var img = new Image();
				img.onload = function() {
					b.addImage(img,function(params){
						console.log(params.x + ' ' + params.y + ' ' + params.w + ' ' + params.h);
						//ctx.drawImage(img,params.x,params.y,params.w,params.h);
						var mult,sw,sh,sx,sy;
						if (params.w > params.h)
						{
							mult = Math.floor(img.width/params.w);
							sw = mult === 0 ? img.width : params.w * mult;
							sh = Math.floor(sw*params.h/params.w);
						}
						else
						{
							mult = Math.floor(img.height/params.h);
							sh = mult === 0 ? img.height : params.h * mult;
							sw = Math.floor(sh*params.w/params.h);
						}
						sx = Math.floor((img.width-sw)/2);
						sy = Math.floor((img.height-sh)/2);

						ctx.drawImage(img,sx,sy,sw,sh,params.x,params.y,params.w,params.h);
					});
				};
				img.src = e.target.result;
			};
			
			reader.readAsDataURL(files[i]);
		}
	}

	var b = new Board();
	var c = document.getElementById("c");
	var ctx = c.getContext("2d");

	c.width = 768;
	c.height = 768;

	// add drag and drop to canvas
	c.addEventListener('dragover',handleDragOver,false);
	c.addEventListener('dragleave',handleDragLeave,false);
	c.addEventListener('drop',handleDrop,false);

	var save = document.getElementById("save");
	save.addEventListener('click',function(){
		this.href = c.toDataURL();
	},false);

	var clear = document.getElementById("clear");
	clear.addEventListener('click',function(evt){
		evt.preventDefault();
		c.width = 768;
		c.height = 768;
		b.init();
	},false);
})();