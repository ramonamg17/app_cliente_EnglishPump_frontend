// cards.js

let selectedClassification = 'ALL';
let isSelectionMode = false;
let selectedCards = new Set();

// Função para carregar todos os cards do servidor
function loadAllCards() {
    return fetch(`${apiBaseUrl}/cards`)
        .then(response => response.json())
        .then(data => {
            cards = {};
            dates = {};

            data.forEach(card => {
                cards[card.id] = {
                    id: card.id,
                    title: card.title,
                    content: card.content,
                    dates: card.dates || [],
                    classifications: card.classifications || [],
                    recall: card.recall || false
                };

                if (card.recall && card.dates && card.dates.length > 0) {
                    card.dates.forEach(date => {
                        if (!dates[date]) dates[date] = [];
                        dates[date].push(card.id);
                    });
                }
            });

       
        })
        .catch(error => console.error('Erro ao carregar cards:', error));
}



// Função para renderizar a lista de classificações
function renderClassificationList() {
    const classificationList = document.getElementById('classification-list');
    if (!classificationList) return;

    classificationList.innerHTML = '';

    // Obter todas as classificações existentes nos cards
    const allClassifications = getAllClassifications().map(c => c.trim());

    // Combinar as classificações fixas com as existentes (sem duplicatas)
    let classifications = [...new Set([...fixedClassifications.map(c => c.trim()), ...allClassifications])];
    classifications = sortClassifications(classifications);

    // Obter o valor da pesquisa
    const searchValue = document.getElementById('classification-search-input').value.toLowerCase();

    // Sempre adicionar "ALL" como o primeiro item
    const totalCards = Object.keys(cards).length;

    const liAll = document.createElement('li');
    liAll.className = 'classification-item';

    if (selectedClassification === 'all') {
        liAll.classList.add('selected');
    }

    const classificationTextAll = document.createElement('span');
    classificationTextAll.className = 'classification-text';
    classificationTextAll.textContent = `ALL (${totalCards})`;
    classificationTextAll.dataset.classificationName = 'all';

    liAll.onclick = () => filterCardsByClassification('all');

    liAll.appendChild(classificationTextAll);

    classificationList.appendChild(liAll);

    // Adicionar "RECALL" como o segundo item
    const cardsWithRecall = Object.values(cards).filter(card => card.recall);
    const countRecall = cardsWithRecall.length;

    const liRecall = document.createElement('li');
    liRecall.className = 'classification-item';

    if (selectedClassification === 'recall') {
        liRecall.classList.add('selected');
    }

    const classificationTextRecall = document.createElement('span');
    classificationTextRecall.className = 'classification-text';
    classificationTextRecall.textContent = `RECALL (${countRecall})`;
    classificationTextRecall.dataset.classificationName = 'recall';

    liRecall.onclick = () => filterCardsByClassification('recall');

    liRecall.appendChild(classificationTextRecall);

    classificationList.appendChild(liRecall);

    // Renderizar as demais classificações
    classifications.forEach(classification => {
        const normalizedClassification = classification.trim().toLowerCase();
        if (
            normalizedClassification.includes(searchValue) &&
            normalizedClassification !== 'all' &&
            normalizedClassification !== 'recall' &&
            normalizedClassification !== 'no_classification'
        ) {
            const count = Object.values(cards).filter(card => card.classifications && card.classifications.some(c => c.trim().toLowerCase() === normalizedClassification)).length;

            const li = document.createElement('li');
            li.className = 'classification-item';

            if (selectedClassification === normalizedClassification) {
                li.classList.add('selected');
            }

            const classificationText = document.createElement('span');
            classificationText.className = 'classification-text';
            classificationText.textContent = `${classification} (${count})`;
            classificationText.dataset.classificationName = classification;

            li.appendChild(classificationText);

            li.onclick = () => filterCardsByClassification(classification);

            // Contêiner para os ícones de ação
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'classification-actions';

            if (!fixedClassifications.includes(classification) && selectedClassification === normalizedClassification) {
                // Ícone de edição
                const editIcon = document.createElement('i');
                editIcon.className = 'fa-solid fa-edit classification-icon';
                editIcon.onclick = (event) => {
                    event.stopPropagation();
                    enableClassificationEditing(classificationText);
                };

                // Ícone de exclusão
                const deleteIcon = document.createElement('i');
                deleteIcon.className = 'fa-solid fa-trash classification-icon';
                deleteIcon.onclick = (event) => {
                    event.stopPropagation();
                    deleteClassification(classification);
                };

                actionsContainer.appendChild(editIcon);
                actionsContainer.appendChild(deleteIcon);
            }

            // Apenas anexar actionsContainer se tiver filhos
            if (actionsContainer.children.length > 0) {
                li.appendChild(actionsContainer);
            }

            classificationList.appendChild(li);
        }
    });

    // Adicionar "No Classification" como o último item
    const cardsWithoutClassification = Object.values(cards).filter(card => !card.classifications || card.classifications.length === 0);
    const countNoClassification = cardsWithoutClassification.length;

    const liNoClassification = document.createElement('li');
    liNoClassification.className = 'classification-item';

    if (selectedClassification === 'no_classification') {
        liNoClassification.classList.add('selected');
    }

    const classificationTextNoClassification = document.createElement('span');
    classificationTextNoClassification.className = 'classification-text';
    classificationTextNoClassification.textContent = `NO CLASSIFICATION (${countNoClassification})`;
    classificationTextNoClassification.dataset.classificationName = 'no_classification';

    liNoClassification.onclick = () => filterCardsByClassification('no_classification');

    liNoClassification.appendChild(classificationTextNoClassification);

    classificationList.appendChild(liNoClassification);
}




