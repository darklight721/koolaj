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
		// var cnv, ctx, _board; - defined outside
		var _images = [];
		var _highlightedTile = -1;
		
		// for scrolling imgage
		var _anchorPoint = null;
		
		this.saveAsAnchorPoint = function(image,mousePos) {
			if (image && image.slice)
			{
				_anchorPoint = {
					x : image.slice.x + mousePos.x,
					y : image.slice.y + mousePos.y
				};
			}
		};
		
		this.removeSlice = function(image) {
			if (image)
				image.slice = null;
			_anchorPoint = null;
		};
		
		this.removeAllSlices = function() {
			for (var i = 0; i < _board.tiles.length; i++)
				this.removeSlice(_images[i]);
		};
		
		this.scrollImage = function(image,mousePos) {
			if (!_anchorPoint || !image.slice)
				return;
			
			var newX = _anchorPoint.x - mousePos.x,
				newY = _anchorPoint.y - mousePos.y;
			
			newX = Math.max(newX,0);
			newX = Math.min(newX,Math.abs(image.width-image.slice.w));
			
			newY = Math.max(newY,0);
			newY = Math.min(newY,Math.abs(image.height-image.slice.h));
			
			image.slice.x = newX;
			image.slice.y = newY;
			
			ctx.drawImage(image,
						  image.slice.x, image.slice.y,
						  image.slice.w, image.slice.h,
						  image.slice.dx, image.slice.dy,
						  image.slice.dw, image.slice.dh);
		};
		
		this.scaleImageAt = function(mousePos,isScaleUp) {
			var image = this.getImageAt(mousePos);
			if (image && image.slice)
			{
				if (image.slice.w === image.width || image.slice.h === image.height)
					return;
					
				var newW, newH;
				if (image.slice.dw > image.slice.dh)
				{
					newW = isScaleUp ? image.slice.w + 10 : image.slice.w - 10;
					newW = Math.max(newW,image.slice.dw);
					newW = Math.min(newW,image.width);
					newH = Math.floor(newW*image.slice.dh/image.slice.dw);
				}
				else
				{
					newH = isScaleUp ? image.slice.h + 10 : image.slice.h - 10;
					newH = Math.max(newH,image.slice.dh);
					newH = Math.min(newH,image.height);
					newW = Math.floor(newH*image.slice.dw/image.slice.dh);	
				}
				
				image.slice.w = newW;
				image.slice.h = newH;
				// update x and y
				image.slice.x = Math.min(image.slice.x,Math.abs(image.width-image.slice.w));
				image.slice.y = Math.min(image.slice.y,Math.abs(image.height-image.slice.h));
				
				//console.log(image.slice.x + ' ' + image.slice.y + ' ' + image.slice.w + ' ' + image.slice.h + ' ' + image.slice.dx + ' ' + image.slice.dy + ' ' + image.slice.dw + ' ' + image.slice.dh);
				
				ctx.drawImage(image,
						  image.slice.x, image.slice.y,
						  image.slice.w, image.slice.h,
						  image.slice.dx, image.slice.dy,
						  image.slice.dw, image.slice.dh);
			}
		};

		this.clearBoard = function() {
			cnv.width = cnv.width;
			cnv.height = cnv.height;
		};

		this.clearImages = function() {
			_images = [];
		};

		var validateTile = function(tileIndex) {
			return (tileIndex > -1 && tileIndex < _board.tiles.length);
		};

		this.drawTiles = function() {
			ctx.strokeStyle = "#eee";

			for (var i = 0; i < _board.tiles.length; i++)
			{
				var tile = _board.tiles[i];
				ctx.strokeRect(tile.x,tile.y,tile.w,tile.h);
			}
		};

		var drawHighlightedTile = function() {
			if (validateTile(_highlightedTile))
			{
				ctx.fillStyle = "#fafafa";
				var tile = _board.tiles[_highlightedTile];
				ctx.fillRect(tile.x,tile.y,tile.w,tile.h);
			}
		};

		this.getTileAt = function(mousePos) {
			var i;
			for (i = 0; i < _board.tiles.length; i++)
			{
				var tile = _board.tiles[i];
				if (mousePos.x >= tile.x && mousePos.x <= tile.x + tile.w &&
					mousePos.y >= tile.y && mousePos.y <= tile.y + tile.h)
					break;
			}
			return i;
		};

		this.getImageAt = function(mousePos) {
			var i = this.getTileAt(mousePos);
			if (_images[i])
				return _images[i];
			return null;
		};

		this.highlightTile = function(mousePos) {
			var i = this.getTileAt(mousePos);

			if (i !== _board.tiles.length && i !== _highlightedTile)
			{
				_highlightedTile = i;

				this.clearBoard();
				this.drawTiles();
				this.drawImages();
				drawHighlightedTile();
			}
		};

		this.removeHighlight = function() {
			_highlightedTile = -1;
			this.clearBoard();
			this.drawTiles();
			this.drawImages();
		};

		this.addImageAt = function(tileIndex, image) {
			if (image && validateTile(tileIndex))
			{
				_images[tileIndex] = image;
			}
		}

		this.removeImageAt = function(tileIndex) {
			if (validateTile(tileIndex))
			{
				_images[tileIndex] = null;
			}
		};

		this.drawImage = function(tileIndex,img) {
			if (!validateTile(tileIndex))
				return false;

			var image;

			if (img)
			{
				image = img;
			}
			else
			{
				if (!_images[tileIndex])
					return true;

				image = _images[tileIndex];
			}

			var tile = _board.tiles[tileIndex];
			var sw,sh,sx,sy;
			
			if (image.slice)
			{
				sx = image.slice.x;
				sy = image.slice.y;
				sw = image.slice.w;
				sh = image.slice.h;
			}
			else
			{
				var compute_sw_then_sh = function() {
					var mult = Math.floor(image.width/tile.w);
					sw = mult === 0 ? image.width : tile.w * mult;
					sh = Math.floor(sw*tile.h/tile.w);
				};
				
				var compute_sh_then_sw = function() {
					var mult = Math.floor(image.height/tile.h);
					sh = mult === 0 ? image.height : tile.h * mult;
					sw = Math.floor(sh*tile.w/tile.h);
				};
				
				if (tile.w > tile.h)
				{
					compute_sw_then_sh();
					if (sh > image.height)
						compute_sh_then_sw();
				}
				else
				{
					compute_sh_then_sw();
					if (sw > image.width)
						compute_sw_then_sh();
				}
				
				sx = Math.floor((image.width-sw)/2);
				sy = Math.floor((image.height-sh)/2);
				
				// save coords for scrolling
				image.slice = {
					x : sx,
					y : sy,
					w : sw,
					h : sh,
					dx : tile.x,
					dy : tile.y,
					dw : tile.w,
					dh : tile.h
				};
			}

			//console.log(sx + ' ' + sy + ' ' + sw + ' ' + sh + ' ' + tile.x + ' ' + tile.y + ' ' + tile.w + ' ' + tile.h);
			ctx.drawImage(image,sx,sy,sw,sh,tile.x,tile.y,tile.w,tile.h);
			
			return true;
		};

		this.addAndDrawImage = function(image) {
			if (validateTile(_highlightedTile))
			{
				_images[_highlightedTile] = image;
				this.drawImage(_highlightedTile);
				_highlightedTile = -1;
			}
			else
			{
				for (var i = 0; i < _board.tiles.length; i++)
				{
					if (!_images[i])
					{
						_images[i] = image;
						this.drawImage(i);
						break;
					}
				}
			}
		};

		this.drawImages = function() {
			for (var i = 0; i < _board.tiles.length && this.drawImage(i); i++);
		};
	};

	function readFiles(files) {
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

	function getMousePos(evt) {
		var mousePos = {
			x : evt.clientX - cnv.offsetLeft,
			y : evt.clientY - cnv.offsetTop
		};
		return mousePos;
	}

	function handleDragOver(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		cnv.className = "outset-shadow";

		_boardDrawer.highlightTile(getMousePos(evt));
	}

	function handleDragLeave(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		cnv.className = "inset-shadow";

		_boardDrawer.removeHighlight();
	}

	function handleDrop(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		cnv.className = "inset-shadow";

		readFiles(evt.dataTransfer.files);
	}

	function handleMouseDown(evt) {
		evt.preventDefault();
		var mousePos = getMousePos(evt);
		var image = _boardDrawer.getImageAt(mousePos);
		if (image !== null)
		{
			isMouseDown = true;
			selectedImage = image;
			selectedTile = _boardDrawer.getTileAt(mousePos);
			currectTile = selectedTile;
			_boardDrawer.removeImageAt(selectedTile);

			// change cursor
			cnv.className = "outset-shadow move-cursor";
			
			// save mousePos as anchor point
			_boardDrawer.saveAsAnchorPoint(image,mousePos);
		}
	}

	function handleMouseMove(evt) {
		evt.preventDefault();
		if (isMouseDown)
		{
			var mousePos = getMousePos(evt);
			var newTile = _boardDrawer.getTileAt(mousePos);
			if (currectTile !== newTile)
			{
				currectTile = newTile;

				_boardDrawer.removeSlice(selectedImage);
				_boardDrawer.clearBoard();
				_boardDrawer.drawTiles();
				_boardDrawer.drawImages();
				_boardDrawer.drawImage(currectTile,selectedImage);
			}
			else
			{
				// scroll current image
				_boardDrawer.scrollImage(selectedImage,mousePos);
			}
		}
	}

	function handleMouseOut(evt) {
		if (isMouseDown)
		{
			_boardDrawer.removeSlice(selectedImage);
			_boardDrawer.addImageAt(selectedTile,selectedImage);
			_boardDrawer.clearBoard();
			_boardDrawer.drawTiles();
			_boardDrawer.drawImages();

			selectedImage = null;
			selectedTile = -1;
			currectTile = -1;
			isMouseDown = false;

			cnv.className = "inset-shadow";
		}
	}

	function handleMouseUp(evt) {
		if (isMouseDown)
		{
			var newTile = _boardDrawer.getTileAt(getMousePos(evt));
			_boardDrawer.addImageAt(newTile,selectedImage);
			//_boardDrawer.drawImage(newTile);

			selectedImage = null;
			selectedTile = -1;
			currectTile = -1;
			isMouseDown = false;

			cnv.className = "inset-shadow";
		}
	}
	
	function handleMouseWheel(evt) {
		evt.preventDefault();
		
		var isScaleUp;
		
		if (evt.wheelDelta)
			isScaleUp = evt.wheelDelta < 0;
		else if (evt.detail)
			isScaleUp = evt.detail > 0;
		
		_boardDrawer.scaleImageAt(getMousePos(evt),isScaleUp);
	}

	function csize_changed(evt) {
		switch (evt.target.value)
		{
			case "small": 
				baseTileSize = 100;
				cnv.width = baseTileSize * 6;
				cnv.height = baseTileSize * 6;
				break;
			case "large":
				baseTileSize = 128;
				cnv.width = baseTileSize * 6;
				cnv.height = baseTileSize * 6;
				break;
			case "wide":
				baseTileSize = 128;
				cnv.width = baseTileSize * 12;
				cnv.height = baseTileSize * 6;
				break;
			default:
				baseTileSize = 128;
				cnv.width = baseTileSize * 6;
				cnv.height = baseTileSize * 6;
				break;
		}

		cnv.style.width = cnv.width + "px";
		cnv.style.height = cnv.height + "px";

		tsize_changed();
	}

	function tsize_changed(evt) {
		var mult = evt ? parseInt(evt.target.value,10) : parseInt(document.getElementById("tsize").value,10);
		if (!mult || mult === 0)
			mult = 1;
		var tileSize = baseTileSize * mult;
		var width = Math.floor(cnv.width/tileSize);
		var height = Math.floor(cnv.height/tileSize);

		_board.setSize(width,height,tileSize);
		_board.formTiles();
		
		_boardDrawer.clearBoard();
		_boardDrawer.drawTiles();
		_boardDrawer.removeAllSlices();
		_boardDrawer.drawImages();
	}

	var baseTileSize = 128;
	var isMouseDown = false;
	var selectedImage = null;
	var selectedTile = -1;
	var currectTile = -1;

	// setup canvas
	var cnv = document.getElementById("c");
	var ctx = cnv.getContext("2d");

	// setup board
	var _board = new Board();
	_board.formTiles();

	// setup board drawer
	var _boardDrawer = new BoardDrawer();

	// add drag and drop to canvas
	cnv.addEventListener('dragover',handleDragOver,false);
	cnv.addEventListener('dragleave',handleDragLeave,false);
	cnv.addEventListener('drop',handleDrop,false);

	cnv.addEventListener('mousedown',handleMouseDown,false);
	cnv.addEventListener('mousemove',handleMouseMove,false);
	cnv.addEventListener('mouseout',handleMouseOut,false);
	cnv.addEventListener('mouseup',handleMouseUp,false);
	cnv.addEventListener('mousewheel',handleMouseWheel,false);
	// for firefox
	cnv.addEventListener('DOMMouseScroll',handleMouseWheel,false);

	var evt = { target : { value : 0 } };
	if (window.innerWidth < 1024 || window.innerHeight < 768)
		evt.target.value = "small";
	else if (window.innerWidth > 1720)
		evt.target.value = "wide";
	else
		evt.target.value = "large";

	var csize = document.getElementById("csize");
	csize.value = evt.target.value; // set default value
	csize.addEventListener('change',csize_changed,false);
	// change default canvas size according to screen size
	csize_changed(evt);

	var tsize = document.getElementById("tsize");
	tsize.value = "1"; // set default value
	tsize.addEventListener('change',tsize_changed,false);

	var browse = document.getElementById("browse");
	browse.addEventListener('click',function(evt){
		evt.preventDefault();

		var file = document.getElementById("file");
		file.click();
	},false);

	var file = document.getElementById("file");
	file.addEventListener('change',function(evt){
		readFiles(evt.target.files);
	},false);

	var randomize = document.getElementById("randomize");
	randomize.addEventListener('click',function(evt){
		evt.preventDefault();

		_board.formTiles();
		_boardDrawer.clearBoard();
		_boardDrawer.drawTiles();
		_boardDrawer.removeAllSlices();
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