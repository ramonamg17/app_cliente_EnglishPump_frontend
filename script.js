// script.js

let dates = {};
let selectedDate = null;
let selectedCardId = null;
let currentClassifications = [];
let currentRecallStatus = false;
let currentCardDates = [];

// A variável 'cards' é declarada em 'common.js' e compartilhada entre os arquivos

// Função para carregar todos os cards do servidor
function loadAllCards(date) {
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
                    classifications: card.classifications || [],
                    recall:card.recall
                };

                // Popula as datas com os IDs dos cards relacionados
                cards[card.id].dates.forEach(date => {
                    if (!dates[date]) dates[date] = [];
                    dates[date].push(card.id);
                });
            });

            // Define o dia atual como o dia selecionado
            const today = new Date();
            if (date){
                selectedDate = date;
            }else{
                selectedDate = formatDate(today);
            }

            // Renderiza o calendário e carrega os cards do dia atual
            renderCalendar();
            loadCards(selectedDate);
        })
        .catch(error => console.error('Erro ao carregar cards:', error));
}

// Função para abrir o modal (adicionar ou editar)
function openModal(mode, id) {
    document.querySelector('.sidebar').classList.add('desactived');
    document.getElementById("modal").style.display = "flex";

    window.modalMode = mode; // 'add' ou 'edit'
    window.selectedCardId = id || null;

    const modalTitleText = document.getElementById("modal-title-text");
    const deleteButton = document.getElementById("delete-card-button");

    if (mode === 'add') {
        modalTitleText.textContent = "Add Card";
        document.getElementById("card-title").value = "";
        document.getElementById("card-content").value = "";
        currentClassifications = [];
        document.getElementById("classifications-labels").innerHTML = "";
        document.getElementById("classification-input").value = "";
        deleteButton.style.display = "none";

        currentRecallStatus = false;
        currentCardDates = [];
        updateRecallButtonUI();
        updateCardRecallsUI();
    } else if (mode === 'edit') {
        modalTitleText.textContent = "Edit Card";
        const card = cards[id];
        document.getElementById("card-title").value = card.title;
        document.getElementById("card-content").value = card.content;
        currentClassifications = card.classifications.slice();
        const labelsContainer = document.getElementById("classifications-labels");
        labelsContainer.innerHTML = "";
        currentClassifications.forEach(classification => {
            addClassificationLabel(classification, 'classifications-labels');
        });
        document.getElementById("classification-input").value = "";
        deleteButton.style.display = "inline-block";
        currentRecallStatus = card.recall || false;
        currentCardDates = card.dates ? card.dates.slice() : [];
        updateRecallButtonUI();
        updateCardRecallsUI();
    }

    setupClassificationInput('classification-input', 'classifications-labels', 'add-classification-btn', 'classification-field');
    setupClassificationAutocomplete('classification-input');
}


// Função para fechar o modal
function closeModal() {
    document.getElementById("modal").style.display = "none";
    document.querySelector('.sidebar').classList.remove('desactived');
    window.modalMode = null;
    window.selectedCardId = null;
}

//função para (des)ativar o recall 
function toggleRecalls() {
    currentRecallStatus = !currentRecallStatus;
    updateRecallButtonUI();

    if (currentRecallStatus) {
        if (window.modalMode === 'add') {
            // Usa selectedDate como data inicial ao adicionar um novo card
            
            let initialDate = selectedDate;
            // let initialDate = formatDate(new Date());
            let today = formatDate(new Date()); // Pega a data de hoje

            // Verifica se selectedDate é anterior a hoje
            if (selectedDate < today) {
                initialDate = today; // Define initialDate como hoje
            }
            currentCardDates = [
                initialDate,
                getNextDate(initialDate, 1),
                getNextDate(initialDate, 2),
                getNextDate(initialDate, 7),
                getNextDate(initialDate, 21),
                getNextDate(initialDate, 30),
                getNextDate(initialDate, 60),
                getNextDate(initialDate, 90),
            ];
        } else if (window.modalMode === 'edit') {
            // Reintroduz o card no mapeamento 'dates' usando as datas existentes
            currentCardDates.forEach(date => {
                if (!dates[date]) dates[date] = [];
                if (!dates[date].includes(window.selectedCardId)) {
                    dates[date].push(window.selectedCardId);
                }
            });
        }
    } else {
        if (window.modalMode === 'edit') {
            // Remove o card do mapeamento 'dates', mas mantém as datas no card
            currentCardDates.forEach(date => {
                if (dates[date]) {
                    dates[date] = dates[date].filter(id => id !== window.selectedCardId);
                    if (dates[date].length === 0) delete dates[date];
                }
            });
        }
        // Em modo 'add', as datas já não estão no mapeamento 'dates'
    }

    updateCardRecallsUI();
}



