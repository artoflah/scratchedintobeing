// File: script.js
// Optimized adaptive-draw version with spraypaint effect

// Configuration
const imageFiles = [
    'images/IMAGE19.png', 'images/IMAGE20.png', 'images/IMAGE21.png', 'images/IMAGE22.png',
    'images/IMAGE23.png', 'images/IMAGE24.png', 'images/IMAGE25.png', 'images/IMAGE26.png',
    'images/IMAGE27.png', 'images/IMAGE28.png', 'images/IMAGE29.png', 'images/IMAGE30.png',
    'images/IMAGE31.png', 'images/IMAGE32.png', 'images/IMAGE33.png', 'images/IMAGE34.png',
    'images/IMAGE35.png', 'images/IMAGE36.png', 'images/IMAGE37.png', 'images/IMAGE38.png',
    'images/IMAGE39.png', 'images/IMAGE40.png', 'images/IMAGE41.png', 'images/IMAGE42.png',
    'images/IMAGE43.png', 'images/IMAGE44.png', 'images/IMAGE45.png', 'images/IMAGE46.png',
    'images/IMAGE47.png', 'images/IMAGE48.png', 'images/IMAGE49.png', 'images/IMAGE50.png',
    'images/IMAGE51.png', 'images/IMAGE52.png', 'images/IMAGE53.png', 'images/IMAGE54.png',
    'images/IMAGE55.png', 'images/IMAGE56.png', 'images/IMAGE57.png', 'images/IMAGE58.png',
    'images/IMAGE59.png', 'images/IMAGE60.png', 'images/IMAGE61.png', 'images/IMAGE62.png',
    'images/IMAGE63.png', 'images/IMAGE64.png', 'images/IMAGE65.png', 'images/IMAGE66.png',
    'images/IMAGE67.png', 'images/IMAGE68.png', 'images/IMAGE69.png', 'images/IMAGE70.png',
    'images/IMAGE71.png', 'images/IMAGE72.png', 'images/IMAGE73.png', 'images/IMAGE74.png',
    'images/IMAGE75.png', 'images/IMAGEFOLDOUT.png', 'images/IMAGEFOLDOUT2.png',
    'images/IMAGEFOLDOUT3.png', 'images/REGIMG15.png'
  ];
  
  const totalImages = imageFiles.length || 80;
  let currentTool = 'scratch';
  let currentColor = '#ffffff';
  let fullPageCanvas, fullPageCtx;
  let connectionMap = new Map();
  let scrollFadeActive = false;
  
  // --- Utility: Image placement ---
  function generateImagePositions(count) {
    const positions = [];
    const verticalSpacing = 2000 / count;
    for (let i = 0; i < count; i++) {
      const topPosition = (i * verticalSpacing) + (Math.random() * verticalSpacing * 0.8);
      const useLeft = i % 2 === 0;
      positions.push({
        top: topPosition,
        [useLeft ? 'left' : 'right']: 5 + Math.random() * 40,
        imageFile: imageFiles[i] || null
      });
    }
    return positions;
  }
  
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
  
  // --- Build gallery dynamically ---
  async function createGallery() {
    const gallery = document.getElementById('gallery');
    const positions = generateImagePositions(totalImages);
  
    for (let index = 0; index < positions.length; index++) {
      const pos = positions[index];
      const container = document.createElement('div');
      container.className = 'image-container';
      container.style.top = `${pos.top}vh`;
      if (pos.left !== undefined) container.style.left = `${pos.left}vw`;
      else container.style.right = `${pos.right}vw`;
      container.dataset.index = index;
  
      const wrapper = document.createElement('div');
      wrapper.className = 'canvas-wrapper';
  
      let width = 400, height = 300;
      if (pos.imageFile) {
        try {
          const img = await loadImage(pos.imageFile);
          width = img.naturalWidth;
          height = img.naturalHeight;
          const maxDim = 600;
          if (width > maxDim || height > maxDim) {
            const scale = maxDim / Math.max(width, height);
            width *= scale;
            height *= scale;
          }
          wrapper.style.backgroundImage = `url('${pos.imageFile}')`;
          wrapper.style.backgroundSize = 'cover';
          wrapper.style.backgroundPosition = 'center';
        } catch {}
      }
  
      wrapper.style.width = `${width}px`;
      wrapper.style.height = `${height}px`;
  
      const canvas = document.createElement('canvas');
      canvas.className = 'drawing-canvas';
      canvas.width = width;
      canvas.height = height;
      wrapper.appendChild(canvas);
  
      const number = document.createElement('div');
      number.className = 'image-number';
      number.textContent = `SCR.${String(index + 1).padStart(3, '0')}`;
  
      container.appendChild(wrapper);
      container.appendChild(number);
      gallery.appendChild(container);
    }
    initializeCanvases();
    drawConnections();
  }
  
  // --- Draw subway connections ---
  function drawConnections() {
    const svg = document.getElementById('connection-lines');
    const containers = document.querySelectorAll('.image-container');
    const positions = Array.from(containers).map(container => {
      const rect = container.querySelector('.canvas-wrapper').getBoundingClientRect();
      const scrollY = window.scrollY;
      return { x: rect.left + rect.width / 2, y: rect.top + scrollY + rect.height / 2, element: container };
    });
    const maxY = Math.max(...positions.map(p => p.y)) + 500;
    svg.setAttribute('height', maxY);
    svg.setAttribute('width', '100%');
  
    positions.forEach((current, i) => {
      const distances = positions.map((pos, idx) => ({
        index: idx,
        distance: Math.hypot(pos.x - current.x, pos.y - current.y)
      })).filter(d => d.index !== i).sort((a, b) => a.distance - b.distance);
      const connCount = 2 + Math.floor(Math.random() * 2);
      const connectedLines = [];
  
      for (let j = 0; j < Math.min(connCount, distances.length); j++) {
        const target = positions[distances[j].index];
        if (distances[j].index > i) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', current.x);
          line.setAttribute('y1', current.y);
          line.setAttribute('x2', target.x);
          line.setAttribute('y2', target.y);
          svg.appendChild(line);
          connectedLines.push(line);
        }
      }
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', current.x);
      circle.setAttribute('cy', current.y);
      svg.appendChild(circle);
      connectionMap.set(i, { lines: connectedLines, circle });
    });
  }
  
  // --- Spraypaint effect ---
  function drawSpraypaint(ctx, x, y) {
    const particleCount = 15 + Math.random() * 15;
    const spread = 25;
    
    // Save the current state
    ctx.save();
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * spread;
      const px = x + Math.cos(angle) * distance;
      const py = y + Math.sin(angle) * distance;
      const size = Math.random() * 3 + 1;
      
      ctx.globalAlpha = Math.random() * 0.3 + 0.4; // Higher opacity: 0.4 to 0.7
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
    }
    
    // Center concentration - full opacity
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    
    // Restore state
    ctx.restore();
  }
  
  // --- Adaptive draw handler ---
  function createAdaptiveDrawer(ctx, getPosition) {
    let drawing = false;
    let lastPos = null;
  
    return {
      start(e) {
        drawing = true;
        lastPos = getPosition(e);
        
        if (currentTool === 'tag') {
          // Spraypaint - only use fill, never stroke
          applyToolStyle(ctx);
          drawSpraypaint(ctx, lastPos.x, lastPos.y);
        } else {
          // Scratch tool - use stroke
          applyToolStyle(ctx);
          ctx.beginPath();
          ctx.moveTo(lastPos.x, lastPos.y);
        }
      },
      move(e) {
        if (!drawing) return;
        const nowPos = getPosition(e);
        
        if (currentTool === 'tag') {
          // Spraypaint - interpolate particles between points
          const distance = Math.hypot(nowPos.x - lastPos.x, nowPos.y - lastPos.y);
          const steps = Math.max(1, Math.ceil(distance / 5));
          
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const ix = lastPos.x + (nowPos.x - lastPos.x) * t;
            const iy = lastPos.y + (nowPos.y - lastPos.y) * t;
            drawSpraypaint(ctx, ix, iy);
          }
        } else {
          // Scratch tool - draw line
          ctx.lineTo(nowPos.x, nowPos.y);
          ctx.stroke();
        }
        
        lastPos = nowPos;
      },
      end() { 
        drawing = false;
        if (currentTool === 'scratch') {
          ctx.beginPath(); // Reset path only for scratch tool
        }
      }
    };
  }
  
  // --- Canvas setup ---
  function initializeFullPageCanvas() {
    fullPageCanvas = document.getElementById('full-page-canvas');
    fullPageCanvas.width = window.innerWidth;
    fullPageCanvas.height = document.documentElement.scrollHeight;
    fullPageCtx = fullPageCanvas.getContext('2d', { alpha: true, desynchronized: true, willReadFrequently: false });
    fullPageCtx.lineCap = 'round';
    fullPageCtx.lineJoin = 'round';
  
    const drawer = createAdaptiveDrawer(fullPageCtx, e => ({
      x: e.clientX,
      y: e.clientY + window.scrollY
    }));
  
    document.addEventListener('pointerdown', e => {
      if (e.target.closest('.tools-panel') || e.target.closest('a')) return;
      drawer.start(e);
    });
    document.addEventListener('pointermove', e => drawer.move(e));
    ['pointerup', 'pointercancel'].forEach(ev => document.addEventListener(ev, drawer.end));
  }
  
  function initializeCanvases() {
    // Individual canvases are kept for potential future use but drawing is handled by full-page canvas
    document.querySelectorAll('.canvas-wrapper').forEach(container => {
      const canvas = container.querySelector('.drawing-canvas');
      const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    });
  }
  
  // --- Tools ---
  function applyToolStyle(ctx) {
    if (currentTool === 'scratch') {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.7;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else if (currentTool === 'tag') {
      // Spraypaint only uses fill, never stroke
      ctx.fillStyle = currentColor;
      ctx.globalAlpha = 0.15;
      // Explicitly disable stroke
      ctx.lineWidth = 0;
    }
  }
  
  
  document.querySelectorAll('.tool-item').forEach(tool => {
    tool.addEventListener('click', () => {
      document.querySelectorAll('.tool-item').forEach(t => t.classList.remove('active'));
      tool.classList.add('active');
      currentTool = tool.dataset.tool;
    });
  });
  
  document.querySelectorAll('.color-option').forEach(color => {
    color.addEventListener('click', () => {
      document.querySelectorAll('.color-option').forEach(c => {
        c.classList.remove('active');
        c.style.transform = '';
      });
      color.classList.add('active');
      color.style.transform = 'scale(1.3)';
      currentColor = color.dataset.color;
    });
  });
  
  document.querySelector('.clear-all').addEventListener('click', () => {
    fullPageCtx.clearRect(0, 0, fullPageCanvas.width, fullPageCanvas.height);
  });
  
  // --- Scroll fade ---
  let scrollPending = false;
  function handleScroll() {
    if (!scrollFadeActive) return;
    const containers = document.querySelectorAll('.image-container');
    const windowHeight = window.innerHeight;
    const scrollY = window.scrollY;
  
    containers.forEach((container, index) => {
      const rect = container.getBoundingClientRect();
      const top = rect.top + scrollY;
      const bottom = top + rect.height;
      const visible = bottom > scrollY - windowHeight * 0.3 &&
        top < scrollY + windowHeight + windowHeight * 0.3;
  
      const connections = connectionMap.get(index);
      if (visible) {
        container.classList.add('visible');
        if (connections) {
          connections.circle?.classList.add('visible');
          connections.lines.forEach(l => l.classList.add('visible'));
        }
      } else {
        container.classList.remove('visible');
        if (connections) {
          connections.circle?.classList.remove('visible');
          connections.lines.forEach(l => l.classList.remove('visible'));
        }
      }
    });
  }
  
  // --- Time ---
  function updateTime() {
    const t = document.querySelector('.time');
    if (!t) return;
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');
    const p = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    t.textContent = `${displayH}:${m} ${p} EST`;
  }
  
  // --- Handle hover effects manually since canvas blocks native hover ---
  function setupHoverEffects() {
    document.addEventListener('mousemove', (e) => {
      const containers = document.querySelectorAll('.image-container');
      containers.forEach(container => {
        const wrapper = container.querySelector('.canvas-wrapper');
        const rect = wrapper.getBoundingClientRect();
        const isHovering = e.clientX >= rect.left && e.clientX <= rect.right &&
                           e.clientY >= rect.top && e.clientY <= rect.bottom;
        
        if (isHovering) {
          container.classList.add('js-hover');
        } else {
          container.classList.remove('js-hover');
        }
      });
    });
  }
  
  // --- Initialization ---
  document.addEventListener('DOMContentLoaded', async () => {
    updateTime();
    setInterval(updateTime, 60000);
    await createGallery();
    initializeFullPageCanvas();
    setupHoverEffects();
    document.querySelectorAll('.image-container').forEach(c => c.classList.add('initially-hidden'));
    drawConnections();
  
    // Progressive reveal
    const containers = document.querySelectorAll('.image-container');
    let revealIndex = 0;
    function revealStep() {
      if (revealIndex >= containers.length) {
        scrollFadeActive = true;
        return;
      }
      const c = containers[revealIndex];
      c.classList.remove('initially-hidden');
      c.classList.add('visible');
      const conn = connectionMap.get(revealIndex);
      if (conn) {
        conn.circle?.classList.add('visible');
        conn.lines.forEach(l => l.classList.add('visible'));
      }
      revealIndex++;
      requestAnimationFrame(revealStep);
    }
    requestAnimationFrame(revealStep);
  
    handleScroll();
  });
  
  window.addEventListener('scroll', () => {
    if (!scrollPending) {
      scrollPending = true;
      requestAnimationFrame(() => {
        handleScroll();
        scrollPending = false;
      });
    }
  }, { passive: true });
  
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      fullPageCanvas.width = window.innerWidth;
      fullPageCanvas.height = document.documentElement.scrollHeight;
      const svg = document.getElementById('connection-lines');
      svg.innerHTML = '';
      connectionMap.clear();
      setTimeout(() => {
        drawConnections();
        if (scrollFadeActive) handleScroll();
      }, 100);
    }, 150);
  });