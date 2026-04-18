const selectedSection = document.querySelector('.selected-section');
const btnClearAll = document.querySelector('.btn-clear-all');
const canvasBody = document.querySelector('.canvas-body');

// Variable pour savoir quel bloc on modifie
let activeNode = null;

function selectNode(node) {
  // 1. On retire l'apparence "sélectionnée" de l'ancien bloc s'il existe
  if (activeNode) {
    activeNode.classList.remove('selected');
  }

  // 2. On définit le nouveau bloc actif
  activeNode = node;
  activeNode.classList.add('selected');

  // 3. On extrait les données du bloc pour les envoyer au menu "Selected"
  const title = node.querySelector('.node-title').innerText;
  const chance = node.querySelector('.node-chance-badge').innerText;
  const cost = node.querySelector('.node-cost-badge').innerText.replace(" Divines", "");
  const notes = node.dataset.notes || "";

  // On récupère les outcomes existants du bloc
  const outcomes = [];
  node.querySelectorAll('.node-outcome').forEach(out => {
    outcomes.push({
      color: out.querySelector('.node-outcome-color').style.backgroundColor,
      label: out.querySelector('.node-outcome-label').innerText,
      percent: out.querySelector('.node-outcome-percent').innerText.replace("%", "")
    });
  });

  // 4. On met à jour le menu latéral avec ces infos
  updateSidebarFromNode(title, chance, cost, outcomes, notes);
}

function updateSidebarFromNode(title, chance, cost, outcomes, notes) {
  // On génère le HTML des outcomes pour la sidebar
  let outcomesHTML = outcomes.map((out, index) => `
    <div class="main-box-out">
      <div class="out-row">
        <div class="out-container"><span class="out-label">OUT ${index + 1}</span></div>
        <div class="out-container-title">
          <input type="text" class="out-input-title" value="${out.label}"/>
        </div>
        <div class="out-container-percent">
          <input type="number" class="out-input-percent" value="${out.percent}" min="0" max="100"/>
          <span class="percent-symbol">%</span>
        </div>
        <div class="out-container-color">
          <input type="color" class="out-input-color" value="${rgbToHex(out.color)}"/>
        </div>
      </div>
    </div>
  `).join('');

  selectedSection.innerHTML = `
    <div class="selected-label">Selected</div>
    <div class="selected-details">
        <div class="selected-title">${title}</div>
        <input type="text" class="selected-input-title" value="${title}" />
        <div class="chance-row">
          <div class="chance-container">
              <span class="chance">Reach chance:</span>
              <input type="text" class="chance-input" value="${chance}" />
          </div>
          <button class="btn-add-item">+ item</button>
        </div>
        <div class="selected-cost">Estimated cost (from prices)</div>
        <input type="text" class="selected-input-cost" value="${cost}" />
        <div class="selected-notes">Notes</div>
        <textarea class="selected-input-notes">${notes}</textarea>
      <div class="selected-main-box">
        <div class="main-box-title">OUTCOMES (Label + % + Color)</div>
        <div id="outcomes-wrapper">${outcomesHTML}</div>
      </div>
      <div class="btn-outcome">
        <button class="btn-outcome-action btn-duplicate">Duplicate</button>
        <button class="btn-outcome-action btn-delete">Delete</button>
      </div>
    </div>
  `;
  selectedSection.classList.add('active');
}

