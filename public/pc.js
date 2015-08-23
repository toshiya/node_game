window.onload = function() {
    document.getElementById('start_button').addEventListener('click', function () {
        var g = new CircleFall();
        g.init();
        g.reset(); 
        g.loop(); 
        g.generate_circle(); 
    });
}

function DisplayObject () {
};
DisplayObject.prototype = {
    move : function (width, height) {
        var nextX = this.x + this.diffX;
        var nextY = this.y + this.diffY;
        var success = 1;  
        if ( 0 > nextX || nextX > width)  success = -1;
        if ( 0 > nextY || nextY > height) success = -1;
        this.x = Math.min(Math.max(0, nextX), width);
        this.y = Math.min(Math.max(0, nextY), height);
        return success;
    },
    draw : function (ctx) {
        this.drawImpl(ctx);
    }
};

function AirPlane (canvas) {
    this.x      = 250;
    this.y      = 400 ;
    this.accelX = 0;
    this.accelY = 0 ;
    this.diffX  = 0;
    this.diffY  = 0 ;
    this.height    = 30;
    this.width     = 30;
    
    this.alphaX    = 20.0;
    this.alphaY    = 20.0;
    this.viscosity = 1.0;
    this.canvas    = canvas;

    this.simulateViscosity = function () {
        this.accelX *= this.viscosity;
        this.accelY *= this.viscosity;
    };

    this.setAccele = function(ax, ay, az) {
        this.accelX = (ax/90.0);
        this.accelY = -(ay/90.0);
        this.diffX  = this.accelX * this.alphaX; 
        this.diffY  = this.accelY * this.alphaY; 
    };

    this.setAcceleByMouse = function(x, y) {
        this.diffX = (x - this.x) 
        this.diffY = (y - this.y) 
    };

    this.drawImpl = function (ctx) {
        ctx.drawImage(
            this.image, 
            0, 0, this.image.width, this.image.height,
            this.x - (this.width/2), this.y - (this.height/2), this.width, this.height
        );
    };

    this.destruct = function () {
        this.bombSound.currentTime = 0;
        this.bombSound.play();
    };
}
AirPlane.prototype             = new DisplayObject;
AirPlane.prototype.constructor = AirPlane;
AirPlane.prototype.image       = new Image();
AirPlane.prototype.image.src   = "./icon/airplane.png";
AirPlane.prototype.bombSound   = document.getElementById('bomb_sound');

function Bullet () {
    this.x      = 0;
    this.y      = 0;
    this.diffX  = 0;
    this.diffY  = -5;
    this.r      = 5;

    this.fire = function (x, y, w, h) {
        if ( 0 <= x && x <= w && 0 <= y && y <= h) { 
            this.x     = x;
            this.y     = y;
            this.fireSound.currentTime = 0;
            this.fireSound.play();
            return 1;
        } else {
            return 0;
        }
    };
    
    this.drawImpl = function(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
        ctx.stroke();
    };

}
Bullet.prototype             = new DisplayObject;
Bullet.prototype.constructor = Bullet;
Bullet.prototype.fireSound   = document.getElementById('bullet_sound');

function Circle () {
    this.x            = 0;
    this.y            = 0;
    this.diffX       = 0;
    this.diffY       = 5;
    this.r            = 20;
    this.score        = 1;

    this.setXRandomly = function (w) {
        this.x = 20 + Math.round( (w-40) * Math.random());
    };
    
    this.drawImpl = function(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
        ctx.stroke();
    };

    this.detect_collisoin = function (x, y, cb) {
        var distance2 = Math.pow((x - this.x), 2) + Math.pow((y - this.y), 2);
        if ( distance2 < Math.pow(this.r, 2) ) {
            return cb(this);
        }
        return 0;
    };

    this.destruct = function () {
        this.destructionSound.currentTime = 0;
        this.destructionSound.play();
        return this.score;
    };
};
Circle.prototype                  = new DisplayObject;
Circle.prototype.constructor      = Circle;
Circle.prototype.destructionSound = document.getElementById('destruction_sound');

