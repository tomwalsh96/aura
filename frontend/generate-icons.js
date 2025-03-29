const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create a 1024x1024 canvas
const canvas = createCanvas(1024, 1024);
const ctx = canvas.getContext('2d');

// Set background color
ctx.fillStyle = '#4A90E2';
ctx.fillRect(0, 0, 1024, 1024);

// Draw a simple aura-like circle
ctx.beginPath();
ctx.arc(512, 512, 300, 0, Math.PI * 2);
ctx.strokeStyle = 'white';
ctx.lineWidth = 40;
ctx.stroke();

// Draw inner circle
ctx.beginPath();
ctx.arc(512, 512, 150, 0, Math.PI * 2);
ctx.fillStyle = 'white';
ctx.fill();

// Save the image
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(__dirname, 'assets', 'icon.png'), buffer);

// Copy to other required assets
fs.copyFileSync(
  path.join(__dirname, 'assets', 'icon.png'),
  path.join(__dirname, 'assets', 'splash.png')
);
fs.copyFileSync(
  path.join(__dirname, 'assets', 'icon.png'),
  path.join(__dirname, 'assets', 'adaptive-icon.png')
);
fs.copyFileSync(
  path.join(__dirname, 'assets', 'icon.png'),
  path.join(__dirname, 'assets', 'favicon.png')
);

console.log('Icons generated successfully!'); 