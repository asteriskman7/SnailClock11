'use strict';

//ngram data loaded as ngrams object
//ngram data extracted from https://www.jsc.nasa.gov/history/mission_trans/AS11_TEC.PDF

let canvas = document.getElementById('cmain');
let ctx = canvas.getContext('2d');
let imgCR = document.getElementById('img_cr');
let imgCRT = document.getElementById('img_crt');
let imgSnail = document.getElementById('img_snail');

// *** fnoise code begin
function rnd(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function pnoise(x, offset) {
    offset = offset|0;
    var x0 = Math.floor(x);
    var x1 = x0 + 1;
    var r0 = rnd(x0+offset);
    var r1 = rnd(x1+offset);
    var dx = x - x0;
    var rx = (r1 - r0) * dx + r0;
    return rx;
}

function fnoise(x,config) {
    var r=0;
    for (var i = 0; i < config.length; i++) {
        var c = config[i];
        var ri = c.a * pnoise(x * c.s, c.s);
        r += ri;
    }
    return r;
}

function getNoiseRange(config) {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < 1000; i += 1.1543) {
    let n = fnoise(i, config);
    min = Math.min(min, n);
    max = Math.max(max, n);
  }
  return [min, max, max - min];
}

function getNormalizedNoise(x, config, range) {
  return (fnoise(x, config) - range[0]) / range[2];
}
//** fnoise code end

function getTimeString(t) {
  let h = t.getHours();
  let m = t.getMinutes();
  let s = t.getSeconds();
  if (h < 10) {h = '0' + h;}
  if (m < 10) {m = '0' + m;}
  if (s < 10) {s = '0' + s;}
  let baseString = `${h}:${m}:${s}`;
  return baseString;
}


function makeText() {
  let wm2 = "`";
  let wm1 = "`";
  let lastNgram = `${wm2} ${wm1}`;
  let line = '';
  let punc = ".,!;";
  while (true) {
    let ng = ngrams[lastNgram];
    let nextWordIndex = Math.floor(ng.length * Math.random());
    let nextWord = ng[nextWordIndex];
    if (nextWord === "~") {
      return line;
    }

    if (punc.indexOf(nextWord) == -1) {
      line += ` ${nextWord}`;
    } else {
      line += nextWord;
    }

    wm2 = wm1
    wm1 = nextWord
    lastNgram = `${wm2} ${wm1}`;
  }
}

function splitText(text) {
  let tl = text.split` `;
  let maxLength = 30;
  let curLine = '';
  let lineNum = 0;
  let result = [];
  while (tl.length > 0 && lineNum < 10) {
    if (tl[0].length + curLine.length < 30) {
      curLine += ' ' + tl.shift();
    } else {
      lineNum += 1;
      result.push(curLine);
      curLine = '';
    }
  }
  if (curLine.length > 0) {
    result.push(curLine);
  }
  return result;
}

function drawText(elapsedTime, timeText, text) {
  //30 chars per line

  text = text.substr(0, Math.floor(elapsedTime + 1))

  let baseX = 270;
  let baseY = 400
  let deltaY = 14;

  ctx.fillStyle = '#00AF00';
  ctx.font = '12px Courier';
  ctx.fillText(timeText, baseX, baseY);
  baseY += deltaY;

  let tl = text.split` `;
  let maxLength = 30;
  let curLine = '';
  let lineNum = 0;
  while (tl.length > 0 && lineNum < 10) {
    if (tl[0].length + curLine.length < 30) {
      curLine += ' ' + tl.shift();
    } else {
      lineNum += 1;
      ctx.fillText(curLine, baseX, baseY);
      baseY += deltaY;
      baseX += 1;
      curLine = '';
    }
  }
  if (curLine.length > 0) {
    ctx.fillText(curLine, baseX, baseY);
  }

}

function blinkLights(t) {
  let baseX = 189;
  let deltaX = 29.9;
  let baseY = 265;
  let deltaY = 24;
  let w = 22;
  let h = 15;
  let noiseConfig = [
   {a: 128, s: 1/8},
   {a: 64,  s: 1/4},
   {a: 0,   s: 1/2},
   {a: 0,   s: 1},
   {a: 0,   s: 2},
   {a: 0,   s: 4},
  ];
  let noiseRange = getNoiseRange(noiseConfig);
  for (let x = 0; x < 6; x++) {
    for (let y = 0; y < 3; y++) {
      let noise = getNormalizedNoise(x*100 + 35100 * y + t.getTime() / 1000, noiseConfig, noiseRange );
      if (noise > 0.7) {
        let xpos = baseX + deltaX * x;
        let ypos = baseY + deltaY * y;
        let hue = 21;
        if (x === 4 && y === 2) {
          hue = 96;
        }
        if (x === 5 && y === 2) {
          continue;
        }
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.4)`;
        ctx.fillRect(xpos, ypos, w, h);
      }
    }
  }

  baseX = 406;
  deltaX = 29.5;
  baseY = 267;
  deltaY = 24;
  for (let x = 0; x < 6; x++) {
    for (let y = 0; y < 3; y++) {
      let noise = getNormalizedNoise(x*456 + 72104 * y + t.getTime() / 1000, noiseConfig, noiseRange );
      if (noise > 0.7) {
        let xpos = baseX + deltaX * x + y * 3;
        let ypos = baseY + deltaY * y;
        let hue = 21;
        if ((x % 2 === 1) && (y > 0)) {
          hue = 96;
        }
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.4)`;
        ctx.fillRect(xpos, ypos, w, h);
      }
    }
  }

}

let lastUpdate;
let curText;

function draw() {

  let curTime = new Date();
  let deltaTime = lastUpdate !== undefined ? (curTime.getTime() - lastUpdate.getTime()) : Infinity;

  let percent = (curTime.getMinutes() + curTime.getSeconds() / 60 + curTime.getMilliseconds() / 60000) / 60;
  let angle = percent * Math.PI * 2;

  if (lastUpdate === undefined || (deltaTime / 100  >  (30 + 10 * Math.random() + curText.length))) {
    curText = makeText();
    lastUpdate = curTime;
    deltaTime = 0;
  }


  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imgCR, 0, 0);


  let txt = makeText(new Date());

  drawText(Math.floor(deltaTime / 100), getTimeString(lastUpdate), curText);


  ctx.drawImage(imgCRT, 0, 0);

  //x from 133 to 450 (+317)
  let snailX = Math.floor(133 + 317 * percent);
  //y from 84 to 148 (+64)
  let aoffset = window.ao || 3.8;
  let snailY = 110 + 32 * Math.sin(angle + aoffset);

  if (curTime.getMilliseconds() < 700) {

    ctx.drawImage(imgSnail, snailX, snailY);

  }

  blinkLights(curTime);




  requestAnimationFrame(draw);
}

draw();
