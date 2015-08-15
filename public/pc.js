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
    this.x = 250;
    this.y = 400 ;
    this.a_x = 0;
    this.a_y = 0 ;
    this.alpha_x   = 15.0;
    this.alpha_y   = 15.0;
    this.viscosity = 0.9;
    
    this.height = 30;
    this.width  = 30;
    this.image  = new Image();
    this.image.src = "./icon/airplane.png";

    this.move = function(x, y) {
        _this.x += _this.a_x * _this.alpha_x;
        _this.y += _this.a_y * _this.alpha_y;

        _this.a_x *= _this.viscosity;
        _this.a_y *= _this.viscosity;
    };
    
    this.setAccele = function(ax, ay, az) {
        _this.a_x = (ay/90.0);
        _this.a_y = (ax/90.0);
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
    this.step  = 5;
    this.fire_sound = document.getElementById('bullet_sound');
  
    this.move = function () {
        if (_this.y > 0) {
            _this.y -= _this.step;
            return 1;
        } else {
            return -1;
        }
    };
    
    this.draw = function (ctx) {
        ctx.beginPath();
        ctx.arc(_this.x, _this.y, _this.r, 0, Math.PI * 2, false);
        ctx.stroke();
    };
  
    this.fire = function (x, y, w, h) {
        if ( 0 < x && x < w && 0 < y && y < h) { 
            _this.x     = x;
            _this.y     = y;
            _this.fire_sound.currentTime = 0;
            _this.fire_sound.play();
            return 1;
        } else {
            return 0;
        }
    }
}

function Circle () {
    var _this = this;
    this.x            = 100;
    this.y            = 0;
    this.r            = 20;
    this.fall_step    = 2;

    this.move = function move () {
        _this.y += _this.fall_step;
    };
    
    this.draw = function draw (ctx) {
        ctx.beginPath();
        ctx.arc(_this.x, _this.y, _this.r, 0, Math.PI * 2, false);
        ctx.stroke();
    };
  
    this.reset = function (w) {
        _this.x = Math.round(w * Math.random());
        _this.y = 0;
    };

    this.detect_collisoin = function (x, y, cb) {
        var distance2 = Math.pow((x - _this.x), 2) + Math.pow((y - _this.y), 2);
        if ( distance2 < Math.pow(_this.r, 2) ) {
            return cb(_this);
        }
        return 0;
    };
}

function CircleFall () {
  // Canvas Info
  var _this = this;
  this.canvas        = document.getElementById('cvs');
  this.ctx           = this.canvas.getContext('2d');
  this.score_div     = document.getElementById('score');
  this.canvas.height = 600;
  this.canvas.width  = 500;

  // Sound
  this.destruction_sound = document.getElementById('destruction_sound');
  this.bomb_sound = document.getElementById('bomb_sound');

  // Objects
  this.airplane = new AirPlane();
  this.bullets  = new Array();
  this.circle   = new Circle();

  // Score
  this.total_score     = 0;
  this.score_per_break = 1;

  // Control
  this.total_circle_num = 0;
  this.max_circle_num   = 100;
  this.interval = 10;

  // Socket
  this.socket;

  this.init = function () {
    _this.socket = io.connect("http://node.comonsense.net");
    
    _this.socket.on("sendMessageToClient", function (data) {
        if(data.X) {
          _this.airplane.setAccele(data.X, data.Y); 
        }
        
        if(data.touch) {
          _this.fire_bullet(); 
        }
    });
  };

  this.loop = function () {
    var score = 0;
    var r, k;
    
    _this.ctx.clearRect(0, 0 , _this.canvas.width, _this.canvas.height);
    
    // Bullets Control
    for (k in _this.bullets) {  
        r = _this.bullets[k].move();
        if (r === 1) {
            _this.bullets[k].draw(_this.ctx);
        } else {
            _this.bullets.splice(k, 1); 
        }
    }
    
    for (k in _this.bullets) {  
        r = _this.circle.detect_collisoin(_this.bullets[k].x, _this.bullets[k].y, function (circle) {
            _this.destruction_sound.currentTime = 0;
            _this.destruction_sound.play();
            return _this.score_per_break;
        });

        if (r > 0) {
            score += r;
            _this.bullets.splice(k, 1); 
        }
    };
    if (score > 0) {
        _this.total_score += score;
        _this.circle.reset(_this.canvas.width);
        _this.total_circle_num += 1;
    }


    // Airplane Control
    _this.airplane.move();
    _this.airplane.draw(_this.ctx);
    
    // Circle Control
    _this.circle.move();
    _this.circle.draw(_this.ctx);
    
    r = _this.circle.detect_collisoin(_this.airplane.x, _this.airplane.y, function (circle) {
        _this.bomb_sound.currentTime = 0;
        _this.bomb_sound.play();
        return 1;
    }); 
    if (r) {
        _this.ctx.clearRect(0, 0, _this.canvas.width, _this.canvas.height);
        _this.end_score();
        return;
    }
    
    if (_this.circle.y > _this.canvas.height) {
        _this.circle.reset(_this.canvas.width);
        _this.total_circle_num += 1;
    }
   

    // Main Control
    _this.update_score();
    if (_this.total_circle_num <= _this.max_circle_num) {
        _this.setNextLoop();
        return;
    } 
    _this.ctx.clearRect(0, 0, _this.canvas.width, _this.canvas.height);
    _this.end_score();
    
    return;
  };

  this.fire_bullet = function () {
      var b = new Bullet();
      var r = b.fire(_this.airplane.x, _this.airplane.y, _this.canvas.width, _this.canvas.height);
      if (r === 1) {
          _this.bullets.push(b);
      }
  };
  
  this.setNextLoop = function () {
    clearTimeout();
    setTimeout(function () { _this.loop(); }, _this.interval);
  };
  
  this.reset = function () {
    _this.circle.reset(_this.canvas.width);
    _this.total_circle_num = 0;
    _this.total_score      = 0;
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

}