// Petite fonction utilitaire pour convertir les couleurs du canvas en Hexadécimal pour l'input color
function rgbToHex(rgb) {
  if (!rgb.startsWith('rgb')) return rgb;
  const vals = rgb.match(/\d+/g);
  return "#" + vals.map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

// Fonction pour synchroniser les outcomes du menu vers le bloc canvas
function syncCanvasOutcomes() {
  if (!activeNode) return;
  const wrapper = document.getElementById('outcomes-wrapper');
  const canvasOutcomesList = activeNode.querySelector('.node-outcomes');
  const sidebarOuts = wrapper.querySelectorAll('.main-box-out');
  
  let html = '';
  sidebarOuts.forEach((out) => {
    const title = out.querySelector('.out-input-title').value;
    const color = out.querySelector('.out-input-color').value;
    const percent = out.querySelector('.out-input-percent').value || "0"; // Récupère le %
    
    html += `
      <div class="node-outcome" style="position: relative;">
        <span class="node-outcome-color" style="background-color: ${color};"></span>
        <span class="node-outcome-label">${title}</span>
        <span class="node-outcome-percent">${percent}%</span>
        <div class="port port-out"></div>
      </div>
    `;
  });
  canvasOutcomesList.innerHTML = html;
}

// --- CRÉATION D'UN NODE ---
document.querySelector('.btn-node').addEventListener('click', () => {
  const newNode = document.createElement('div');
  newNode.className = 'canvas-node';
  
  // On ajoute le resize-handle tout à la fin du bloc
  newNode.innerHTML = `

    <div class="port port-in"></div>

    <div class="node-header">
      <span class="node-title">Nouveau Step</span>
      <div style="display: flex; align-items: center;">
        <span class="node-chance-badge">100%</span>
        <span class="node-cost-badge">0 Divines </span>
        <button class="btn-node-done">Done</button>
        <button class="btn-node-close">&#x2715;</button>
      </div>
    </div>
    <div class="node-outcomes">
      <div class="node-outcome">
        <span class="node-outcome-color" style="background-color: #58a6ff;"></span>
        <span class="node-outcome-label">Outcome 1 title</span>
        <span class="node-outcome-percent">0%</span>
        <div class="port port-out"></div>
      </div>
    </div>
    
    <div class="node-resize-handle"></div>
  `;

  // Écouteur pour sélectionner le bloc quand on clique dessus
  newNode.addEventListener('mousedown', () => {
    selectNode(newNode);
  });

  // On active les deux fonctionnalités : Déplacement ET Redimensionnement
  makeDraggable(newNode);
  makeResizable(newNode); 

  canvasBody.appendChild(newNode);
  
  // On le sélectionne automatiquement à la création
  selectNode(newNode); 
});

// --- ÉCOUTE DES MODIFICATIONS (INPUT) ---
document.addEventListener('input', (e) => {
  if (!activeNode) return;

  // Sync Notes (Sauvegarde invisible dans la "mémoire" du bloc)
  if (e.target.classList.contains('selected-input-notes')) {
    activeNode.dataset.notes = e.target.value;
  }

  // Sync Titre
  if (e.target.classList.contains('selected-input-title')) {
    activeNode.querySelector('.node-title').innerText = e.target.value;
  }
  // Sync Chance
  if (e.target.classList.contains('chance-input')) {
    activeNode.querySelector('.node-chance-badge').innerText = e.target.value;
  }
  // Sync Outcomes (Titre ou Couleur)
  if (e.target.classList.contains('out-input-title') || e.target.classList.contains('out-input-color')) {
    syncCanvasOutcomes();
  }

  // Sync Prix
  if (e.target.classList.contains('selected-input-cost')) {
    activeNode.querySelector('.node-cost-badge').innerText = e.target.value + " Divines";
  }
  
// --- CORRECTION : On vérifie la limite D'ABORD, on synchronise ENSUITE ---
  if (e.target.classList.contains('out-input-percent')) {
    
    // 1. On corrige la valeur si elle dépasse
    let value = parseInt(e.target.value);
    if (!isNaN(value)) {
      if (value > 100) e.target.value = 100;
      else if (value < 0) e.target.value = 0;
    }
    
    // 2. Maintenant que la valeur est propre (capée à 100), on l'envoie au canvas !
    syncCanvasOutcomes();
  }
});

// --- DUPLICATE / DELETE ---
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-duplicate')) {
    const wrapper = document.getElementById('outcomes-wrapper');
    const newIndex = wrapper.querySelectorAll('.main-box-out').length + 1;

    const newOutBox = document.createElement('div');
    newOutBox.className = 'main-box-out';
    newOutBox.innerHTML = `
      <div class="out-row">
        <div class="out-container"><span class="out-label">OUT ${newIndex}</span></div>
        <div class="out-container-title"><input type="text" class="out-input-title" placeholder="Outcome ${newIndex}" value="Outcome ${newIndex}"/></div>
        <div class="out-container-percent">
          <input type="number" class="out-input-percent" placeholder="0" min="0" max="100"/>
          <span class="percent-symbol">%</span>
        </div>
        <div class="out-container-color"><input type="color" class="out-input-color" value="#58a6ff"/></div>
      </div>
    `;
    wrapper.appendChild(newOutBox);
    syncCanvasOutcomes(); // Met à jour le bloc canvas
  }

  if (e.target.classList.contains('btn-node-done')) {
    e.target.classList.toggle('validated'); // Alterne entre gris et vert
  }

  if (e.target.classList.contains('btn-delete')) {
    const wrapper = document.getElementById('outcomes-wrapper');
    const outs = wrapper.querySelectorAll('.main-box-out');
    if (outs.length > 1) {
      outs[outs.length - 1].remove();
      syncCanvasOutcomes(); // Met à jour le bloc canvas
    }
  }

  if (e.target.classList.contains('btn-node-close')) {
    const nodeToDelete = e.target.closest('.canvas-node');
    if (!nodeToDelete) return;

    // 1. On coupe et supprime tous les fils reliés à ce bloc !
    connections = connections.filter(conn => {
      // Si le port de départ ou d'arrivée appartient à ce bloc...
      if (nodeToDelete.contains(conn.startPort) || nodeToDelete.contains(conn.endPort)) {
        conn.line.remove(); // On efface la ligne du canvas SVG
        return false;       // On la retire de notre mémoire
      }
      return true;          // Sinon on la garde
    });

    // 2. Si le bloc supprimé était celui sélectionné dans la barre latérale, on vide la barre
    if (activeNode === nodeToDelete) {
      clearSelection();
    }

    // 3. Enfin, on détruit le bloc lui-même
    nodeToDelete.remove();
  }

