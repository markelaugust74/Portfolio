const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const G = 6.67430e-11;
const SCALE = 1e9;
const TIME_STEP = 3600 * 24;
const AU = 149.6e9;

let WIDTH = window.innerWidth;
let HEIGHT = window.innerHeight;
canvas.width = WIDTH;
canvas.height = HEIGHT;

let cameraOffset = { x: 0, y: 0 };
let timeFactor = 1;
let zoomFactor = 1;
let isDragging = false;
let lastMousePos = { x: 0, y: 0 };
let totalElapsedTime = 0;




// Handle touch interactions
let lastTouchDistance = 0;

class CelestialBody {
  constructor(name, mass, radius, semiMajorAxis, eccentricity, color) {
    this.name = name;
    this.mass = mass;
    this.radius = radius;
    this.semiMajorAxis = semiMajorAxis;
    this.eccentricity = eccentricity;
    this.color = color;
    this.orbitPoints = [];
    this.angle = 0;
    this.period = this.calculatePeriod();
    this.position = this.calculatePosition(0);
    this.daysPassed = 0;
    this.yearsPassed = 0;
  }



  
  calculatePeriod() {
    const sunMass = 1.989e30;
    return 2 * Math.PI * Math.sqrt(Math.pow(this.semiMajorAxis, 3) / (G * sunMass));
  }

  calculatePosition(time) {
    const meanAnomaly = (2 * Math.PI * time) / this.period;
    let eccentricAnomaly = meanAnomaly;
    for (let i = 0; i < 5; i++) {
      eccentricAnomaly = meanAnomaly + this.eccentricity * Math.sin(eccentricAnomaly);
    }
    const trueAnomaly = 2 * Math.atan(Math.sqrt((1 + this.eccentricity) / (1 - this.eccentricity)) * Math.tan(eccentricAnomaly / 2));
    const distance = this.semiMajorAxis * (1 - this.eccentricity * Math.cos(eccentricAnomaly));
    const x = distance * Math.cos(trueAnomaly);
    const y = distance * Math.sin(trueAnomaly);
    return { x: x / SCALE + WIDTH / 2, y: y / SCALE + HEIGHT / 2 };
  }

  update(dt) {
    this.angle += (2 * Math.PI * dt) / this.period;
    this.position = this.calculatePosition(this.angle * this.period / (2 * Math.PI));
    this.orbitPoints.push({ x: this.position.x, y: this.position.y });
    if (this.orbitPoints.length > 22) {
      this.orbitPoints.shift();
    }
    this.daysPassed += dt / (24 * 3600);
    this.yearsPassed = this.daysPassed / (this.period / (24 * 3600));
  }

  draw(ctx, cameraOffset, zoomFactor) {
    let pos = {
      x: (this.position.x - cameraOffset.x) * zoomFactor,
      y: (this.position.y - cameraOffset.y) * zoomFactor
    };
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, Math.max(1, this.radius * zoomFactor), 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.max(10, 12 * zoomFactor)}px Arial`;
    ctx.fillText(this.name, pos.x + this.radius + 5, pos.y - 10);
    if (this.orbitPoints.length > 1) {
      ctx.strokeStyle = this.color;
      ctx.beginPath();
      let startPoint = {
        x: (this.orbitPoints[0].x - cameraOffset.x) * zoomFactor,
        y: (this.orbitPoints[0].y - cameraOffset.y) * zoomFactor
      };
      ctx.moveTo(startPoint.x, startPoint.y);
      for (let point of this.orbitPoints) {
        let drawPoint = {
          x: (point.x - cameraOffset.x) * zoomFactor,
          y: (point.y - cameraOffset.y) * zoomFactor
        };
        ctx.lineTo(drawPoint.x, drawPoint.y);
      }
      ctx.stroke();
    }
  }
}

class Sun extends CelestialBody {
  constructor() {
    super("Sun", 1.989e30, 30, 0, 0, '#ffff00');
    this.position = { x: WIDTH / 2, y: HEIGHT / 2 };
  }

  update() {}

  draw(ctx, cameraOffset, zoomFactor) {
    super.draw(ctx, cameraOffset, zoomFactor);
    let pos = {
      x: (this.position.x - cameraOffset.x) * zoomFactor,
      y: (this.position.y - cameraOffset.y) * zoomFactor
    };
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(255, 255, 100, ${0.2 - i*0.04})`;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, (this.radius + i*2) * zoomFactor, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }
}

class Space {
  constructor() {
    this.bodies = [];
    this.stars = new Map();
    this.asteroidBelt = new Map();
  }