function CircleFall () {
    // Canvas Info
    var _this = this;
    this.canvas        = document.getElementById('cvs');
    this.ctx           = this.canvas.getContext('2d');
    this.score_div     = document.getElementById('score');
    this.canvas.height = 500;
    this.canvas.width  = 500;

    // Objects
    this.airplane = new AirPlane(_this.canvas);
    this.bullets  = new Array();
    this.circles  = new Array();

    // Control
    this.total_score     = 0;
    this.total_circle_num = 0;
    this.max_circle_num   = 100;
    this.main_interval    = 16;
    this.circle_interval  = 1000;
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

        document.addEventListener('mousemove', function (e) {
            _this.airplane.setAcceleByMouse(e.clientX, e.clientY); 
        });

        document.addEventListener('click', function (e) {
            _this.fire_bullet(); 
        });
    };

    this.loop = function () {
        var score = 0;
        var r, k, c;

        _this.ctx.clearRect(0, 0 , _this.canvas.width, _this.canvas.height);

        _this.moveBullets();
        _this.moveCircles();
        _this.airplane.move(_this.canvas.width, _this.canvas.height);
        _this.airplane.simulateViscosity();

        if ( (score = _this.detectBulletCollision()) > 0) {
            _this.total_score += score;
            _this.total_circle_num += 1;
        }

        if (_this.detectAirplaneCollision()) {
            _this.ctx.clearRect(0, 0, _this.canvas.width, _this.canvas.height);
            _this.display_final_score();
            return;
        }
        _this.drawAll();

        _this.display_score();
        if (_this.total_circle_num <= _this.max_circle_num) {
            _this.setNextLoop();
            return;
        } 
        _this.ctx.clearRect(0, 0, _this.canvas.width, _this.canvas.height);
        _this.display_final_score();

        return;
    };

    this.moveBullets = function () {
        for (k in _this.bullets) {  
            r = _this.bullets[k].move(_this.canvas.width, _this.canvas.height);
            if (r === -1) {
                _this.bullets.splice(k, 1); 
            }
        }
    };
    
    this.moveCircles = function () {
        for (c in _this.circles) {
            r = _this.circles[c].move(_this.canvas.width, _this.canvas.height);
            if (r === -1) {
                _this.circles.splice(c, 1); 
                _this.total_circle_num += 1;
            }
        }
    };

    this.detectBulletCollision = function () {
        var r;
        var flag = 0;
        var score = 0;
        for (k in _this.bullets) {
            for (c in _this.circles) {
                r = _this.circles[c].detect_collisoin(_this.bullets[k].x, _this.bullets[k].y, function (circle) { 
                    return circle.destruct(); 
                });
                if (r > 0) {
                    score += r;
                    _this.circles.splice(c, 1); 
                    flag = 1;
                }
            }
            if (flag === 1) {
                _this.bullets.splice(k, 1);
                flag = 0;
            }
        };
        return score;
    };

    this.detectAirplaneCollision = function () {
        var r;
        for (c in _this.circles) {
            r = _this.circles[c].detect_collisoin(_this.airplane.x, _this.airplane.y, function (circle) {
                _this.airplane.destruct();
                return true;
            }); 
            if (r) {
                return true;
            }
        }
        return false;
    };

    this.drawAll = function () {
        for (k in _this.bullets) {  
            _this.bullets[k].draw(_this.ctx);
        }
        for (c in _this.circles) {  
            _this.circles[c].draw(_this.ctx);
        }
        _this.airplane.draw(_this.ctx);
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
        setTimeout(function () { _this.loop(); }, _this.main_interval);
    };

    this.generate_circle = function () {
        var c =  new Circle();
        c.setXRandomly(_this.canvas.width);
        _this.circles.push(c);

        clearTimeout();
        setTimeout(function () { _this.generate_circle(); }, _this.circle_interval);
    };

    this.reset = function () {
        _this.bullets = new Array();
        _this.circles = new Array();
        _this.total_circle_num = 0;
        _this.total_score      = 0;
    };

    this.display_score = function () {
        _this.score_div.innerHTML = 
            "<h3>撃墜数:" + _this.total_score
        + "/"  + (_this.total_circle_num) + "</h3>";
    };

    this.display_final_score = function () {
        _this.score_div.innerHTML = 
            "<h3>ゲーム終了! 撃墜数:" + _this.total_score
        + "/"  + (_this.total_circle_num) + "</h3>";
    };

}
