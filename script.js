// script.js

let dates = {};
let selectedDate = null;
let selectedCardId = null;

// Função para carregar todos os cards do servidor
function loadAllCards() {
    return fetch(`${apiBaseUrl}/cards`)
        .then(response => response.json())
        .then(data => {
            // Limpa o conteúdo atual de cards e dates
            cards = {};
            dates = {};

            // Preenche cards e dates com os dados do servidor
            data.forEach(card => {
                // Assegura que card.dates é um array
                cards[card.id] = {
                    id: card.id,
                    title: card.title,
                    content: card.content,
                    dates: card.dates || [],
                    classifications: card.classifications || []
                };

                // Popula as datas com os IDs dos cards relacionados
                cards[card.id].dates.forEach(date => {
                    if (!dates[date]) dates[date] = [];
                    dates[date].push(card.id);
                });
            });

            // Define o dia atual como o dia selecionado
            const today = new Date();
            selectedDate = formatDate(today);

            // Renderiza o calendário e carrega os cards do dia atual
            renderCalendar();
            loadCards(selectedDate);
        })
        .catch(error => console.error('Erro ao carregar cards:', error));
}

// Função para abrir o modal
function openModal() {
    document.getElementById("modal").style.display = "flex";
    // Limpa os campos anteriores
    document.getElementById("card-title").value = "";
    document.getElementById("card-content").value = "";
    document.getElementById("classifications-container").innerHTML = `
        <div class="classification-input">
            <input type="text" class="classification-field" placeholder="Classification">
            <button type="button" class="add-classification-btn" onclick="addClassificationInput()">
                <i class="fa-solid fa-plus"></i>
            </button>
        </div>
    `;
    setupClassificationAutocomplete();
}

// Função para fechar o modal
function closeModal() {
    document.getElementById("modal").style.display = "none";
}

// Função para abrir o modal de adicionar classificação (opcional, se desejar)
function addClassificationInput(containerId = 'edit-classifications-container') {
    const container = document.getElementById(containerId);
    const classificationInput = document.createElement("div");
    classificationInput.className = "classification-input";
    classificationInput.innerHTML = `
        <input type="text" class="classification-field" placeholder="Classification">
        <button type="button" class="remove-classification-btn" onclick="removeClassificationInput(this)">
            <i class="fa-solid fa-minus"></i>
        </button>
    `;
    container.insertBefore(classificationInput, container.lastElementChild);
    setupClassificationAutocomplete();
}

// Função para remover um campo de classificação
function removeClassificationInput(button) {
    const inputDiv = button.parentElement;
    inputDiv.remove();
}

// Função para configurar o autocomplete das classificações
function setupClassificationAutocomplete() {
    const classificationFields = document.querySelectorAll(".classification-field");
    const existingClassifications = getAllClassifications();

    classificationFields.forEach(input => {
        input.addEventListener("input", function() {
            const value = this.value.trim().toLowerCase();
            const suggestions = existingClassifications.filter(c => c.toLowerCase().includes(value));
            showSuggestions(this, suggestions);
        });
    });
}

// Função para mostrar as sugestões
function showSuggestions(input, suggestions) {
    // Remove sugestões anteriores
    const existingSuggestions = input.parentElement.querySelector(".suggestions");
    if (existingSuggestions) existingSuggestions.remove();

    if (suggestions.length === 0) return;

    const suggestionsDiv = document.createElement("div");
    suggestionsDiv.className = "suggestions";

    suggestions.forEach(suggestion => {
        const suggestionDiv = document.createElement("div");
        suggestionDiv.textContent = suggestion;
        suggestionDiv.onclick = () => {
            input.value = suggestion;
            suggestionsDiv.remove();
        };
        suggestionsDiv.appendChild(suggestionDiv);
    });

    input.parentElement.appendChild(suggestionsDiv);
}