  addBody(body) {
    this.bodies.push(body);
  }

  update(dt) {
    for (let body of this.bodies) {
      body.update(dt);
    }
    totalElapsedTime += dt;
  }

  generateStars(x, y, size) {
    const key = `${Math.floor(x/size)},${Math.floor(y/size)}`;
    if (!this.stars.has(key)) {
      const cellStars = [];
      const starCount = Math.floor(Math.random() * 10) + 5;
      for (let i = 0; i < starCount; i++) {
        cellStars.push({
          x: x + Math.random() * size,
          y: y + Math.random() * size,
          brightness: Math.random() * 0.5 + 0.5
        });
      }
      this.stars.set(key, cellStars);
    }
    return this.stars.get(key);
  }

  generateAsteroids(x, y, size) {
    const key = `${Math.floor(x/size)},${Math.floor(y/size)}`;
    if (!this.asteroidBelt.has(key)) {
      const cellAsteroids = [];
      const asteroidCount = Math.floor(Math.random() * 5) + 2;
      for (let i = 0; i < asteroidCount; i++) {
        cellAsteroids.push({
          x: x + Math.random() * size,
          y: y + Math.random() * size,
          radius: Math.random() * 2 + 1
        });
      }
      this.asteroidBelt.set(key, cellAsteroids);
    }
    return this.asteroidBelt.get(key);
  }

