// script.js

let dates = {};
let selectedDate = null;
let selectedCardId = null;
let currentClassifications = [];

// A variável 'cards' é declarada em 'common.js' e compartilhada entre os arquivos

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

// Função para abrir o modal de adicionar card
function openModal() {
    document.getElementById("modal").style.display = "flex";
    // Limpa os campos anteriores
    document.getElementById("card-title").value = "";
    document.getElementById("card-content").value = "";
    currentClassifications = []; // Reinicia as classificações

    // Limpa as labels de classificações
    document.getElementById("classifications-labels").innerHTML = "";

    // Limpa o campo de input de classificação
    document.getElementById("classification-input").value = "";

    setupClassificationInput('classification-input', 'classifications-labels', 'add-classification-btn', 'classification-field');
    setupClassificationAutocomplete('classification-input');
}

// Função para fechar o modal de adicionar card
function closeModal() {
    document.getElementById("modal").style.display = "none";
}

// Função para abrir o modal de edição do card
function openEditModal(id) {
    selectedCardId = id;
    const card = cards[id];

    document.getElementById("edit-title").value = card.title;
    document.getElementById("edit-content").value = card.content;

    currentClassifications = card.classifications.slice();

    const labelsContainer = document.getElementById("edit-classifications-labels");
    labelsContainer.innerHTML = "";

    currentClassifications.forEach(classification => {
        addClassificationLabel(classification, 'edit-classifications-labels');
    });

    document.getElementById("edit-classification-input").value = "";

    setupClassificationInput('edit-classification-input', 'edit-classifications-labels', 'edit-add-classification-btn', 'edit-classification-field');
    setupClassificationAutocomplete('edit-classification-input');

    document.getElementById("edit-modal").style.display = "flex";
}

// Função para fechar o modal de edição do card
function closeEditModal() {
    document.getElementById("edit-modal").style.display = "none";
}

// Função para adicionar uma label de classificação
function addClassificationLabel(classification, labelsContainerId) {
    // Só adiciona à lista se ainda não estiver presente
    if (!currentClassifications.includes(classification)) {     
        currentClassifications.push(classification);
    }

    const labelsContainer = document.getElementById(labelsContainerId);

    // Verifica se a label já existe no container para evitar duplicatas visuais
    const existingLabels = labelsContainer.querySelectorAll('.classification-label');
    for (let label of existingLabels) {
        if (label.firstChild.textContent === classification) {
            return; // Label já existe no container, não precisa adicionar novamente
        }
    }

    const label = document.createElement('span');
    label.className = 'classification-label';
    label.textContent = classification;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-classification-btn';
    removeBtn.innerHTML = '&times;';
    removeBtn.onclick = function() {
        labelsContainer.removeChild(label);
        currentClassifications = currentClassifications.filter(c => c !== classification);
    };

    label.appendChild(removeBtn);
    labelsContainer.appendChild(label);
}


function setupClassificationInput(inputId, labelsContainerId, buttonId, suggestionsContainerId) {
    const input = document.getElementById(inputId);
    if (!input) {
        console.error(`Elemento com ID ${inputId} não encontrado em setupClassificationInput.`);
        return;
    }
    const button = document.getElementById(buttonId);
    if (!button) {
        console.error(`Botão com ID ${buttonId} não encontrado em setupClassificationInput.`);
        return;
    }
    input.setAttribute('data-labels-container-id', labelsContainerId);
    input.setAttribute('data-suggestions-container-id', suggestionsContainerId);

    function addClassificationFromInput() {
        if (input.value.trim() !== '') {
            addClassificationLabel(input.value.trim(), labelsContainerId);
            input.value = '';
        }
    }

    input.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            addClassificationFromInput();
        }
    });

    button.addEventListener('click', function(event) {
        event.preventDefault();
        addClassificationFromInput();
    });
}

