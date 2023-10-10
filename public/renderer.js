document.addEventListener('DOMContentLoaded', () => {
  const input = document.querySelector('input[type="file"]');
  const canvas = document.getElementById('image-canvas');
  const ctx = canvas.getContext('2d');
  
  const coordinatesList = [];

  let img; // Variável para armazenar a imagem carregada
  let fileName;
  let lastCoordinatesList;

  input.addEventListener('change', handleFileSelect);

  function handleFileSelect(event) {
    const file = event.target.files[0]; // Apenas a primeira imagem do array de arquivos
    fileName = file.name;

    const reader = new FileReader();
    reader.onload = function (e) {
      img = new Image();
      img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
      };
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  }

  function handleMouseMove(event) {
    const mouseX = event.clientX - canvas.getBoundingClientRect().left;
    const mouseY = event.clientY - canvas.getBoundingClientRect().top;

    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redesenha a imagem
    ctx.drawImage(img, 0, 0, img.width, img.height);

    // Desenha o quadrado branco com borda vermelha
    if (isDrawing) {
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, startY, mouseX - startX, mouseY - startY);
    } else if (startX !== undefined) {
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, startY, endX - startX, endY - startY);
    }

    // Desenha a linha horizontal
    ctx.beginPath();
    ctx.moveTo(0, mouseY);
    ctx.lineTo(canvas.width, mouseY);
    ctx.strokeStyle = 'green';
    ctx.stroke();

    // Desenha a linha vertical
    ctx.beginPath();
    ctx.moveTo(mouseX, 0);
    ctx.lineTo(mouseX, canvas.height);
    ctx.strokeStyle = 'blue';
    ctx.stroke();
  }

  let isDrawing = false;
  let startX, startY, endX, endY;

  canvas.addEventListener('mousedown', (event) => {
    isDrawing = true;
    startX = event.clientX - canvas.getBoundingClientRect().left;
    startY = event.clientY - canvas.getBoundingClientRect().top;
  });

  canvas.addEventListener('mouseup', (event) => {
    isDrawing = false;
    endX = event.clientX - canvas.getBoundingClientRect().left;
    endY = event.clientY - canvas.getBoundingClientRect().top;

    // salva coordenadas do ultimo quadrado vermelho
    lastCoordinatesList = {
      xmin: Math.min(startX, endX),
      ymin: Math.min(startY, endY),
      xmax: Math.max(startX, endX),
      ymax: Math.max(startY, endY),
    };
  });

  document.getElementById('next-save').addEventListener('click', function() {
    // Salva as coordenadas em um arquivo ou envia para o servidor

    coordinatesList.push({fileName, lastCoordinatesList});
    console.log(JSON.stringify(coordinatesList));
  });

  document.addEventListener('mousemove', handleMouseMove);
});
