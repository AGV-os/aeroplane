const cnv = document.createElement("canvas");
const ctx = cnv.getContext("2d");

cnv.style.zIndex = 0

let birds = [];
let bullets = [];
let clouds = [];


let progBar = document.getElementById("prog")
let prog = -10

let birdSpeed = 3

let createMode = false

let isPause = false

cnv.width = innerWidth;
cnv.height = innerHeight;

const st = cnv.style;
st.position = "fixed";
st.width = "100%";
st.background = "#0099ff";

document.body.appendChild(cnv);

// =======================
// NODE
// =======================

class Entity {
    
    isRemoved = false;
    
    constructor(x, y) {
        
        this.position = {
            x,
            y
        };
        
        this.w = 0;
        this.h = 0;
        
    }
    
    update() {}
    
    remove() {
        this.isRemoved = true;
    }
    
    intersects(other) {
        
        return (
            
            this.position.x < other.position.x + other.w &&
            this.position.x + this.w > other.position.x &&
            
            this.position.y < other.position.y + other.h &&
            this.position.y + this.h > other.position.y
            
        );
        
    }
    
}

function isCollision(a, b) {
    return (
        a.position.x < b.position.x + b.w &&
        a.position.x + a.w > b.position.x &&
        a.position.y < b.position.y + b.h &&
        a.position.y + a.h > b.position.y
    );
}



class Scene {
    entities = [];
    
    add(entity) {
        this.entities.push(entity);
    }
    
    update() {
        
        for (let i = this.entities.length - 1; i >= 0; i--) {
            
            if (this.entities[i].isRemoved) {
                
                this.entities.splice(i, 1);
                continue;
                
            }
            
            this.entities[i].update();
            
        }
        
    }
}

// =======================
// SPRITE
// =======================

class Sprite extends Entity {
    constructor(x, y, src, w, h) {
        super(x, y);
        
        this.w = w;
        this.h = h;
        
        this.img = new Image();
        this.loaded = false;
        
        this.img.onload = () => {
            this.loaded = true;
        };
        
        this.img.src = src;
    }
    
    update() {
        if (!this.loaded || this.isRemoved) return;
        
        ctx.drawImage(
            this.img,
            this.position.x,
            this.position.y,
            this.w,
            this.h
        );
    }
}

// =======================
// ANIMATED SPRITE
// =======================

class AnimatedSprite extends Entity {
    constructor(x, y, w, h) {
        super(x, y);
        
        this.w = w;
        this.h = h;
        
        this.frames = [];
        this.frame = 0;
        
        this.animTimer = 0;
        this.animSpeed = 100;
    }
    
    addFrame(src) {
        const img = new Image();
        img.src = src;
        
        this.frames.push(img);
    }
    
    updateAnimation(deltaTime) {
        this.animTimer += deltaTime;
        
        if (this.animTimer >= this.animSpeed) {
            this.frame++;
            
            if (this.frame >= this.frames.length) {
                this.frame = 0;
            }
            
            this.animTimer = 0;
        }
    }
    
    update() {
        if (this.isRemoved) return;
        
        if (this.frames.length === 0) return;
        
        this.updateAnimation(deltaTime);
        
        ctx.drawImage(
            this.frames[this.frame],
            this.position.x,
            this.position.y,
            this.w,
            this.h
        );
    }
}

// =======================
// RECT
// =======================

class Rect extends Entity {
    constructor(
        x,
        y,
        w,
        h,
        bgc,
        borderWidth = 0,
        borderColor = "lime"
    ) {
        super(x, y);
        
        this.w = w;
        this.h = h;
        
        this.bgc = bgc;
        this.borderWidth = borderWidth;
        this.borderColor = borderColor;
    }
    
    update() {
        ctx.fillStyle = this.bgc;
        
        ctx.fillRect(
            this.position.x,
            this.position.y,
            this.w,
            this.h
        );
        
        if (this.borderWidth > 0) {
            ctx.lineWidth = this.borderWidth;
            ctx.strokeStyle = this.borderColor;
            
            ctx.strokeRect(
                this.position.x,
                this.position.y,
                this.w,
                this.h
            );
        }
    }
}

// =======================
// ОБЛАКА
// =======================