// Função para filtrar os cards por classificação
function filterCardsByClassification(classification) {
    if (isSelectionMode) {
        toggleSelectionMode();
    }
    selectedClassification = classification.trim().toLowerCase(); // Normaliza a classificação selecionada

    const filteredCards = getFilteredCards();
    renderCardsList(filteredCards);
    renderClassificationList(); // Atualiza a lista de classificações para refletir a seleção
}





// Função para renderizar a lista de cards
function renderCardsList(cardsToRender = getFilteredCards()) {
    const cardContainer = document.getElementById("card-container");
    cardContainer.innerHTML = "";

    // Obter o valor da pesquisa de cards
    const searchValue = document.getElementById('card-search-input').value.toLowerCase();

    // Ordenar os cards
    cardsToRender = cardsToRender.sort((a, b) => a.title.localeCompare(b.title));

    cardsToRender.forEach(card => {
        // Filtrar os cards com base na pesquisa
        if (
            card.title.toLowerCase().includes(searchValue) ||
            card.content.toLowerCase().includes(searchValue) ||
            (card.classifications && card.classifications.some(c => c.toLowerCase().includes(searchValue)))
        ) {
            const cardEl = document.createElement("div");
            cardEl.className = "card";

            // Se o card não tiver classificações, adiciona a classe 'no-classification'
            if (!card.classifications || card.classifications.length === 0) {
                cardEl.classList.add('no-classification');
            }

            // Se o modo de seleção estiver ativo, adicione a classe 'selectable'
            if (isSelectionMode) {
                cardEl.classList.add('selectable');
            }

            // Criar as labels de classificações
            const classificationsEl = document.createElement("div");
            classificationsEl.className = "card-classifications";

            if (card.classifications && card.classifications.length > 0) {
                // Ordena as classificações antes de criar as labels
                let sortedClassifications = sortClassifications(card.classifications);
                sortedClassifications.forEach(classification => {
                    const label = document.createElement("span");
                    label.className = "classification-label";
                    label.textContent = classification;
                    classificationsEl.appendChild(label);
                });
            }
            cardEl.appendChild(classificationsEl);

            // Adicionar o ícone de recall se o recall estiver ativo
            if (card.recall) {
                const recallIcon = document.createElement('i');
                recallIcon.className = 'fa-solid fa-dumbbell fa-sm recall-icon';
                recallIcon.setAttribute('title', 'Recall ativo');
                cardEl.appendChild(recallIcon);
            }

            const titleEl = document.createElement("h4");
            titleEl.textContent = card.title;

            const contentEl = document.createElement("p");
            contentEl.textContent = card.content;

            cardEl.appendChild(titleEl);
            cardEl.appendChild(contentEl);

            if (isSelectionMode) {
                // Adicionar um checkbox para seleção
                const selectCheckbox = document.createElement("input");
                selectCheckbox.type = "checkbox";
                selectCheckbox.className = "card-select-checkbox";
                selectCheckbox.dataset.cardId = card.id;

                // Se o card estiver selecionado, marca o checkbox
                if (selectedCards.has(card.id)) {
                    selectCheckbox.checked = true;
                }

                selectCheckbox.addEventListener('change', (event) => {
                    const cardId = event.target.dataset.cardId;
                    if (event.target.checked) {
                        selectedCards.add(cardId);
                    } else {
                        selectedCards.delete(cardId);
                    }

                    // Atualiza o estado do botão de exclusão
                    updateDeleteButtonState();
                });

                // Adiciona o checkbox ao card
                cardEl.appendChild(selectCheckbox);

                // Impede a abertura do modal ao clicar no card em modo de seleção
                cardEl.onclick = null;
            } else {
                // Torna o card clicável para edição
                cardEl.onclick = () => openModal('edit', card.id);
            }

            // Adiciona o card ao contêiner
            cardContainer.appendChild(cardEl);
        }
    });
}





