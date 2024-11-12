// cards.js

let dates = {};
let selectedDate = null;
let selectedCardId = null;
let currentClassifications = [];
let currentRecallStatus = false;
let currentCardDates = [];

// Definir as classificações fixas
const fixedClassifications = ['ALL', 'INBOX', 'grammar', 'pronunciation', 'vocabulary', 'listening'];

// Função para carregar todos os cards do servidor
function loadAllCards() {
    return fetch(`${apiBaseUrl}/cards`)
        .then(response => response.json())
        .then(data => {
            // Limpa o objeto de cards
            cards = {};
            // Preenche o objeto de cards com os dados do servidor
            data.forEach(card => {
                cards[card.id] = {
                    id: card.id,
                    title: card.title,
                    content: card.content,
                    dates: card.dates || [],
                    classifications: card.classifications || [],
                    recall: card.recall || false
                };
            });

            // Renderiza a lista de cards
            renderCardsList();
            renderClassificationList();
        })
        .catch(error => console.error('Erro ao carregar cards:', error));
}

// Função para renderizar a lista de classificações
function renderClassificationList() {
    const classificationList = document.getElementById('classification-list');
    if (!classificationList) return;

    classificationList.innerHTML = '';

    // Obter todas as classificações existentes nos cards
    const allClassifications = getAllClassifications();

    // Combinar as classificações fixas com as classificações existentes (sem duplicatas)
    const classifications = [...new Set([...fixedClassifications, ...allClassifications])];

    // Filtrar as classificações com base na pesquisa
    const searchValue = document.getElementById('classification-search-input').value.toLowerCase();

    classifications.forEach(classification => {
        if (classification.toLowerCase().includes(searchValue)) {
            const count = Object.values(cards).filter(card => card.classifications.includes(classification)).length;

            const li = document.createElement('li');
            li.className = 'classification-item';

            // Contêiner para o nome da classificação
            const classificationText = document.createElement('span');
            classificationText.className = 'classification-text';
            classificationText.textContent = `${classification} (${count})`;
            classificationText.dataset.classificationName = classification; // Armazena o nome real

            // Eventos para clicar e editar o nome
            classificationText.onclick = () => filterCardsByClassification(classification);

            li.appendChild(classificationText);

            // Se a classificação não for fixa, adiciona os ícones de edição e exclusão
            if (!fixedClassifications.includes(classification)) {
                // Contêiner para os ícones de ação
                const actionsContainer = document.createElement('div');
                actionsContainer.className = 'classification-actions';

                // Ícone de edição
                const editIcon = document.createElement('i');
                editIcon.className = 'fa-solid fa-edit classification-icon';
                editIcon.onclick = (event) => {
                    event.stopPropagation();
                    enableClassificationEditing(classificationText);
                };

                // Ícone de lixeira
                const deleteIcon = document.createElement('i');
                deleteIcon.className = 'fa-solid fa-trash classification-icon';
                deleteIcon.onclick = (event) => {
                    event.stopPropagation();
                    deleteClassification(classification);
                };

                actionsContainer.appendChild(editIcon);
                actionsContainer.appendChild(deleteIcon);

                li.appendChild(actionsContainer);
            }

            classificationList.appendChild(li);
        }
    });
}

// Função para filtrar os cards por classificação
function filterCardsByClassification(classification) {
    const filteredCards = Object.values(cards).filter(card => {
        if (classification === 'ALL') {
            return true; // Exibe todos os cards
        }
        return card.classifications && card.classifications.includes(classification);
    });
    renderCardsList(filteredCards);
}

// Função para renderizar a lista de cards
function renderCardsList(cardsToRender = Object.values(cards)) {
    const cardContainer = document.getElementById("card-container");
    cardContainer.innerHTML = "";

    // Obter o valor da pesquisa de cards
    const searchValue = document.getElementById('card-search-input').value.toLowerCase();

    cardsToRender.forEach(card => {
        // Filtrar os cards com base na pesquisa
        if (
            card.title.toLowerCase().includes(searchValue) ||
            card.content.toLowerCase().includes(searchValue) ||
            card.classifications.some(c => c.toLowerCase().includes(searchValue))
        ) {
            const cardEl = document.createElement("div");
            cardEl.className = "card";

            // Criar as labels de classificações
            const classificationsEl = document.createElement("div");
            classificationsEl.className = "card-classifications";

            if (card.classifications) {
                card.classifications.forEach(classification => {
                    const label = document.createElement("span");
                    label.className = "classification-label";
                    label.textContent = classification;
                    classificationsEl.appendChild(label);
                });
            }
            cardEl.appendChild(classificationsEl);

            const titleEl = document.createElement("h4");
            titleEl.textContent = card.title;

            const contentEl = document.createElement("p");
            contentEl.textContent = card.content;

            cardEl.appendChild(titleEl);
            cardEl.appendChild(contentEl);

            // Torna o card clicável para edição
            cardEl.onclick = () => openModal('edit', card.id);

            // Adiciona o card ao contêiner
            cardContainer.appendChild(cardEl);
        }
    });
}

// Função para abrir o modal de adicionar classificação
function openAddClassificationModal() {
    document.getElementById('add-classification-modal').style.display = 'flex';
}

// Função para fechar o modal de adicionar classificação
function closeAddClassificationModal() {
    document.getElementById('add-classification-modal').style.display = 'none';
    document.getElementById('new-classification-name').value = '';
}

// Função para adicionar uma nova classificação
function addClassification() {
    const newClassification = document.getElementById('new-classification-name').value.trim();
    if (!newClassification) {
        alert('Por favor, insira um nome para a classificação.');
        return;
    }

    if (fixedClassifications.includes(newClassification)) {
        alert('Essa classificação já existe como fixa.');
        return;
    }

    // Verifica se a classificação já existe
    const existingClassifications = getAllClassifications();
    if (existingClassifications.includes(newClassification)) {
        alert('Essa classificação já existe.');
        return;
    }

    // Adicionar a nova classificação à lista (não salva no servidor porque as classificações são derivadas dos cards)
    // Você pode implementar um sistema de classificações separadas se desejar

    // Fecha o modal e atualiza a lista de classificações
    closeAddClassificationModal();
    renderClassificationList();
}

// Eventos de pesquisa
document.getElementById('classification-search-input').addEventListener('input', renderClassificationList);
document.getElementById('card-search-input').addEventListener('input', () => renderCardsList());

// Outras funções necessárias (como openModal, saveCard, deleteCard) podem ser copiadas ou adaptadas de script.js

// Exemplo da função openModal adaptada
function openModal(mode, id) {
    // Implementação semelhante ao script.js, ajustada conforme necessário
    // ...
}

// Carrega todos os cards ao iniciar
document.addEventListener("DOMContentLoaded", function() {
    loadAllCards()
        .catch(error => console.error('Erro ao inicializar a página:', error));
});