setInterval(() => {
    const cloud = new Sprite(
        -100,
        Math.random() * innerHeight * 0.5,
        "/sprites/oblako.png",
        Math.random() * 300 + 200,
        Math.random() * 300 + 200
    );
    game.add(cloud)
    clouds.push(cloud);
}, 4000);

// =======================
// ПТИЦЫ
// =======================

function addBirdsWave() {
    if(prog >= 100) return;
    prog += 10
    progBar.value = prog 
    if(prog >= 100){
        pause()
        document.getElementById("pauseBtn").remove()
        document.getElementById("winlbl").style.opacity = 1
        document.getElementById("winlbl2").style.opacity = 1
        document.getElementById("reloadBtn").style.opacity = 1
        document.getElementById("reloadBtn").style.pointerEvents = 'auto'
    }
    if(createMode){
        wave = 5
        birdSpeed = 3 
        return
    }
    wave++
    birdSpeed += 2
    document.getElementById("wave").innerText = "волна: "+wave
    setInterval(() => {
        const bird = new AnimatedSprite(
            -100,
            Math.floor(Math.random() * innerHeight-200)+100,
            100,
            100
        );
        
        for (let i = 0; i < 5; i++) {
            bird.addFrame(
                `/sprites/bird/frame${i + 1}.png`
            );
        }
        game.add(bird)
        birds.push(bird);
    }, 1000);
}
const maxWaves = 10
let wave = 0
addBirdsWave()
setInterval(()=>{
    if(wave > maxWaves) return;
    addBirdsWave()
}, 10000)

// =======================
// DELTA TIME
// =======================

let lastTime = performance.now();
let deltaTime = 0;

// =======================
// GAME LOOP
// =======================

const game = new Scene()


class Bullet extends Entity {
    origin = {
        x: 0,
        y: 0
    }
    constructor(x, y, angle) {
        super(x, y)
        this.w = 20
        this.h = this.w
        this.angle = angle
        this.origin.x = this.position.x + this.w / 2
        this.origin.y = this.position.y + this.h / 2
        this.bullet = new Image(this.w, this.h)
        this.bullet.src = '/sprites/bullet.png'
        this.bullet.style.transform = `rotate(${this.angle}rad, ${this.angle}rad)`
        this.speed = 10
    }
    update() {
        
        this.position.x += Math.cos(this.angle) * this.speed;
        this.position.y += Math.sin(this.angle) * this.speed;
        
        ctx.save();
        
        ctx.translate(
            this.position.x + this.w / 2,
            this.position.y + this.h / 2
        );
        
        ctx.rotate(this.angle);
        
        ctx.drawImage(
            this.bullet,
            -this.w / 2,
            -this.h / 2,
            this.w,
            this.h
        );
        
        ctx.restore();
        
    }
}
let reload = false
addEventListener("touchmove", (e) => {
    if(reload) return;
    for (const t of e.changedTouches) {
        const angle = Math.atan2(t.clientY - innerHeight + 100, t.clientX - innerWidth + 100)
        
        let bul = new Bullet(innerWidth - 100, innerHeight - 100, angle)
        bul.speed *= wave
        game.add(bul)
        bullets.push(bul)
        reload = true
        const rld = setTimeout(()=>{
            reload = false
            clearTimeout(rld)
        }, 100)
    }
})


let aeroplane = new Sprite(
    innerWidth - 200,
    innerHeight - 200,
    "/sprites/aeroplane.png",
    200,
    200
)
let aeroplanePosY = 0
game.add(aeroplane)


// ЦИКЛ ИГРЫЫЫЫЫ

