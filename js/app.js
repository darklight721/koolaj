(function(){
	var Board = function(width,height,tileSize) {
		var _width = width || 6;
		var _height = height || 6;
		var _tileSize = tileSize || 128;
		
		var _map = [];
		var _mapNextIndex = { x : 0, y : 0 };
		
		var _self = this;
		this.tiles = [];
		
		// constants
		var _tileIndex = {
			TILE_2_2 : 0,
			TILE_2_1 : 1,
			TILE_1_1 : 2,
			TILE_1_2 : 3
		};
		
		var _tileTypes = [
			{ h_factor : 2, w_factor : 2 },
			{ h_factor : 2, w_factor : 1 },
			{ h_factor : 1, w_factor : 1 },
			{ h_factor : 1, w_factor : 2 }
		];
		
		var clear = function() {
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
			// reset tiles
			_self.tiles = [];
		};
		
		this.setSize = function(width,height,tileSize) {
			_width = width;
			_height = height;
			_tileSize = tileSize;
		};
		
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
		
		var addTile = function(tileIndex) {
			var tile = {
				x : _tileSize * _mapNextIndex.x,
				y : _tileSize * _mapNextIndex.y,
				w : _tileSize * _tileTypes[tileIndex].w_factor,
				h : _tileSize * _tileTypes[tileIndex].h_factor
			};
			
			// save
			_self.tiles.push(tile);
		};
		
		this.formTiles = function() {
			clear();
			while (_mapNextIndex.y < _height) 
			{
				var tileIndex = getRandomTileIndex();
				addTile(tileIndex);
				setMapNextIndex(tileIndex);
			}
		};
	};
	
	var BoardDrawer = function() {
		var _images = [];
	
		this.clearBoard = function() {
			cnv.width = 768;
			cnv.height = 768;
		};
		
		this.clearImages = function() {
			_images = [];
		}
		
		this.drawTiles = function() {
			ctx.strokeStyle = "#eee";
			
			for (var i = 0; i < _board.tiles.length; i++)
			{
				var tile = _board.tiles[i];
				ctx.strokeRect(tile.x,tile.y,tile.w,tile.h);
			}
		};
		
		var drawImage = function(imgIndex) {
			if (imgIndex >= _board.tiles.length)
				return false;
		
			var image = _images[imgIndex];
			var tile = _board.tiles[imgIndex];
			
			var mult,sw,sh,sx,sy;
			if (tile.w > tile.h)
			{
				mult = Math.floor(image.width/tile.w);
				sw = mult === 0 ? image.width : tile.w * mult;
				sh = Math.floor(sw*tile.h/tile.w);
			}
			else
			{
				mult = Math.floor(image.height/tile.h);
				sh = mult === 0 ? image.height : tile.h * mult;
				sw = Math.floor(sh*tile.w/tile.h);
			}
			sx = Math.floor((image.width-sw)/2);
			sy = Math.floor((image.height-sh)/2);

			ctx.drawImage(image,sx,sy,sw,sh,tile.x,tile.y,tile.w,tile.h);
			
			return true;
		};
		
		this.addAndDrawImage = function(image) {
			if (_images.length >= _board.tiles.length)
				return;

			_images.push(image);
			drawImage(_images.length-1);
		};
		
		this.drawImages = function() {
			for (var i = 0; i < _images.length && drawImage(i); i++);
		};
	};

	function handleDragOver(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		cnv.className = "outset-shadow";
	}

	function handleDragLeave(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		cnv.className = "inset-shadow";
	}

	function handleDrop(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		cnv.className = "inset-shadow";
		
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
					_boardDrawer.addAndDrawImage(img);
				};
				img.src = e.target.result;
			};
			
			reader.readAsDataURL(files[i]);
		}
	}
	
	var baseTileSize = 128;
	
	// setup canvas
	var cnv = document.getElementById("c");
	var ctx = cnv.getContext("2d");
	
	// setup board
	var _board = new Board();
	_board.formTiles();
	
	// setup board drawer
	var _boardDrawer = new BoardDrawer();
	_boardDrawer.clearBoard();
	_boardDrawer.drawTiles();

	// add drag and drop to canvas
	cnv.addEventListener('dragover',handleDragOver,false);
	cnv.addEventListener('dragleave',handleDragLeave,false);
	cnv.addEventListener('drop',handleDrop,false);
	
	var size = document.getElementById("size");
	size.addEventListener('change',function(evt){
		var mult = parseInt(evt.target.value,10);
		if (!mult || mult === 0)
			mult = 1;
		var tileSize = baseTileSize * mult;
		var width = Math.floor(cnv.width/tileSize);
		var height = Math.floor(cnv.height/tileSize);
		
		_board.setSize(width,height,tileSize);
		_board.formTiles();
		
		_boardDrawer.clearBoard();
		_boardDrawer.drawTiles();
		_boardDrawer.drawImages();
	},false);
	
	var randomize = document.getElementById("randomize");
	randomize.addEventListener('click',function(evt){
		evt.preventDefault();
		
		_board.formTiles();
		_boardDrawer.clearBoard();
		_boardDrawer.drawTiles();
		_boardDrawer.drawImages();
	},false);

	var save = document.getElementById("save");
	save.addEventListener('click',function(){
		this.href = cnv.toDataURL();
		//this.href = cnv.toDataURL("image/jpeg",0.75);
	},false);

	var clear = document.getElementById("clear");
	clear.addEventListener('click',function(evt){
		evt.preventDefault();
		
		_boardDrawer.clearBoard();
		_boardDrawer.clearImages();
		_boardDrawer.drawTiles();
	},false);
})();