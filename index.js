window.onload = function() {
  document.getElementById('start_button').addEventListener('click', function () {
    var g = new CircleFall();
    g.init();
    g.reset(); 
    g.loop(); 
  });
}

function AirPlane () {
    var _this = this;
    this.x = 150;
    this.y = 400 ;
    this.height = 30;
    this.width  = 30;
    this.image  = new Image();
    this.image.src = "./assets/icon/airplane.png";

    this.move = function(e) {
        _this.x = e.clientX;
        _this.y = e.clientY;
    };
  
    this.draw = function (ctx) {
        ctx.drawImage(
            _this.image, 
            0, 0, _this.image.width, _this.image.height,
            _this.x - (_this.width/2), _this.y - (_this.height/2), _this.width, _this.height
        );
    };
  
}

function Bullet () {
    var _this = this;
    this.x     = 0;
    this.y     = 0;
    this.r     = 5;
    this.exist = 0;
    this.step  = 5;
    this.fire_sound = document.getElementById('bullet_sound');
  
    this.move = function () {
        if (_this.exist === 1 && _this.y > 0) {
            _this.y -= _this.step;
        } else {
            _this.exist = 0;
        }
    };
    
    this.draw = function (ctx) {
        if (_this.exist === 1) {
            ctx.beginPath();
            ctx.arc(_this.x, _this.y, _this.r, 0, Math.PI * 2, false);
            ctx.stroke();
        }
    };
  
    this.fire = function (x, y, w, h) {
        if ( 0 < x && x < w && 0 < y && y < h) { 
            _this.x     = x;
            _this.y     = y;
            _this.exist = 1;
            _this.fire_sound.currentTime = 0;
            _this.fire_sound.play();
        }
    }
}

function CircleFall () {
  // Canvas Info
  var _this = this;
  this.canvas        = document.getElementById('cvs');
  this.ctx           = this.canvas.getContext('2d');
  this.score_div     = document.getElementById('score');
  this.canvas_height = 400;
  this.canvas_width  = 300;
  
  // Sound
  this.destruction_sound = document.getElementById('destruction_sound');
  this.bomb_sound = document.getElementById('bomb_sound');

  // AirPlane
  this.airplane = new AirPlane();
  this.bullet   = new Bullet();

  // Circle Info
  this.cx            = 100;
  this.cy            = 0;
  this.cr            = 20;
  this.fall_step     = 2;
  this.fall_interval = 10;

  // Score Info
  this.total_score     = 0;
  this.score_per_break = 1;

  // Game Info
  this.total_circle_num = 0;
  this.max_circle_num   = 100;

  this.init = function () {
    document.addEventListener('mousemove', _this.airplane.move);
    document.addEventListener('click', _this.fire_bullet);
  };


  this.loop = function () {
    _this.ctx.clearRect(0, 0 , _this.canvas_width, _this.canvas_height);

    _this.bullet.move();
    _this.bullet.draw(_this.ctx);
    _this.airplane.draw(_this.ctx);
    
    _this.draw_circle();
    _this.update_score();

    if (_this.is_chara_in_circle()) {
      _this.ctx.clearRect(0, 0, _this.canvas_width, _this.canvas_height);
      _this.end_score();
      return;
    }

    _this.cy += _this.fall_step;
    if (_this.cy < _this.canvas_height) {
      var score = _this.is_bullet_in_circle();
      if (score > 0) {
        _this.total_score += score;
        _this.reset_circle();
        _this.total_circle_num += 1;
      }
    } 
    else {
      _this.reset_circle();
      _this.total_circle_num += 1;
    }

    if (_this.total_circle_num <= _this.max_circle_num) {
      _this.setNextLoop();
    } else {
      _this.ctx.clearRect(0, 0, _this.canvas_width, _this.canvas_height);
      _this.end_score();
    }
  };

  this.is_bullet_in_circle = function () {
    var distance2 = Math.pow((_this.bullet.x - _this.cx), 2) + Math.pow((_this.bullet.y - _this.cy), 2);
    if ( distance2 < Math.pow(_this.cr, 2) ) {
      _this.bullet.exist = 0;
      _this.destruction_sound.currentTime = 0;
      _this.destruction_sound.play();
      return _this.score_per_break;
    }
    return 0;
  }

  this.is_chara_in_circle = function () {
    var distance2 = Math.pow((_this.airplane.x - _this.cx), 2) + Math.pow((_this.airplane.y - _this.cy), 2);
    if ( distance2 < Math.pow(_this.cr, 2) ) {
      _this.bomb_sound.currentTime = 0;
      _this.bomb_sound.play();
      return 1;
    }
    return 0;
  }

  this.draw_circle = function () {
    _this.ctx.beginPath();
    _this.ctx.arc(_this.cx, _this.cy, _this.cr, 0, Math.PI * 2, false);
    _this.ctx.stroke();
  };

  this.fire_bullet = function () {
      _this.bullet.fire(_this.airplane.x, _this.airplane.y, _this.canvas_width, _this.canvas_height);
  };


  this.update_score = function () {
    _this.score_div.innerHTML = 
      "<h3>撃墜数:" + _this.total_score
      + "/"  + (_this.total_circle_num) + "</h3>";
  };

  this.end_score = function () {
    _this.score_div.innerHTML = 
      "<h3>ゲーム終了! 撃墜数:" + _this.total_score
      + "/"  + (_this.total_circle_num) + "</h3>";
  };

  this.reset_circle = function () {
    _this.cx = Math.round(_this.canvas_width * Math.random());
    _this.cy = 0;
  };

  this.setNextLoop = function () {
    clearTimeout();
    setTimeout(function () { _this.loop(); }, _this.fall_interval);
  }

  this.reset = function () {
    this.reset_circle();
    this.total_circle_num = 0;
    this.total_score      = 0;
  };
}