// --- OUVERTURE DE LA POP-UP + ITEM ---
  if (e.target.classList.contains('btn-add-item')) {
    // 1. On crée le fond sombre
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
// 2. On insère le code HTML de la pop-up à l'intérieur
    overlay.innerHTML = `
      <div class="item-modal">
        <div class="item-modal-header">
          <span>Add New Item</span>
          <button class="btn-close-modal">&#x2715;</button>
        </div>
        <div class="item-modal-body">
          
          <div class="modal-row">
            <div class="modal-input-container" style="flex: 2;">
              <span class="modal-label">Item</span>
              <input type="text" class="modal-input" placeholder="Nom de l'item..." />
            </div>
            <div class="modal-input-container" style="flex: 1;">
              <span class="modal-label">Qty</span>
              <input type="number" class="modal-input" placeholder="1" min="1" />
            </div>
          </div>

          <div class="modal-row" style="margin-top: 10px;">
            <div class="modal-input-container" style="flex: 1;">
              <span class="modal-label">Unit Price</span>
              <input type="number" class="modal-input" placeholder="0" min="0" step="0.1" />
            </div>
            <div class="modal-input-container" style="flex: 1;">
              <span class="modal-label">Currency</span>
              <select class="modal-select">
                <option value="Chaos">Chaos</option>
                <option value="Divine">Divine</option>
                <option value="Exalted">Exalted</option>
              </select>
            </div>
            <button class="btn-modal-add">ADD</button>
          </div>

        </div>
      </div>
    `;

    // 3. On ajoute la fonctionnalité pour fermer en cliquant sur la croix
    overlay.querySelector('.btn-close-modal').addEventListener('click', () => {
      overlay.remove();
    });

    // 4. On ajoute la fonctionnalité pour fermer en cliquant à côté de la modale (dans le vide)
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        overlay.remove();
      }
    });

    // 5. On affiche le tout par-dessus la page
    document.body.appendChild(overlay);
  }

  // --- VALIDATION DE LA POP-UP (+ ITEM) ---
  if (e.target.classList.contains('btn-modal-add')) {
    if (!activeNode) return; // Sécurité : il faut qu'un bloc soit sélectionné

    const modal = e.target.closest('.item-modal');
    const inputs = modal.querySelectorAll('.modal-input');
    const select = modal.querySelector('.modal-select');

    // On récupère les valeurs tapées par l'utilisateur
    const itemName = inputs[0].value.trim();
    const qty = inputs[1].value || "1";
    const price = inputs[2].value || "0";
    const currency = select.value;

    // Si le champ nom est vide, on arrête là
    if (!itemName) return; 

    // 1. On cherche si le bloc possède déjà une zone pour les items, sinon on la crée
    let itemsList = activeNode.querySelector('.node-items-list');
    if (!itemsList) {
      itemsList = document.createElement('div');
      itemsList.className = 'node-items-list';
      
      // On l'insère juste avant la zone des outcomes
      const outcomesNode = activeNode.querySelector('.node-outcomes');
      activeNode.insertBefore(itemsList, outcomesNode);
    }

    // 2. On crée la nouvelle ligne avec nos deux pilules
    const itemRow = document.createElement('div');
    itemRow.className = 'node-item-row';
    itemRow.innerHTML = `
      <div class="node-item-pill">
        <span>${itemName}</span>
        <span class="node-item-highlight">x${qty}</span>
      </div>
      <div class="node-item-pill">
        <span class="node-item-highlight">${price}</span>
        <span class="node-item-currency">${currency}</span>
      </div>
    `;
    
    // 3. On ajoute la ligne au bloc
    itemsList.appendChild(itemRow);

    // 4. On ferme la modale
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.remove();

    // 5. Comme le bloc vient de s'agrandir vers le bas, on met à jour les lignes SVG !
    updateAllLines();
  }
});

