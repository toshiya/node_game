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
  this.x = 0;
  this.y = 0;
  this.height = 30;
  this.width  = 30;
  this.img;

  this.move = function () {

  };

}

function CircleFall () {
  // Canvas Info
  var _this = this;
  this.canvas        = document.getElementById('cvs');
  this.ctx           = this.canvas.getContext('2d');
  this.score_div     = document.getElementById('score');
  this.canvas_height = 400;
  this.canvas_width  = 300;
  this.bullet_sound = document.getElementById('bullet_sound');
  this.destruction_sound = document.getElementById('destruction_sound');
  this.bomb_sound = document.getElementById('bomb_sound');

  // Circle Info
  this.cx            = 100;
  this.cy            = 0;
  this.cr            = 20;
  this.fall_step     = 2;
  this.fall_interval = 10;

  // Chara Info
  this.chx = 0;
  this.chy = 0;
  this.chheight = 30;
  this.chwidth  = 30;
  this.chimg;

  // bullet info
  this.bullet_x     = 0;
  this.bullet_y     = 0;
  this.bullet_r     = 5;
  this.bullet_exist = 0;
  this.bullet_step  = 5;

  // Score Info
  this.total_score     = 0;
  this.score_per_break = 1;

  // Game Info
  this.total_circle_num = 0;
  this.max_circle_num   = 100;

  this.init = function () {
    document.addEventListener('mousemove', _this.chara_move);
    document.addEventListener('click', _this.fire_bullet);
    _this.chimg = new Image();
    _this.chimg.src = "./assets/icon/airplane.png";
  };

  this.chara_move = function(e) {
      _this.chx = e.clientX;
      _this.chy = e.clientY;
  };

  this.loop = function () {
    _this.ctx.clearRect(0, 0 , _this.canvas_width, _this.canvas_height);

    _this.move_bullet();
    _this.draw_circle();
    _this.draw_chara();
    _this.draw_bullet();
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
    var distance2 = Math.pow((_this.bullet_x - _this.cx), 2) + Math.pow((_this.bullet_y - _this.cy), 2);
    if ( distance2 < Math.pow(_this.cr, 2) ) {
      _this.bullet_exist = 0;
      _this.destruction_sound.currentTime = 0;
      _this.destruction_sound.play();
      return _this.score_per_break;
    }
    return 0;
  }

  this.is_chara_in_circle = function () {
    var distance2 = Math.pow((_this.chx - _this.cx), 2) + Math.pow((_this.chy - _this.cy), 2);
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

  this.draw_chara = function () {
    _this.ctx.drawImage(_this.chimg, 
        0, 0, _this.chimg.width, _this.chimg.height,
        _this.chx - (_this.chwidth/2), _this.chy - (_this.chheight/2), _this.chwidth, _this.chheight
        );
  };

  this.fire_bullet = function () {
    if ( 
           0 < _this.chx 
        && _this.chx < _this.canvas_width
        && 0 < _this.chy 
        && _this.chy < _this.canvas_height 
        && _this.bullet_exist === 0
       ) { 
      _this.bullet_x     = _this.chx;
      _this.bullet_y     = _this.chy;
      _this.bullet_exist = 1;
      _this.bullet_sound.currentTime = 0;
      _this.bullet_sound.play();
    }
  };

  this.move_bullet = function () {
    if (_this.bullet_exist == 1 && _this.bullet_y > 0) {
      _this.bullet_y -= _this.bullet_step;
    } else {
      _this.bullet_exist = 0;
    }
  };

  this.draw_bullet = function () {
    if (_this.bullet_exist == 1) {
      _this.ctx.beginPath();
      _this.ctx.arc(_this.bullet_x, _this.bullet_y, _this.bullet_r, 0, Math.PI * 2, false);
      _this.ctx.stroke();
    }
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