// Função para adicionar um card
function addCard(event) {
    if (event) event.preventDefault();

    const title = document.getElementById("card-title").value.trim();
    const content = document.getElementById("card-content").value.trim();
    const classificationFields = document.querySelectorAll(".classification-field");
    const classifications = Array.from(classificationFields).map(input => input.value.trim()).filter(value => value);

    if (!title || !content) {
        alert("Por favor, preencha todos os campos");
        return;
    }

    // Assegura que selectedDate esteja definido
    if (!selectedDate) {
        const today = new Date();
        selectedDate = formatDate(today);
    }

    const newCard = {
        title: title,
        content: content,
        dates: [
            selectedDate,
            getNextDate(selectedDate, 1),
            getNextDate(selectedDate, 2)
        ],
        classifications: classifications
    };

    fetch(`${apiBaseUrl}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCard),
        mode: 'cors',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro na resposta do servidor: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data || !data.id) {
            throw new Error('Resposta do servidor inválida. Dados retornados: ' + JSON.stringify(data));
        }

        // Atualiza os dados localmente sem alterar `selectedDate`
        cards[data.id] = data;
        data.dates.forEach(date => {
            if (!dates[date]) dates[date] = [];
            dates[date].push(data.id);
        });

        closeModal();
        loadCards(selectedDate);
        updateCalendarMarks();
    })
    .catch(error => {
        console.error('Erro ao adicionar card:', error);
        alert('Erro ao adicionar card: ' + error.message);
    });
}

// Função auxiliar para obter a próxima data
function getNextDate(dateString, days) {
    const [year, month, day] = dateString.split('-').map(Number);
    const currentDate = new Date(year, month - 1, day);
    currentDate.setDate(currentDate.getDate() + days);
    return formatDate(currentDate);
}

// Função para formatar a data no formato YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês começa em 0
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Fecha o modal ao clicar fora do conteúdo
window.onclick = function(event) {
    if (event.target === document.getElementById("modal")) {
        closeModal();
    }
};

const monthYear = document.getElementById("month-year");
const calendarGrid = document.getElementById("calendar-grid");

let currentDate = new Date();
let selectedDayDiv = null;

function renderCalendar() {
    calendarGrid.innerHTML = `
        <div class="day-name">Dom</div>
        <div class="day-name">Seg</div>
        <div class="day-name">Ter</div>
        <div class="day-name">Qua</div>
        <div class="day-name">Qui</div>
        <div class="day-name">Sex</div>
        <div class="day-name">Sáb</div>
    `;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    monthYear.textContent = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Cria os dias em branco até o primeiro dia do mês
    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyDiv = document.createElement("div");
        calendarGrid.appendChild(emptyDiv);
    }

    // Renderiza os dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("day");
        dayDiv.textContent = day;

        // Formata a data para comparação e manipulação
        const formattedDate = formatDate(new Date(year, month, day));

        // Aplica as classes 'today' e 'selected' conforme necessário na inicialização
        if (formattedDate === selectedDate) {
            dayDiv.classList.add("today", "selected");
            selectedDayDiv = dayDiv;
        } else if (formattedDate === formatDate(new Date())) {
            dayDiv.classList.add("today");
        }

        // Adiciona evento de clique para selecionar o dia
        dayDiv.addEventListener("click", () => {
            if (selectedDayDiv) selectedDayDiv.classList.remove("selected");
            dayDiv.classList.add("selected");
            selectedDayDiv = dayDiv;
            selectedDate = formattedDate;
            loadCards(selectedDate);
            updateCalendarMarks(); // Atualiza as marcações sem recriar o calendário
        });

        calendarGrid.appendChild(dayDiv);
    }

    // Configura as marcações iniciais (bolinhas e destaques)
    updateCalendarMarks();
}

function updateCalendarMarks() {
    const todayFormatted = formatDate(new Date());

    // Encontrar o máximo de cards em um único dia para normalização
    const maxCardsInADay = Math.max(...Object.values(dates).map(ids => ids.length), 1);

    // Percorre cada dia no calendário e aplica as marcações corretas
    calendarGrid.querySelectorAll('.day').forEach(dayDiv => {
        const day = parseInt(dayDiv.textContent);
        if (isNaN(day)) return; // Ignora os espaços vazios

        const formattedDate = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));

        const cardCount = dates[formattedDate] ? dates[formattedDate].length : 0;

        // Verifica se o dia tem cards
        if (cardCount > 0) {
            dayDiv.classList.add("has-card");

            // Calcula a opacidade com base na quantidade de cards
            const opacity = calculateOpacity(cardCount, maxCardsInADay);

            // Aplica a opacidade à bolinha usando estilo inline
            dayDiv.style.setProperty('--dot-opacity', opacity);
        } else {
            dayDiv.classList.remove("has-card");
            dayDiv.style.removeProperty('--dot-opacity');
        }

        // Atualiza a classe 'today' para o dia atual
        dayDiv.classList.toggle("today", formattedDate === todayFormatted);

        // Atualiza a classe 'selected' para o dia selecionado
        dayDiv.classList.toggle("selected", formattedDate === selectedDate);
    });
}

// Função para calcular a opacidade com base na quantidade de cards
function calculateOpacity(cardCount, maxCards) {
    const minOpacity = 0.3; // Opacidade mínima (mais transparente)
    const maxOpacity = 1;   // Opacidade máxima (mais opaca)

    // Evita divisão por zero
    if (maxCards === 1) {
        return maxOpacity;
    }

    // Normaliza a opacidade com base no número de cards
    const opacity = minOpacity + ((cardCount - 1) / (maxCards - 1)) * (maxOpacity - minOpacity);
    return opacity;
}

// Função para carregar os cards relacionados à data selecionada
function loadCards(date) {
    const column1 = document.getElementById("column1");
    const column2 = document.getElementById("column2");
    column1.innerHTML = "";
    column2.innerHTML = "";

    const cardIds = dates[date] || [];
    let column1Height = 0;
    const maxHeight = window.innerHeight * 0.8;

    cardIds.forEach(id => {
        const card = cards[id];
        const cardEl = document.createElement("div");
        cardEl.className = "card btn";

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

        // Torna o card clicável
        cardEl.onclick = () => openEditModal(id);

        // Adiciona o card na coluna apropriada
        if (column1Height + cardEl.offsetHeight <= maxHeight) {
            column1.appendChild(cardEl);
            column1Height += cardEl.offsetHeight + 10;
        } else {
            column2.appendChild(cardEl);
        }
    });
}

// Funções de navegação do calendário
function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

// Função para alternar o blur nas descrições dos cards
function toggleBlur() {
    const descriptions = document.querySelectorAll('.card p');
    descriptions.forEach(description => {
        description.classList.toggle('visible'); // Adiciona ou remove a classe 'visible'
    });
}

// Função para abrir o modal de edição
function openEditModal(id) {
    selectedCardId = id; // Define o ID do card selecionado
    const card = cards[id];

    // Preenche o modal com as informações do card
    document.getElementById("edit-title").value = card.title;
    document.getElementById("edit-content").value = card.content;

    // Limpa as classificações anteriores
    const container = document.getElementById("edit-classifications-container");
    container.innerHTML = '';

    // Adiciona os campos de classificação
    card.classifications.forEach(classification => {
        const classificationInput = document.createElement("div");
        classificationInput.className = "classification-input";
        classificationInput.innerHTML = `
            <input type="text" class="classification-field" value="${classification}" placeholder="Classification">
            <button type="button" class="remove-classification-btn" onclick="removeClassificationInput(this)">
                <i class="fa-solid fa-minus"></i>
            </button>
        `;
        container.appendChild(classificationInput);
    });

    // Adiciona um botão para adicionar novas classificações
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "add-classification-btn";
    addButton.onclick = () => addClassificationInput('edit-classifications-container');
    addButton.innerHTML = '<i class="fa-solid fa-plus"></i>';

    container.appendChild(addButton);

    setupClassificationAutocomplete();

    // Exibe o modal
    document.getElementById("edit-modal").style.display = "flex";
}

// Função para fechar o modal de edição
function closeEditModal() {
    document.getElementById("edit-modal").style.display = "none";
}

// Função para salvar as edições do card
function saveEdit() {
    const newTitle = document.getElementById("edit-title").value.trim();
    const newContent = document.getElementById("edit-content").value.trim();
    const classificationFields = document.querySelectorAll("#edit-classifications-container .classification-field");
    const classifications = Array.from(classificationFields).map(input => input.value.trim()).filter(value => value);

    if (!newTitle || !newContent) {
        alert("Por favor, preencha todos os campos");
        return;
    }

    // Atualiza os dados do card localmente
    cards[selectedCardId].title = newTitle;
    cards[selectedCardId].content = newContent;
    cards[selectedCardId].classifications = classifications;

    // Envia as atualizações para o servidor
    fetch(`${apiBaseUrl}/cards/${selectedCardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cards[selectedCardId])
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao salvar edições do card');
        }
        return response.json();
    })
    .then(() => {
        // Atualiza a interface com os dados editados
        closeEditModal();
        loadCards(selectedDate);
        updateCalendarMarks();
    })
    .catch(error => console.error('Erro ao salvar edições do card:', error));
}

