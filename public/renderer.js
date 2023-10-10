document.addEventListener('DOMContentLoaded', () => {
  const input = document.querySelector('input[type="file"]');
  const canvas = document.getElementById('image-canvas');
  const ctx = canvas.getContext('2d');

  const textFileName = document.getElementById('prev-filename')

  const coordinatesList = [];

  let images = []; // Array para armazenar as imagens carregadas
  let currentImageIndex = 0; // Índice da imagem atual no array

  let isDrawing = false;
  let startX, startY, endX, endY;
  let fileName;
  let lastCoordinatesList;

  input.addEventListener('change', handleFileSelect);

  function handleFileSelect(event) {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          images.push(img);
          if (images.length === files.length) {
            // Se todas as imagens foram carregadas, desenha a primeira imagem
            drawImage(images[currentImageIndex]);
            textFileName.innerText = input.files[currentImageIndex].name;
            fileName = input.files[currentImageIndex].name;
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  function drawImage(img) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa o canvas
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);
  }

  function handleMouseMove(event) {
    if (images.length !== 0) {
      const mouseX = event.clientX - canvas.getBoundingClientRect().left;
      const mouseY = event.clientY - canvas.getBoundingClientRect().top;

      // Limpa o canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Redesenha a imagem
      drawImage(images[currentImageIndex]);

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

  }

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
      xmin: startX / images[currentImageIndex].width,
      ymin: startY / images[currentImageIndex].height,
      xmax: (endX - startX) / images[currentImageIndex].width,
      ymax: (endY - startY) / images[currentImageIndex].height,
    };
  });

  document.getElementById('next-button').addEventListener('click', function () {
    // Muda para a próxima imagem
    if (currentImageIndex < images.length - 1) {
      currentImageIndex++;
      drawImage(images[currentImageIndex]);
      fileName = input.files[currentImageIndex].name;
      textFileName.innerText = fileName;
    }
  });

  document.getElementById('prev-button').addEventListener('click', function () {
    // Muda para a imagem anterior
    if (currentImageIndex > 0) {
      currentImageIndex--;
      drawImage(images[currentImageIndex]);
      fileName = input.files[currentImageIndex].name;
      textFileName.innerText = fileName;
    }
  });

  document.getElementById('next-save').addEventListener('click', function () {
    // Salva as coordenadas em um arquivo ou envia para o servidor
    if (fileName && lastCoordinatesList) {
      coordinatesList.push({ fileName, coordinates: lastCoordinatesList });
      console.log(JSON.stringify(coordinatesList));
    }
  });

  document.addEventListener('mousemove', handleMouseMove);

  document.getElementById('prev-clipboard').addEventListener('click', function (event) {
    event.preventDefault();
    
    const coordinatesListString = JSON.stringify(coordinatesList);
    navigator.clipboard.writeText(coordinatesListString).then(function () {
      console.log('Coordenadas copiadas para a área de transferência!');
    }).catch(function (err) {
      console.error('Falha ao copiar coordenadas: ', err);
    });
  })
});