function gameLoop(time) {
    
    deltaTime = time - lastTime;
    lastTime = time;
    
    aeroplanePosY += 0.1
    if (aeroplanePosY >= Math.PI * 2) {
        aeroplanePosY = 0
    }
    aeroplane.position.y = innerHeight - 200 + Math.sin(aeroplanePosY) * 10
    
    
    if(game.entities.lenght >= 50){
        game.entities.slice(game.entities.lenght, 30)
    }
    ctx.clearRect(
        0,
        0,
        cnv.width,
        cnv.height
    );
    
    
    // движение облаков
    
    for (let i = clouds.length - 1; i >= 0; i--) {
        
        clouds[i].position.x += 2;
        
        if (clouds[i].position.x > innerWidth + 100) {
            
            clouds[i].remove();
            clouds.splice(i, 1);
            
        }
    }
    
    // движение птиц
    
    for (let i = birds.length - 1; i >= 0; i--) {
        
        birds[i].position.x += birdSpeed;
        
        if (birds[i].position.x > innerWidth + 100) {
            
            birds[i].remove();
            birds.splice(i, 1);
            
            pause()
            document.getElementById("pauseBtn").remove()
            document.getElementById("loselbl").style.opacity = 1
            document.getElementById("loselbl2").style.opacity = 1
            prog = 200
            document.getElementById("reloadBtn").style.opacity = 1
            document.getElementById("reloadBtn").style.pointerEvents = 'auto'
        }
        if(birds[i].position.y <= 0){
            birds[i].remove();
            birds.splice(i, 1);
        }
    }
    
    for (let i = birds.length - 1; i >= 0; i--) {
        
        for (let j = bullets.length - 1; j >= 0; j--) {
            
            if (
                birds[i] &&
                bullets[j] &&
                birds[i].intersects(bullets[j])
            ) {
                
                birds[i].remove();
                bullets[j].remove();
                
                birds.splice(i, 1);
                bullets.splice(j, 1);
                break;
                
            }
            
        }
        
    }
    
    game.update()
    
    if(!isPause){
        requestAnimationFrame(gameLoop);
    }
}
const exit = document.getElementById("exit")
function pause() {
    isPause = !isPause
    if(!isPause){
        exit.style.opacity = 0
        exit.style.pointerEvents = 'none'
        requestAnimationFrame(gameLoop)
    } else {
        exit.style.opacity = 1
        exit.style.pointerEvents = ''
    }
}
let ultbtn = document.getElementById("ultabtn")
function ulta() {
    ultbtn.disabled = true
    ultbtn.style.background = '#500'
    
    for(let i = 0; i < 360; i += 5){
        let a = i*(Math.PI/180)
        let bull = new Bullet(innerWidth/2, innerHeight/2, a)
        bull.w = 200
        game.add(bull)
        bullets.push(bull)
    }
    setTimeout(()=>{
        for(let i = 0; i < 360; i += 5){
        let a = i*(Math.PI/180)
        let bull = new Bullet(innerWidth/2, innerHeight/2, a)
        bull.w = 200
        game.add(bull)
        bullets.push(bull)
    }
    }, 500)
    
    setTimeout(()=>{
        ultbtn.disabled = false
        ultbtn.style.background = 'red'
    }, 5000)
}
let skill1Reloading = false
let sk1btn = document.getElementById('skill1')
function skill1() {
    if(skill1Reloading) return;
    sk1btn.style.background = '#005'
    skill1Reloading = true
    for(let i = 0; i < innerHeight; i += 25){
        let lastnum = i.toString()
        lastnum = lastnum.split("")[lastnum.length - 1]
        let angle
        let x = 0
        if(lastnum == "5"){
            angle = 0
        } else if (lastnum == "0"){
            angle = 180*(Math.PI/180)
            x = innerWidth
        }
        let bull = new Bullet(x, i, angle)
        game.add(bull)
        bullets.push(bull)
    }
    const rld = setTimeout(()=>{
        skill1Reloading = false 
        sk1btn.style.background = 'blue'
        clearTimeout(rld)
    }, 2000)
}

let skill2reload = false
let sk2btn = document.getElementById("skill2")
function skill2(){
    if(skill2reload) return;
    sk2btn.style.background = '#005'
    skill2reload = true
    for(let i = 0; i < 20; i += 10){
        for(let j = 0; j < innerHeight; j += 10){
            let x = 300+i*2
            let angle = Math.PI 
            let bul = new Bullet(x, j, angle)
            bul.speed = 0 
            game.add(bul)
            bullets.push(bul)
        }
    }
    const rld = setTimeout(()=>{
        skill2reload = false 
        sk2btn.style.background = 'blue'
        clearTimeout(rld)
    }, 60000)
}


requestAnimationFrame(gameLoop);