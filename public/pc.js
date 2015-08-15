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
    this.x = 500;
    this.y = 400 ;
    this.a_x = 0;
    this.a_y = 0 ;
    this.alpha_x = 10.0;
    this.alpha_y = 10.0;
    
    this.height = 30;
    this.width  = 30;
    this.image  = new Image();
    this.image.src = "./icon/airplane.png";

    this.move = function(x, y) {
        _this.x += _this.a_x * _this.alpha_x;
        _this.y += _this.a_y * _this.alpha_y;
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
  this.canvas_height = 600;
  this.canvas_width  = 1000;

  // Sound
  this.destruction_sound = document.getElementById('destruction_sound');
  this.bomb_sound = document.getElementById('bomb_sound');

  // Objects
  this.airplane = new AirPlane();
  this.bullet   = new Bullet();
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
    //document.addEventListener('mousemove', _this.airplane.moveTo);
    document.addEventListener('click', _this.fire_bullet);
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
    _this.ctx.clearRect(0, 0 , _this.canvas_width, _this.canvas_height);

    _this.airplane.move();
    _this.bullet.move();
    _this.circle.move();
    
    _this.bullet.draw(_this.ctx);
    _this.airplane.draw(_this.ctx);
    _this.circle.draw(_this.ctx);

    _this.update_score();
    
    if (_this.circle.y > _this.canvas_height) {
        _this.circle.reset(_this.canvas_width);
        _this.total_circle_num += 1;
    }

    var r = _this.circle.detect_collisoin(_this.airplane.x, _this.airplane.y, function (circle) {
        _this.bomb_sound.currentTime = 0;
        _this.bomb_sound.play();
        return 1;
    }); 
    if (r) {
        _this.ctx.clearRect(0, 0, _this.canvas_width, _this.canvas_height);
        _this.end_score();
        return;
    }

    var score = _this.circle.detect_collisoin(_this.bullet.x, _this.bullet.y, function (circle) {
        _this.bullet.exist = 0;
        _this.destruction_sound.currentTime = 0;
        _this.destruction_sound.play();
        return _this.score_per_break;
    });
    if (score > 0) {
        _this.total_score += score;
        _this.circle.reset(_this.canvas_width);
        _this.total_circle_num += 1;
    }

    if (_this.total_circle_num <= _this.max_circle_num) {
        _this.setNextLoop();
        return;
    } 
      
    _this.ctx.clearRect(0, 0, _this.canvas_width, _this.canvas_height);
    _this.end_score();
    return;
  };

  this.fire_bullet = function () {
      _this.bullet.fire(_this.airplane.x, _this.airplane.y, _this.canvas_width, _this.canvas_height);
  };
  
  this.setNextLoop = function () {
    clearTimeout();
    setTimeout(function () { _this.loop(); }, _this.interval);
  };
  
  this.reset = function () {
    _this.circle.reset(_this.canvas_width);
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