// Função para configurar o autocomplete das classificações
function setupClassificationAutocomplete(inputId) {
    const input = document.getElementById(inputId);
    if (!input) {
        console.error(`Elemento com ID ${inputId} não encontrado em setupClassificationAutocomplete.`);
        return;
    }
    const existingClassifications = getAllClassifications();

    function showSuggestionsOnEvent() {
        const value = input.value.trim().toLowerCase();
        const suggestions = existingClassifications.filter(c => c.toLowerCase().includes(value));
        showSuggestions(input, suggestions);
    }

    // Show suggestions when input is focused
    input.addEventListener("focus", showSuggestionsOnEvent);

    // Show suggestions when input value changes
    input.addEventListener("input", showSuggestionsOnEvent);
}

// Função para mostrar as sugestões de classificações
function showSuggestions(input, suggestions) {
    // Get the suggestions container ID from the data attribute
    const suggestionsContainerId = input.getAttribute('data-suggestions-container-id');
    const suggestionsContainer = document.getElementById(suggestionsContainerId);

    // Remove previous suggestions
    suggestionsContainer.innerHTML = '';

    if (suggestions.length === 0) return;

    const suggestionsDiv = document.createElement("div");
    suggestionsDiv.className = "suggestions";

    suggestions.forEach(suggestion => {
        const suggestionDiv = document.createElement("div");
        suggestionDiv.textContent = suggestion;

        // Define behavior when clicking on a suggestion
        suggestionDiv.onclick = () => {
            addClassificationLabel(suggestion, input.getAttribute('data-labels-container-id'));
            input.value = '';
            suggestionsContainer.innerHTML = ''; // Remove suggestions after selection
        };

        suggestionsDiv.appendChild(suggestionDiv);
    });

    suggestionsContainer.appendChild(suggestionsDiv);

    // Add event listener to hide suggestions when clicking outside
    document.addEventListener('click', function hideSuggestions(event) {
        if (!suggestionsContainer.contains(event.target) && event.target !== input) {
            suggestionsContainer.innerHTML = '';
            document.removeEventListener('click', hideSuggestions);
        }
    });
}



// Função para adicionar um card
function addCard(event) {
    if (event) event.preventDefault();

    const title = document.getElementById("card-title").value.trim();
    const content = document.getElementById("card-content").value.trim();
    const classifications = currentClassifications;

    if (!title) {
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
            getNextDate(selectedDate, 2),
            getNextDate(selectedDate, 7),
            getNextDate(selectedDate, 21),
            getNextDate(selectedDate, 30),
            getNextDate(selectedDate, 60),
            getNextDate(selectedDate, 90),
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

// Variáveis para o calendário
const monthYear = document.getElementById("month-year");
const calendarGrid = document.getElementById("calendar-grid");

let currentDate = new Date();
let selectedDayDiv = null;

// Função para renderizar o calendário
function renderCalendar() {
    calendarGrid.innerHTML = `
        <div class="day-name">Sun</div>
        <div class="day-name">Mon</div>
        <div class="day-name">Tue</div>
        <div class="day-name">Wed</div>
        <div class="day-name">Thu</div>
        <div class="day-name">Fri</div>
        <div class="day-name">Sat</div>
    `;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    monthYear.textContent = currentDate.toLocaleDateString("en", { month: "long", year: "numeric" });

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

// Função para atualizar as marcações do calendário
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
    const cardContainer = document.getElementById("card-container");
    cardContainer.innerHTML = "";

    const cardIds = dates[date] || [];

    cardIds.forEach(id => {
        const card = cards[id];
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

        // Torna o card clicável
        cardEl.onclick = () => openEditModal(id);

        // Adiciona o card ao contêiner
        cardContainer.appendChild(cardEl);
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

// Função para salvar as edições do card
function saveEdit() {
    const newTitle = document.getElementById("edit-title").value.trim();
    const newContent = document.getElementById("edit-content").value.trim();
    const classifications = currentClassifications;

    if (!newTitle) {
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

// Inicializa a página ao carregar
document.addEventListener("DOMContentLoaded", function() {
    loadAllCards()
        .catch(error => console.error('Erro ao inicializar a página:', error));
});

// Como removemos o código que fecha o modal ao clicar fora, não precisamos mais do manipulador de eventos 'window.onclick'