// Função para apagar o card
function deleteCard() {
    const confirmation = confirm("Tem certeza de que deseja excluir este card? Esta ação não pode ser desfeita.");

    if (!confirmation) {
        return;
    }

    // Envia a requisição DELETE para o servidor usando o ID correto
    fetch(`${apiBaseUrl}/cards/${selectedCardId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao deletar card');
        }
        const card = cards[selectedCardId];

        // Remove o card de todas as datas relacionadas localmente
        card.dates.forEach(date => {
            dates[date] = dates[date].filter(id => id !== selectedCardId);
            if (dates[date].length === 0) delete dates[date];
        });

        // Remove o card do objeto cards
        delete cards[selectedCardId];

        // Fecha o modal e recarrega a interface
        closeEditModal();
        loadCards(selectedDate);
        updateCalendarMarks();
    })
    .catch(error => console.error('Erro ao excluir card:', error));
}

// Funções para pesquisa externa (opcionais)
function searchGoogleImages(title) {
    const query = encodeURIComponent(title);
    const url = `https://www.google.com/search?tbm=isch&q=${query}`;
    window.open(url, '_blank');
}

function searchGoogleImagesFromModal() {
    const title = document.getElementById("edit-title").value.trim();
    if (!title) {
        alert("Por favor, insira um título para pesquisar no Google Imagens.");
        return;
    }
    searchGoogleImages(title);
}

function openYouglish(title) {
    const query = encodeURIComponent(title);
    const url = `https://youglish.com/pronounce/${query}/english`;
    window.open(url, '_blank');
}

function openYouglishFromModal() {
    const title = document.getElementById("edit-title").value.trim();
    if (!title) {
        alert("Por favor, insira um título para pesquisar no YouGlish.");
        return;
    }
    openYouglish(title);
}

// Função para obter todas as classificações existentes a partir dos cards
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

// Carrega todos os cards ao iniciar
document.addEventListener("DOMContentLoaded", function() {
    loadAllCards()
        .then(() => {
            setupClassificationAutocomplete();
        })
        .catch(error => console.error('Erro ao inicializar a página:', error));
});