//Atualiza a aparência dos botões relacionados ao recall com base no estado atual.
function updateRecallButtonUI() {
    const recall_button = document.getElementById("recall-button");
    const card_recalls = document.getElementById("card-recalls");
    const recall_button_restart = document.getElementById("card-recalls-restart");

    if (currentRecallStatus) {
        recall_button.classList.add('actived');
        card_recalls.classList.remove('off');
        recall_button_restart.classList.remove('desactived');
    } else {
        recall_button.classList.remove('actived');
        card_recalls.classList.add('off');
        recall_button_restart.classList.add('desactived');
    }
}

//Atualiza os ícones que representam as datas de recall no modal
function updateCardRecallsUI() {
    const card_recalls_div = document.querySelector('.card-recalls > div:first-child');
    card_recalls_div.innerHTML = ''; // Limpa os ícones existentes
    
    if (!currentCardDates || currentCardDates.length === 0) return;

    const today = formatDate(new Date());
    currentCardDates.forEach(date => {
        const icon = document.createElement('i');
        if (date < today) {
            icon.className = 'fa-regular fa-circle-check';
        } else {
            icon.className = 'fa-regular fa-circle';
        }
        card_recalls_div.appendChild(icon);
    });
}



//função para restar do recall 
function RestartRecalls() {

    const confirmation = confirm("Tem certeza de que recomeçar o recall? Esta ação não pode ser desfeita.");

    if (!confirmation) {
        return;
    }

    const today = formatDate(new Date());
    currentCardDates = [
        today,
        getNextDate(today, 1),
        getNextDate(today, 2),
        getNextDate(today, 7),
        getNextDate(today, 21),
        getNextDate(today, 30),
        getNextDate(today, 60),
        getNextDate(today, 90),
    ];

    updateCardRecallsUI();
    saveCard(true)
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



// // Função para adicionar um card
// function addCard(event) {
//     if (event) event.preventDefault();

//     const title = document.getElementById("card-title").value.trim();
//     const content = document.getElementById("card-content").value.trim();
//     const classifications = currentClassifications;

//     if (!title) {
//         alert("Por favor, preencha todos os campos");
//         return;
//     }

//     // Assegura que selectedDate esteja definido
//     const today = new Date();
//     if (!selectedDate) {
//         selectedDate = formatDate(today);
//     }

//     const newCard = {
//         title: title,
//         content: content,
//         dates: [
//             selectedDate,
//             getNextDate(selectedDate, 1),
//             getNextDate(selectedDate, 2),
//             getNextDate(selectedDate, 7),
//             getNextDate(selectedDate, 21),
//             getNextDate(selectedDate, 30),
//             getNextDate(selectedDate, 60),
//             getNextDate(selectedDate, 90),
//         ],
//         classifications: classifications
//     };

//     fetch(`${apiBaseUrl}/cards`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(newCard),
//         mode: 'cors',
//     })
//     .then(response => {
//         if (!response.ok) {
//             throw new Error(`Erro na resposta do servidor: ${response.status} ${response.statusText}`);
//         }
//         return response.json();
//     })
//     .then(data => {
//         if (!data || !data.id) {
//             throw new Error('Resposta do servidor inválida. Dados retornados: ' + JSON.stringify(data));
//         }

//         // Atualiza os dados localmente sem alterar `selectedDate`
//         cards[data.id] = data;
//         data.dates.forEach(date => {
//             if (!dates[date]) dates[date] = [];
//             dates[date].push(data.id);
//         });

//         closeModal();
//         loadCards(selectedDate);
//         updateCalendarMarks();
//     })
//     .catch(error => {
//         console.error('Erro ao adicionar card:', error);
//         alert('Erro ao adicionar card: ' + error.message);
//     });
// }

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
        // Como o card está em 'dates', o 'recall' já é true
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
        cardEl.onclick = () => openModal('edit', id);

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

// Função para salvar o card (adicionar ou editar)
function saveCard(close_modal) {
    const title = document.getElementById("card-title").value.trim();
    const content = document.getElementById("card-content").value.trim();
    const classifications = currentClassifications;

    if (!title) {
        alert("Por favor, preencha todos os campos");
        return;
    }

    if (window.modalMode === 'add') {
        const newCard = {
            title: title,
            content: content,
            classifications: classifications,
            recall: currentRecallStatus,
            dates: currentCardDates.slice()
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

            // Atualiza os dados localmente
            cards[data.id] = data;

            if (currentRecallStatus) {
                data.dates.forEach(date => {
                    if (!dates[date]) dates[date] = [];
                    dates[date].push(data.id);
                });
            } 
            
           
            
            closeModal();
            loadAllCards(selectedDate)
            loadCards(selectedDate);
            updateCalendarMarks();
        })
        .catch(error => {
            console.error('Erro ao adicionar card:', error);
            alert('Erro ao adicionar card: ' + error.message);
        });
    } else if (window.modalMode === 'edit') {
        // Atualiza os dados do card localmente
        cards[window.selectedCardId].title = title;
        cards[window.selectedCardId].content = content;
        cards[window.selectedCardId].classifications = classifications;
        cards[window.selectedCardId].recall = currentRecallStatus;

        // Mantém as datas do card
        cards[window.selectedCardId].dates = currentCardDates.slice();

        // Remove o card das datas antigas no mapeamento 'dates'
        const oldDates = cards[window.selectedCardId].dates || [];
        oldDates.forEach(date => {
            if (dates[date]) {
                dates[date] = dates[date].filter(id => id !== window.selectedCardId);
                if (dates[date].length === 0) delete dates[date];
            }
        });

        if (currentRecallStatus) {
            // Adiciona o card às novas datas no mapeamento 'dates'
            cards[window.selectedCardId].dates.forEach(date => {
                if (!dates[date]) dates[date] = [];
                dates[date].push(window.selectedCardId);
            });
        } else {
            // Não remove as datas do card; apenas não o adiciona ao mapeamento 'dates'
        }

        // Envia as atualizações para o servidor
        fetch(`${apiBaseUrl}/cards/${window.selectedCardId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cards[window.selectedCardId])
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao salvar edições do card');
            }
            return response.json();
        })
        .then(() => {
            // Atualiza a interface com os dados editados
            if(!close_modal){
                closeModal();
            }
            loadAllCards(selectedDate)
            loadCards(selectedDate);
            updateCalendarMarks();
        })
        .catch(error => console.error('Erro ao salvar edições do card:', error));
    }
}




// Função para apagar o card
function deleteCard() {
    const confirmation = confirm("Tem certeza de que deseja excluir este card? Esta ação não pode ser desfeita.");

    if (!confirmation) {
        return;
    }

    fetch(`${apiBaseUrl}/cards/${window.selectedCardId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao deletar card');
        }
        const card = cards[window.selectedCardId];

        // Remove o card de todas as datas relacionadas localmente
        card.dates.forEach(date => {
            if (dates[date]) {
                dates[date] = dates[date].filter(id => id !== window.selectedCardId);
                if (dates[date].length === 0) delete dates[date];
            }
        });

        // Remove o card do objeto cards
        delete cards[window.selectedCardId];

        // Fecha o modal e recarrega a interface
        closeModal();
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
    const title = document.getElementById("card-title").value.trim();
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
    const title = document.getElementById("card-title").value.trim();
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
