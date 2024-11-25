document.addEventListener('DOMContentLoaded', () => {
  const input = document.querySelector('input[type="file"]');
  const canvas = document.getElementById('image-canvas');
  const ctx = canvas.getContext('2d');

  const textFileName = document.getElementById('prev-filename');
  const coordinatesList = {};

  let images = [];
  let currentImageIndex = 0;
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
            drawImage(images[currentImageIndex]);
            textFileName.innerText = input.files[currentImageIndex].name;
            fileName = input.files[currentImageIndex].name;
            loadCoordinatesForImage(fileName);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  function drawImage(img) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);
  }

  function drawSavedCoordinates() {
    if (fileName && coordinatesList[fileName]) {
      coordinatesList[fileName].forEach((coords) => {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          coords.xmin * images[currentImageIndex].width,
          coords.ymin * images[currentImageIndex].height,
          coords.xmax * images[currentImageIndex].width,
          coords.ymax * images[currentImageIndex].height
        );
  
        // Desenha o índice ou rótulo da classe
        ctx.fillStyle = 'green';
        ctx.font = '16px Arial';
        ctx.fillText(
          `Class ${coords.class}`,
          coords.xmin * images[currentImageIndex].width,
          coords.ymin * images[currentImageIndex].height - 5
        );
      });
    }
  }  

  function handleMouseMove(event) {
    if (images.length !== 0) {
      const mouseX = event.clientX - canvas.getBoundingClientRect().left;
      const mouseY = event.clientY - canvas.getBoundingClientRect().top;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawImage(images[currentImageIndex]);
      drawSavedCoordinates();

      if (isDrawing) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, startY, mouseX - startX, mouseY - startY);
      }

      ctx.beginPath();
      ctx.moveTo(0, mouseY);
      ctx.lineTo(canvas.width, mouseY);
      ctx.strokeStyle = 'green';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(mouseX, 0);
      ctx.lineTo(mouseX, canvas.height);
      ctx.strokeStyle = 'blue';
      ctx.stroke();
    }
  }

  canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault(); // Evita o menu padrão do botão direito
  
    // Obtém as coordenadas do clique
    const mouseX = event.clientX - canvas.getBoundingClientRect().left;
    const mouseY = event.clientY - canvas.getBoundingClientRect().top;
  
    if (fileName && coordinatesList[fileName]) {
      const objects = coordinatesList[fileName];
      const tolerance = 5; // Define uma margem de tolerância para cliques próximos
  
      // Itera sobre os retângulos existentes para verificar se o clique está dentro ou próximo
      for (let i = 0; i < objects.length; i++) {
        const coords = objects[i];
  
        // Converte as coordenadas normalizadas para as dimensões do canvas
        const xmin = coords.xmin * canvas.width;
        const ymin = coords.ymin * canvas.height;
        const xmax = (coords.xmin + coords.xmax) * canvas.width;
        const ymax = (coords.ymin + coords.ymax) * canvas.height;
  
        // Verifica se o clique está dentro ou próximo do retângulo
        if (
          mouseX >= xmin - tolerance &&
          mouseX <= xmax + tolerance &&
          mouseY >= ymin - tolerance &&
          mouseY <= ymax + tolerance
        ) {
          // Remove o retângulo da lista
          objects.splice(i, 1);
  
          // Redesenha o canvas sem o retângulo removido
          drawImage(images[currentImageIndex]);
          drawSavedCoordinates();
  
          break; // Encerra o loop após encontrar e remover o retângulo
        }
      }
    }
  });
    
  
  canvas.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;

    isDrawing = true;
    startX = event.clientX - canvas.getBoundingClientRect().left;
    startY = event.clientY - canvas.getBoundingClientRect().top;
  });

  canvas.addEventListener('mouseup', (event) => {
    if (event.button !== 0) return;
    
    isDrawing = false;
    endX = event.clientX - canvas.getBoundingClientRect().left;
    endY = event.clientY - canvas.getBoundingClientRect().top;
  
    // Obtém a classe selecionada
    const classSelector = document.getElementById('class-selector');
    const selectedClass = classSelector.value;
  
    // Calcula as coordenadas normalizadas
    const coordinates = {
      xmin: startX / images[currentImageIndex].width,
      ymin: startY / images[currentImageIndex].height,
      xmax: (endX - startX) / images[currentImageIndex].width,
      ymax: (endY - startY) / images[currentImageIndex].height,
      class: selectedClass, // Associa a classe selecionada
    };
  
    // Adiciona ao array da imagem atual
    if (!coordinatesList[fileName]) {
      coordinatesList[fileName] = [];
    }
    coordinatesList[fileName].push(coordinates);
  
    // Atualiza o desenho
    drawImage(images[currentImageIndex]);
    drawSavedCoordinates();
  });   

  document.getElementById('next-button').addEventListener('click', function () {
    if (currentImageIndex < images.length - 1) {
      currentImageIndex++;
      fileName = input.files[currentImageIndex].name;
      drawImage(images[currentImageIndex]);
      textFileName.innerText = fileName;
      loadCoordinatesForImage(fileName);
    }
  });

  document.getElementById('prev-button').addEventListener('click', function () {
    if (currentImageIndex > 0) {
      currentImageIndex--;
      fileName = input.files[currentImageIndex].name;
      drawImage(images[currentImageIndex]);
      textFileName.innerText = fileName;
      loadCoordinatesForImage(fileName);
    }
  });

  document.getElementById('next-save').addEventListener('click', function () {
    const datasetFormat = document.getElementById('dataset-format').value;

    if (datasetFormat === 'yolo') {
      saveAllYOLOFormats();
    } else if (datasetFormat === 'json') {
      if (fileName && lastCoordinatesList) {
        saveJSONFormat(fileName, coordinatesList[fileName]);
        showAlert('Arquivo JSON salvo com sucesso!');
      }
    }
  });

  function saveAllYOLOFormats() {
    Object.keys(coordinatesList).forEach((fileName, index) => {
      const coords = coordinatesList[fileName];
      if (coords) {
        const classIndex = index;
        const yoloData = `${classIndex} ${(coords.xmin + coords.xmax / 2).toFixed(6)} ${(coords.ymin + coords.ymax / 2).toFixed(6)} ${coords.xmax.toFixed(6)} ${coords.ymax.toFixed(6)}\n`;
        downloadFile(`${fileName.replace(/\.[^/.]+$/, '')}.txt`, yoloData);
      }
    });
    showAlert('Arquivos YOLO salvos com sucesso!');
  }

  function saveJSONFormat(fileName, coords) {
    if (coords) {
      const jsonData = JSON.stringify(coords, null, 2);
      downloadFile(`${fileName.replace(/\.[^/.]+$/, '')}_annotations.json`, jsonData);
    }
  }

  function downloadFile(filename, data) {
    const blob = new Blob([data], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  document.addEventListener('mousemove', handleMouseMove);

  document.getElementById('prev-clipboard').addEventListener('click', function (event) {
    event.preventDefault();

    const datasetFormat = document.getElementById('dataset-format').value;
    let dataToCopy;

    if (datasetFormat === 'json') {
      dataToCopy = JSON.stringify(coordinatesList, null, 2);
    } else if (datasetFormat === 'yolo') {
      dataToCopy = Object.keys(coordinatesList).map((fileName, index) => {
        const coords = coordinatesList[fileName];
        const classIndex = index;
        return `${classIndex} ${(coords.xmin + coords.xmax / 2).toFixed(6)} ${(coords.ymin + coords.ymax / 2).toFixed(6)} ${coords.xmax.toFixed(6)} ${coords.ymax.toFixed(6)}`;
      }).join('\n');
    }

    navigator.clipboard.writeText(dataToCopy).then(function () {
      showAlert('Dataset copiado para a área de transferência!');
    }).catch(function (err) {
      console.error('Falha ao copiar dataset: ', err);
    });
  });

  function loadCoordinatesForImage(fileName) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawImage(images[currentImageIndex]);
    if (coordinatesList[fileName]) {
      drawSavedCoordinates();
    }
  }

  function showAlert(message) {
    const alertBox = document.createElement('div');
    alertBox.textContent = message;
    alertBox.style.position = 'fixed';
    alertBox.style.bottom = '20px';
    alertBox.style.right = '20px';
    alertBox.style.padding = '10px';
    alertBox.style.backgroundColor = '#28a745';
    alertBox.style.color = '#fff';
    alertBox.style.borderRadius = '5px';
    alertBox.style.zIndex = '9999';

    document.body.appendChild(alertBox);

    setTimeout(() => {
      alertBox.remove();
    }, 3000);
  }
});