  draw(ctx, cameraOffset, zoomFactor) {
    const sunPos = this.bodies[0].position;
    const viewSize = Math.max(WIDTH, HEIGHT) / zoomFactor;
    const cellSize = 100;

    if (zoomFactor > 0.09) {  // Only draw stars when not too zoomed out
      ctx.fillStyle = '#ffffff';
      for (let x = cameraOffset.x - viewSize; x < cameraOffset.x + viewSize; x += cellSize) {
        for (let y = cameraOffset.y - viewSize; y < cameraOffset.y + viewSize; y += cellSize) {
          const stars = this.generateStars(x, y, cellSize);
          for (let star of stars) {
            let screenY = (star.y - cameraOffset.y);
            let screenX = (star.x - cameraOffset.x);
            if (screenX >= 0 && screenX < WIDTH && screenY >= 0 && screenY < HEIGHT) {
              ctx.globalAlpha = star.brightness;
              ctx.fillRect(screenX, screenY, 1, 1);
            }
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    const asteroidBeltInner = 2.2 * AU / SCALE;
    const asteroidBeltOuter = 3.2 * AU / SCALE;
    ctx.fillStyle = '#666666';
    for (let x = sunPos.x - asteroidBeltOuter; x < sunPos.x + asteroidBeltOuter; x += cellSize) {
      for (let y = sunPos.y - asteroidBeltOuter; y < sunPos.y + asteroidBeltOuter; y += cellSize) {
        const asteroids = this.generateAsteroids(x, y, cellSize);
        for (let asteroid of asteroids) {
          let dx = asteroid.x - sunPos.x;
          let dy = asteroid.y - sunPos.y;
          let distance = Math.sqrt(dx*dx + dy*dy);
          if (distance >= asteroidBeltInner && distance <= asteroidBeltOuter) {
            let screenX = (asteroid.x - cameraOffset.x) * zoomFactor;
            let screenY = (asteroid.y - cameraOffset.y) * zoomFactor;
            if (screenX >= 0 && screenX < WIDTH && screenY >= 0 && screenY < HEIGHT) {
              ctx.beginPath();
              ctx.arc(screenX, screenY, asteroid.radius * zoomFactor, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        }
      }
    }

    for (let body of this.bodies) {
      body.draw(ctx, cameraOffset, zoomFactor);
    }
  }
}

const space = new Space();
const sun = new Sun();
space.addBody(sun);

const planetsData = [
  { name: "Mercury", mass: 3.3e23, radius: 2440000 / SCALE, semiMajorAxis: 0.387 * AU, eccentricity: 0.206 },
  { name: "Venus", mass: 4.87e24, radius: 6052000 / SCALE, semiMajorAxis: 0.723 * AU, eccentricity: 0.007 },
  { name: "Earth", mass: 5.97e24, radius: 6371000 / SCALE, semiMajorAxis: 1.000 * AU, eccentricity: 0.017 },
  { name: "Mars", mass: 6.42e23, radius: 3390000 / SCALE, semiMajorAxis: 1.524 * AU, eccentricity: 0.093 },
  { name: "Jupiter", mass: 1.9e27, radius: 69911000 / SCALE, semiMajorAxis: 5.203 * AU, eccentricity: 0.048 },
  { name: "Saturn", mass: 5.68e26, radius: 58232000 / SCALE, semiMajorAxis: 9.537 * AU, eccentricity: 0.054 },
  { name: "Uranus", mass: 8.68e25, radius: 25362000 / SCALE, semiMajorAxis: 19.191 * AU, eccentricity: 0.046 },
  { name: "Neptune", mass: 1.02e26, radius: 24622000 / SCALE, semiMajorAxis: 30.069 * AU, eccentricity: 0.010 },
  { name: "Pluto", mass: 1.31e22, radius: 1188300 / SCALE, semiMajorAxis: 39.482 * AU, eccentricity: 0.249 },
  { name: "Ceres", mass: 9.39e20, radius: 473000 / SCALE, semiMajorAxis: 2.77 * AU, eccentricity: 0.08 },
  { name: "Haumea", mass: 4.01e21, radius: 816000 / SCALE, semiMajorAxis: 43.335 * AU, eccentricity: 0.195 },
  { name: "Asteroid 1", mass: 3e18, radius: 50000 / SCALE, semiMajorAxis: 2.5 * AU, eccentricity: 0.15 },
  { name: "Asteroid 2", mass: 2e18, radius: 45000 / SCALE, semiMajorAxis: 2.8 * AU, eccentricity: 0.12 },
  { name: "Comet 1", mass: 1e15, radius: 10000 / SCALE, semiMajorAxis: 5.5 * AU, eccentricity: 0.85,  tail: true },
  { name: "Comet 2", mass: 1e15, radius: 15000 / SCALE, semiMajorAxis: 3.0 * AU, eccentricity: 0.95,tail: true },
];


const colors = [
  '#a9a9a9', // Mercury dark gray
  '#ffc64b', // Venus yellow-orange
  '#6495ed', // Earth blue
  '#bc2732', // Mars red
  '#ffa500', // Jupiter orange
  '#eee8aa', // Saturn pale yellow
  '#40e0d0', // Uranus turquoise
  '#1e90ff', // Neptune deep blue
  "#f5deb3" ,// Pluto grey
  "#dda0dd", // Ceres
  "#ffb6c1", // Haumea
  "#778899",// Asteroid 1
  "#808080",// Asteroid 2
  "#ADD8E6",// Comet 1
  "#B0E0E6",// Comet 2
]

for (let i = 0; i < planetsData.length; i++) {
  let planetData = planetsData[i];
  let planet = new CelestialBody(
    planetData.name,
    planetData.mass,
    planetData.radius,
    planetData.semiMajorAxis,
    planetData.eccentricity,
    colors[i]
  );
  space.addBody(planet);
}

function update() {
  space.update(TIME_STEP * timeFactor);
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  space.draw(ctx, cameraOffset, zoomFactor);
}

function gameLoop() {
  update();
  draw();
  updateDashboard();
  requestAnimationFrame(gameLoop);
}

function updateDashboard() {
  const dashboard = document.getElementById('dashboard');
  dashboard.innerHTML = `
    <h2>Solar System Statistics</h2>
    <div class="stat-box">
      <div class="stat-title">Total Elapsed Time</div>
      <div class="stat-value">${(totalElapsedTime / (24 * 3600)).toFixed(2)} Earth days</div>
    </div>
    ${space.bodies.slice(1).map(body => `
      <div class="stat-box">
        <div class="stat-title">${body.name}</div>
        <div>Days passed: ${body.daysPassed.toFixed(2)}</div>
        <div>Years passed: ${body.yearsPassed.toFixed(2)}</div>
        <div>Current distance from Sun: ${(Math.sqrt((body.position.x - WIDTH/2)**2 + (body.position.y - HEIGHT/2)**2) * SCALE / AU).toFixed(3)} AU</div>
      </div>
    `).join('')}
  `;
}

gameLoop();

canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  lastMousePos = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('mousemove', (e) => {
  if (isDragging) {
    let dx = e.clientX - lastMousePos.x;
    let dy = e.clientY - lastMousePos.y;
    cameraOffset.x -= dx / zoomFactor;
    cameraOffset.y -= dy / zoomFactor;
    lastMousePos = { x: e.clientX, y: e.clientY };
  }
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  let zoomIntensity = 0.1;
  let zoom = e.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity;
  zoomFactor *= zoom;
  
  let mouseX = e.clientX;
  let mouseY = e.clientY;
  cameraOffset.x += (mouseX / zoomFactor - mouseX / (zoomFactor * zoom)) * zoom;
  cameraOffset.y += (mouseY / zoomFactor - mouseY / (zoomFactor * zoom)) * zoom;
  
  document.getElementById('zoomLevel').value = Math.log2(zoomFactor);
  document.getElementById('zoomLevelValue').textContent = `x${zoomFactor.toFixed(2)}`;
});

// Mobile handle touch events
canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else if (e.touches.length === 2) {
    lastTouchDistance = getDistanceBetweenTouches(e.touches);
  }
});

canvas.addEventListener('touchmove', (e) => {
  if (isDragging && e.touches.length === 1) {
    let dx = e.touches[0].clientX - lastMousePos.x;
    let dy = e.touches[0].clientY - lastMousePos.y;
    cameraOffset.x -= dx / zoomFactor;
    cameraOffset.y -= dy / zoomFactor;
    lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else if (e.touches.length === 2) {
    let currentTouchDistance = getDistanceBetweenTouches(e.touches);
    let zoom = currentTouchDistance / lastTouchDistance;
    zoomFactor *= zoom;
    lastTouchDistance = currentTouchDistance;
  }
});

canvas.addEventListener('touchend', (e) => {
  if (e.touches.length < 2) {
    isDragging = false;
    lastTouchDistance = 0;
  }
});

function getDistanceBetweenTouches(touches) {
  let dx = touches[0].clientX - touches[1].clientX;
  let dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}


document.getElementById('pausePlay').addEventListener('click', () => {
  if (timeFactor === 0) {
    timeFactor = parseFloat(document.getElementById('timeSpeed').value);
    document.getElementById('pausePlay').textContent = 'Pause';
  } else {
    timeFactor = 0;
    document.getElementById('pausePlay').textContent = 'Play';
  }
  updateTimeSpeed();
});

document.getElementById('resetView').addEventListener('click', () => {
  cameraOffset = { x: 0, y: 0 };
  zoomFactor = 1;
  document.getElementById('zoomLevel').value = 0;
  document.getElementById('zoomLevelValue').textContent = 'x1.00';
});

document.getElementById('timeSpeed').addEventListener('input', (e) => {
  timeFactor = Math.pow(900, parseFloat(e.target.value));
  updateTimeSpeed();
});

document.getElementById('zoomLevel').addEventListener('input', (e) => {
  zoomFactor = Math.pow(2, parseFloat(e.target.value));
  document.getElementById('zoomLevelValue').textContent = `x${zoomFactor.toFixed(2)}`;
});

function updateTimeSpeed() {
  document.getElementById('timeSpeedValue').textContent = `x${timeFactor.toFixed(1)}`;
}

canvas.addEventListener('mousemove', (e) => {
  let mouseX = e.clientX;
  let mouseY = e.clientY;
  let closestBody = null;
  let closestDistance = Infinity;

  for (let body of space.bodies) {
    let bodyScreenX = (body.position.x - cameraOffset.x) * zoomFactor;
    let bodyScreenY = (body.position.y - cameraOffset.y) * zoomFactor;
    let distance = Math.sqrt((mouseX - bodyScreenX)**2 + (mouseY - bodyScreenY)**2);
    
    if (distance < closestDistance) {
      closestBody = body;
      closestDistance = distance;
    }
  }

  if (closestBody && closestDistance < closestBody.radius * zoomFactor * 2) {
    document.getElementById('info').innerHTML = `
      Name: ${closestBody.name}<br>
      Mass: ${closestBody.mass.toExponential(2)} kg<br>
      Radius: ${(closestBody.radius * SCALE / 1000).toFixed(0)} km<br>
      Semi-major axis: ${(closestBody.semiMajorAxis / AU).toFixed(3)} AU<br>
      Eccentricity: ${closestBody.eccentricity.toFixed(3)}
    `;
  } else {
    document.getElementById('info').innerHTML = '';
  }
});

window.addEventListener('resize', () => {
  WIDTH = window.innerWidth;
  HEIGHT = window.innerHeight;
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
});

const dashboardToggle = document.getElementById('dashboardToggle');
const dashboard = document.getElementById('dashboard');

dashboardToggle.addEventListener('click', () => {
  dashboard.classList.toggle('open');
  dashboardToggle.textContent = dashboard.classList.contains('open') ? 'Close Dashboard' : 'Open Dashboard';
});

const modeToggle = document.getElementById('modeToggle');

modeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  document.body.classList.toggle('dark-mode');
});

document.getElementById('watermark').addEventListener('click', () => {
  document.getElementById('popup').style.display = 'block';
});

document.getElementById('closePopup').addEventListener('click', () => {
  document.getElementById('popup').style.display = 'none';
});