//função que ativa e desativa o modo de seleção
function toggleSelectionMode() {
    document.getElementById('cards-selector').classList.toggle("actived");
    isSelectionMode = !isSelectionMode;

    // Limpa a seleção atual ao sair do modo de seleção
    if (!isSelectionMode) {
        selectedCards.clear();
    }

    // Atualiza a interface com os cards filtrados
    renderCardsList();
    toggleDeleteButton();

    // Alterna a visibilidade do botão de adicionar card
    toggleAddCardButton();
}


//função que retorna os cards filtrados com base em selectedClassification
function getFilteredCards() {
    const classification = selectedClassification.trim().toLowerCase();

    return Object.values(cards).filter(card => {
        if (classification === 'all') {
            return true; // Mostra todos os cards
        } else if (classification === 'no_classification') {
            return !card.classifications || card.classifications.length === 0;
        } else if (classification === 'recall') {
            return card.recall;
        }
        return card.classifications && card.classifications.some(c => c.trim().toLowerCase() === classification);
    });
}





// Função para abrir o modal de adicionar classificação
function openAddClassificationModal() {
    document.getElementById('add-classification-modal').style.display = 'flex';
}


//função que exclui os cards selecionados em lote
function deleteSelectedCards() {
    if (selectedCards.size === 0) {
        alert('No cards selected for deletion.');
        return;
    }

    const confirmation = confirm(`Are you sure you want to delete ${selectedCards.size} card(s)? This action cannot be undone.`);

    if (!confirmation) {
        return;
    }

    // Converte o Set em um array para iteração
    const cardsToDelete = Array.from(selectedCards);

    // Cria um array de promessas para aguardar todas as exclusões
    const deletePromises = cardsToDelete.map(cardId => {
        return fetch(`${apiBaseUrl}/cards/${cardId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error deleting card ${cardId}`);
            }
            // Remove o card do objeto cards
            delete cards[cardId];
        })
        .catch(error => {
            console.error(`Error deleting card ${cardId}:`, error);
            alert(`Error deleting card ${cardId}: ${error.message}`);
        });
    });

    // Aguarda todas as promessas serem resolvidas
    Promise.all(deletePromises)
        .then(() => {
            // Sai do modo de seleção
            isSelectionMode = false;
            selectedCards.clear();

            // Atualiza a interface
            renderCardsList();
            renderClassificationList();
            toggleDeleteButton();
            toggleAddCardButton();
        })
        .catch(error => {
            console.error('Error deleting selected cards:', error);
            alert('Error deleting selected cards. See console for details.');
        });
}

function toggleDeleteButton() {
    const deleteButton = document.getElementById('delete-selected-btn');
    if (isSelectionMode) {
        deleteButton.style.display = 'block';
    } else {
        deleteButton.style.display = 'none';
    }
}

function toggleAddCardButton() {
    const addButton = document.getElementById('add-card-btn');
    if (addButton) {
        if (isSelectionMode) {
            addButton.style.display = 'none';
        } else {
            addButton.style.display = 'block';
        }
    } else {
        console.error('Elemento com ID "add-card-btn" não encontrado no DOM.');
    }
}


