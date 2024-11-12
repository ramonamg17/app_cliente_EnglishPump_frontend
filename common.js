// URL base do servidor JSON (comando para ligar o servidor de desenvolvimento: json-server --watch db.json --port 3000)
const apiBaseUrl = 'http://localhost:3000';


// Objetos globais
let cards = {}; // Compartilhado entre os arquivos
let classifications = {}; // Compartilhado entre os arquivos

// Função para carregar todas as classificações existentes a partir dos cards
function getAllClassifications() {
    const classificationsSet = new Set();
    Object.values(cards).forEach(card => {
        if (card.classifications) {
            card.classifications.forEach(classification => {
                classificationsSet.add(classification);
            });
        }
    });
    return Array.from(classificationsSet).sort();
}

// Função para adicionar nova classificação (no modal em cards.html)
function addClassification() {
    const name = document.getElementById("classification-name").value.trim();
    if (!name) {
        alert("Por favor, insira um nome para a classificação.");
        return;
    }

    // Aqui você pode salvar a classificação em um endpoint específico, se desejar
    // Por enquanto, apenas fechamos o modal
    closeAddClassificationModal();
}

// Funções para abrir e fechar o modal de adicionar classificação
function openAddClassificationModal() {
    document.getElementById("add-classification-modal").style.display = "flex";
}

function closeAddClassificationModal() {
    document.getElementById("add-classification-modal").style.display = "none";
    document.getElementById("classification-name").value = '';
}

// Função para obter os cards filtrados por classificação
function filterCardsByClassification(classification) {
    const filteredCards = Object.values(cards).filter(card => {
        return card.classifications && card.classifications.includes(classification);
    });
    renderCardsList(filteredCards);
}

// Altura ajustável dos textareas
const textareas = document.querySelectorAll('textarea');

textareas.forEach(textarea => {
  textarea.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = `${this.scrollHeight}px`;
  });
});