// --- FONCTION POUR DÉPLACER LES BLOCS (DRAG & DROP) ---
function makeDraggable(element) {
  let isDragging = false;
  let startX, startY, initialX, initialY;

  // On utilise uniquement le bandeau du haut comme "poignée"
  const dragHandle = element.querySelector('.node-header');

  dragHandle.addEventListener('mousedown', (e) => {
    // Si on clique sur un bouton ou un input (même dans le header), on annule le drag
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;

    isDragging = true;
    
    // On enregistre la position de départ de la souris
    startX = e.clientX;
    startY = e.clientY;
    
    // On enregistre la position de départ du bloc (offsetLeft/Top par rapport au canvas)
    initialX = element.offsetLeft;
    initialY = element.offsetTop;

    // On attache les événements de mouvement et de relâchement sur tout le document
    // (Ainsi, si la souris bouge très vite et sort du bloc, on ne perd pas le contrôle)
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  function onMouseMove(e) {
    if (!isDragging) return;

    // On calcule la distance parcourue par la souris
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // On applique cette distance à la position initiale du bloc
    element.style.left = (initialX + dx) + 'px';
    element.style.top = (initialY + dy) + 'px';

    updateAllLines();
  }

  function onMouseUp() {
    // On arrête le drag et on nettoie les écouteurs d'événements
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
}

// --- FONCTION POUR REDIMENSIONNER LES BLOCS ---
function makeResizable(element) {
  const resizer = element.querySelector('.node-resize-handle');
  let isResizing = false;
  let startX, startY, startWidth, startHeight;

  resizer.addEventListener('mousedown', (e) => {
    e.stopPropagation(); // Très important : empêche le drag & drop de s'activer
    isResizing = true;
    
    startX = e.clientX;
    startY = e.clientY;
    
    // On récupère la taille actuelle du bloc
    const rect = element.getBoundingClientRect();
    startWidth = rect.width;
    startHeight = rect.height;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  function onMouseMove(e) {
    if (!isResizing) return;
    
    // On calcule la nouvelle taille
    const newWidth = startWidth + (e.clientX - startX);
    const newHeight = startHeight + (e.clientY - startY);
    
    // On applique des limites pour ne pas que le bloc devienne minuscule
    if (newWidth > 200) element.style.width = newWidth + 'px';
    if (newHeight > 100) element.style.minHeight = newHeight + 'px';

    updateAllLines();
  }

  function onMouseUp() {
    isResizing = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
}

btnClearAll.addEventListener('click', () => {
  clearSelection();
  canvasBody.innerHTML = '';
  activeNode = null;
});

function clearSelection() {
  selectedSection.innerHTML = `<div class="selected-label">Selected</div><div class="selected-hint">Select a node.</div>`;
  selectedSection.classList.remove('active');
  activeNode = null;
}

// --- SYSTÈME DE CONNEXION ENTRE LES BLOCS ---

let connections = []; // Mémoire de tous les liens créés
let isDrawing = false;
let currentLine = null;
let startPort = null;

// On crée le canvas SVG s'il n'existe pas encore
function getSvgCanvas() {
  let svg = document.getElementById('svg-canvas');
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "svg-canvas";
    canvasBody.appendChild(svg);
  }
  return svg;
}

// 1. On commence à tirer un fil
document.addEventListener('mousedown', (e) => {
  if (e.target.classList.contains('port-out')) {
    e.stopPropagation(); // Empêche le drag du bloc
    isDrawing = true;
    startPort = e.target;
    
    const svg = getSvgCanvas();
    
    // On crée une nouvelle ligne (chemin SVG)
    currentLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    currentLine.setAttribute('stroke', '#58a6ff'); // Couleur du lien
    currentLine.setAttribute('stroke-width', '2');
    currentLine.setAttribute('fill', 'none');
    currentLine.classList.add('node-connection');
    
    svg.appendChild(currentLine);
  }
});

// 2. On dessine la courbe pendant qu'on bouge la souris
document.addEventListener('mousemove', (e) => {
  if (isDrawing && currentLine) {
    const canvasRect = canvasBody.getBoundingClientRect();
    const startRect = startPort.getBoundingClientRect();
    
    // Position de départ (centre du port-out)
    const startX = startRect.left + (startRect.width / 2) - canvasRect.left;
    const startY = startRect.top + (startRect.height / 2) - canvasRect.top;
    
    // Position d'arrivée (sous la souris)
    const endX = e.clientX - canvasRect.left;
    const endY = e.clientY - canvasRect.top;

    // Formule mathématique pour une belle courbe de Bézier (S-curve)
    const cp = Math.abs(endX - startX) / 1.5; 
    const pathData = `M ${startX} ${startY} C ${startX + cp} ${startY}, ${endX - cp} ${endY}, ${endX} ${endY}`;
    
    currentLine.setAttribute('d', pathData);
  }
});

// 3. On lâche la souris pour connecter (ou annuler)
document.addEventListener('mouseup', (e) => {
  if (isDrawing) {
    // Si on a relâché sur un port d'entrée valide
    if (e.target.classList.contains('port-in')) {
      const endPort = e.target;
      
      const finishedLine = currentLine;
      // On sauvegarde la connexion pour qu'elle suive les blocs plus tard !
      connections.push({
        line: currentLine,
        startPort: startPort,
        endPort: endPort
      });

      // On ajoute la fonction de suppression par double-clic !
      finishedLine.addEventListener('dblclick', function() {
        // 1. On supprime visuellement la ligne du canvas
        this.remove();
        
        // 2. On l'efface de notre mémoire (le tableau connections) 
        // pour que le programme arrête d'essayer de la faire bouger
        connections = connections.filter(conn => conn.line !== this);
      });
      
    } else {
      // Raté ! On a relâché dans le vide, on supprime la ligne
      currentLine.remove();
    }
    
    isDrawing = false;
    currentLine = null;
    startPort = null;
  }
});

// Fonction pour recalculer les positions de toutes les lignes (appelée quand on déplace un bloc)
function updateAllLines() {
  const canvasRect = canvasBody.getBoundingClientRect();
  
  connections.forEach(conn => {
    // Si un des blocs a été supprimé, la ligne se supprime
    if (!conn.startPort.isConnected || !conn.endPort.isConnected) {
      conn.line.remove();
      return;
    }

    const startRect = conn.startPort.getBoundingClientRect();
    const endRect = conn.endPort.getBoundingClientRect();
    
    const startX = startRect.left + (startRect.width / 2) - canvasRect.left;
    const startY = startRect.top + (startRect.height / 2) - canvasRect.top;
    
    const endX = endRect.left + (endRect.width / 2) - canvasRect.left;
    const endY = endRect.top + (endRect.height / 2) - canvasRect.top;

    const cp = Math.abs(endX - startX) / 1.5; 
    const pathData = `M ${startX} ${startY} C ${startX + cp} ${startY}, ${endX - cp} ${endY}, ${endX} ${endY}`;
    
    conn.line.setAttribute('d', pathData);
  });
}