function updateDeleteButtonState() {
    const deleteButton = document.getElementById('delete-selected-btn');
    if (selectedCards.size > 0) {
        deleteButton.classList.add('active');
    } else {
        deleteButton.classList.remove('active');
    }
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


// Função para abrir o modal (adicionar ou editar)
function openModal(mode, id) {
    document.body.classList.add('modal-open');
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
        // Define 'INBOX' como classificação padrão
        currentClassifications = ['INBOX'];
        document.getElementById("classifications-labels").innerHTML = "";
        
        // Adiciona a label 'INBOX' na interface
        addClassificationLabel('INBOX', 'classifications-labels');
        
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
        currentClassifications = sortClassifications(currentClassifications);
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

    setupClassificationInput('classification-input', 'classifications-labels', 'classification-field');
    setupClassificationAutocomplete('classification-input');
}


// Função para fechar o modal
function closeModal() {
    document.getElementById('overlay').style.display = 'none';
    document.body.classList.remove('modal-open');
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
            let today = formatDate(new Date()); // Pega a data de hoje
            let initialDate = selectedDate ? selectedDate : today; // Usa selectedDate se disponível, senão usa hoje

            // Verifica se initialDate é anterior a hoje
            if (initialDate < today) {
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
            // Se o card não tinha datas de recall, geramos as datas padrão
            if (!currentCardDates || currentCardDates.length === 0) {
                let today = formatDate(new Date());
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
            }
            // Reintroduz o card no mapeamento 'dates' usando as datas atuais
            currentCardDates.forEach(date => {
                if (!dates[date]) dates[date] = [];
                if (!dates[date].includes(window.selectedCardId)) {
                    dates[date].push(window.selectedCardId);
                }
            });
        }
    } else {
        if (window.modalMode === 'edit') {
            // Remove o card do mapeamento 'dates'
            currentCardDates.forEach(date => {
                if (dates[date]) {
                    dates[date] = dates[date].filter(id => id !== window.selectedCardId);
                    if (dates[date].length === 0) delete dates[date];
                }
            });
            // Esvazia o array 'currentCardDates'
            currentCardDates = [];
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

            if (!close_modal) {
                closeModal();
            }

            // Carrega os cards e atualiza a interface mantendo o filtro atual
            loadAllCards().then(() => {
                filterCardsByClassification(selectedClassification);
                renderClassificationList();
            });
        })
        .catch(error => {
            console.error('Erro ao adicionar card:', error);
            alert('Erro ao adicionar card: ' + error.message);
        });
    } else if (window.modalMode === 'edit') {
        const card = cards[window.selectedCardId];

        // Captura as datas antigas antes de atualizar
        const oldDates = card.dates ? card.dates.slice() : [];

        // Atualiza os dados do card localmente
        card.title = title;
        card.content = content;
        card.classifications = classifications;
        card.recall = currentRecallStatus;

        if (currentRecallStatus) {
            card.dates = currentCardDates.slice();
        } else {
            // Esvazia o array 'dates' do card
            card.dates = [];
        }

        // Remove o card das datas antigas no mapeamento 'dates'
        oldDates.forEach(date => {
            if (dates[date]) {
                dates[date] = dates[date].filter(id => id !== window.selectedCardId);
                if (dates[date].length === 0) delete dates[date];
            }
        });

        if (currentRecallStatus) {
            // Adiciona o card às novas datas no mapeamento 'dates'
            card.dates.forEach(date => {
                if (!dates[date]) dates[date] = [];
                if (!dates[date].includes(window.selectedCardId)) {
                    dates[date].push(window.selectedCardId);
                }
            });
        }

        // Envia as atualizações para o servidor
        fetch(`${apiBaseUrl}/cards/${window.selectedCardId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(card)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao salvar edições do card');
            }
            return response.json();
        })
        .then(() => {
            if (!close_modal) {
                closeModal();
            }

            // Carrega os cards e atualiza a interface mantendo o filtro atual
            loadAllCards().then(() => {
                filterCardsByClassification(selectedClassification);
                // renderClassificationList();
            });
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
        if (card.dates) {
            card.dates.forEach(date => {
                if (dates[date]) {
                    dates[date] = dates[date].filter(id => id !== window.selectedCardId);
                    if (dates[date].length === 0) delete dates[date];
                }
            });
        }

        // Remove o card do objeto cards
        delete cards[window.selectedCardId];

        // Fecha o modal e recarrega a interface
        closeModal();
        renderCardsList();
        renderClassificationList();
    })
    .catch(error => console.error('Erro ao excluir card:', error));
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


// Função para habilitar a edição do nome da classificação
function enableClassificationEditing(classificationTextElement) {
    const originalClassification = classificationTextElement.dataset.classificationName;
    const count = countCardsWithClassification(originalClassification);

    // Obter o elemento <li> pai
    const liElement = classificationTextElement.closest('li');
    if (liElement) {
        liElement.classList.add('editing');
    }

    // Criar um campo de entrada
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalClassification;
    input.className = 'classification-edit-input';

    // Impedir que o clique no input se propague para o elemento pai
    input.addEventListener('click', function(event) {
        event.stopPropagation();
    });

    // Substituir o elemento de texto pelo campo de entrada
    classificationTextElement.replaceWith(input);
    input.focus();

    // Evento ao pressionar Enter
    input.onkeypress = function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            input.blur();
        }
    };

    // Evento ao perder o foco
    input.onblur = function() {
        const newClassification = input.value.trim();

        // Remover a classe 'editing' do elemento <li>
        if (liElement) {
            liElement.classList.remove('editing');
        }

        if (newClassification === '') {
            alert('O nome da classificação não pode ser vazio.');
            // Restaurar o nome original
            cancelClassificationEditing(input, originalClassification, count);
            return;
        }

        if (newClassification !== originalClassification) {
            // Atualizar as classificações nos cards
            updateClassificationName(originalClassification, newClassification);
        }

        // Restaurar a exibição com o número de cards
        finishClassificationEditing(input, newClassification);
    };
}



// Função para cancelar a edição e restaurar o elemento original
function cancelClassificationEditing(inputElement, classificationName, count) {
    const classificationTextElement = document.createElement('span');
    classificationTextElement.className = 'classification-text';
    classificationTextElement.textContent = `${classificationName} (${count})`;
    classificationTextElement.dataset.classificationName = classificationName;
    classificationTextElement.onclick = () => filterCardsByClassification(classificationName);

    inputElement.replaceWith(classificationTextElement);
}

// Função para finalizar a edição e atualizar o elemento
function finishClassificationEditing(inputElement, newClassification) {
    const count = countCardsWithClassification(newClassification);

    const classificationTextElement = document.createElement('span');
    classificationTextElement.className = 'classification-text';
    classificationTextElement.textContent = `${newClassification} (${count})`;
    classificationTextElement.dataset.classificationName = newClassification;
    classificationTextElement.onclick = () => filterCardsByClassification(newClassification);

    inputElement.replaceWith(classificationTextElement);

    // Atualizar a interface
    renderCardsList();
    renderClassificationList();
}


// Função para atualizar o nome da classificação em todos os cards
function updateClassificationName(oldName, newName) {
    Object.values(cards).forEach(card => {
        if (card.classifications.includes(oldName)) {
            // Substituir o nome da classificação
            card.classifications = card.classifications.map(classification => {
                return classification === oldName ? newName : classification;
            });

            // Enviar a atualização para o servidor
            updateCardOnServer(card);
        }
    });

    // Atualizar a interface
    renderCardsList();
    renderClassificationList();
}

// Função para contar quantos cards possuem uma determinada classificação
function countCardsWithClassification(classification) {
    return Object.values(cards).filter(card => card.classifications.includes(classification)).length;
}

// Função para excluir uma classificação
function deleteClassification(classification) {
    const confirmation = confirm(`Você tem certeza que deseja excluir a classificação "${classification}"?`);

    if (!confirmation) {
        return;
    }

    // Verificar se há cards que possuem somente essa classificação
    const cardsWithOnlyThisClassification = Object.values(cards).filter(card => {
        return card.classifications.length === 1 && card.classifications.includes(classification);
    });

    if (cardsWithOnlyThisClassification.length > 0) {
        const deleteCardsConfirmation = confirm(`Existem ${cardsWithOnlyThisClassification.length} card(s) que possuem apenas essa classificação. Deseja excluí-los também?`);

        if (deleteCardsConfirmation) {
            // Excluir os cards que possuem somente essa classificação
            cardsWithOnlyThisClassification.forEach(card => {
                deleteCardById(card.id);
            });
        } else {
            // Remover a classificação desses cards, deixando-os sem classificação
            cardsWithOnlyThisClassification.forEach(card => {
                card.classifications = [];
                updateCardOnServer(card);
            });
        }
    }

    // Remover a classificação dos demais cards
    Object.values(cards).forEach(card => {
        if (card.classifications.includes(classification)) {
            card.classifications = card.classifications.filter(c => c !== classification);
            updateCardOnServer(card);
        }
    });

    // Atualizar a interface
    renderCardsList();
    renderClassificationList();
}

// Função para excluir um card pelo ID (sem prompt de confirmação)
function deleteCardById(cardId) {
    fetch(`${apiBaseUrl}/cards/${cardId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro ao deletar card ${cardId}`);
        }
        // Remover o card do objeto cards
        delete cards[cardId];
    })
    .catch(error => console.error('Erro ao excluir card:', error));
}

// Função para atualizar um card no servidor
function updateCardOnServer(card) {
    fetch(`${apiBaseUrl}/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card)
    })
    .catch(error => console.error(`Erro ao atualizar o card ${card.id}:`, error));
}



// Carrega todos os cards ao iniciar
// Carrega todos os cards ao iniciar
document.addEventListener("DOMContentLoaded", function() {
    loadAllCards()
        .then(() => {
            filterCardsByClassification(selectedClassification);
            // renderClassificationList();
        })
        .catch(error => console.error('Erro ao inicializar a página:', error));
});


