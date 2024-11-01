// cards.js

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
                    classifications: card.classifications || []
                };
            });

            // Renderiza a lista de cards
            renderCardsList();
            renderClassificationList();
        })
        .catch(error => console.error('Erro ao carregar cards:', error));
}

// Função para renderizar a lista de cards
function renderCardsList(cardsToRender = Object.values(cards)) {
    const cardsListContainer = document.querySelector('.cards-list');
    if (!cardsListContainer) return;

    cardsListContainer.innerHTML = ''; // Limpa a lista antes de carregar

    // Percorre os cards e os adiciona à lista
    cardsToRender.forEach(card => {
        const cardItem = document.createElement('div');
        cardItem.className = 'card-item';

        // Criar o contêiner para as labels de classificações
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

        // Criar o conteúdo do card
        const cardInfo = document.createElement("div");
        cardInfo.className = "card-info";
        cardInfo.appendChild(classificationsEl);

        const title = document.createElement("h4");
        title.textContent = card.title;

        const content = document.createElement("p");
        content.textContent = card.content;

        cardInfo.appendChild(title);
        cardInfo.appendChild(content);

        const cardActions = document.createElement("div");
        cardActions.className = "card-actions";

        const editButton = document.createElement("button");
        editButton.className = "edit-button btn";
        editButton.onclick = () => openEditModal(card.id);
        editButton.innerHTML = '<i class="fa-solid fa-edit"></i>';

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button btn";
        deleteButton.onclick = () => deleteCard(card.id);
        deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';

        cardActions.appendChild(editButton);
        cardActions.appendChild(deleteButton);

        cardItem.appendChild(cardInfo);
        cardItem.appendChild(cardActions);

        cardsListContainer.appendChild(cardItem);
    });
}

// Função para renderizar a lista de classificações
function renderClassificationList() {
    const classifications = getAllClassifications();
    const classificationList = document.getElementById('classification-list');
    if (!classificationList) return;

    classificationList.innerHTML = '';

     // Adicionar a opção "Todos" no topo da lista
     const count_all = Object.values(cards).length;
     const allLi = document.createElement('li');
     const allText = document.createElement('span');

     allText.className = 'classification-text';
     allText.textContent = `Todos (${count_all})`;
     allText.onclick = () => renderCardsList(); // Exibe todos os cards
     allLi.appendChild(allText);
     classificationList.appendChild(allLi);
 

    classifications.forEach(classification => {
        const count = Object.values(cards).filter(card => card.classifications.includes(classification)).length;

        const li = document.createElement('li');

        // Contêiner para o nome da classificação
        const classificationText = document.createElement('span');
        classificationText.className = 'classification-text';
        classificationText.textContent = `${classification} (${count})`;
        classificationText.dataset.classificationName = classification; // Armazena o nome real

        // Eventos para clicar e editar o nome
        classificationText.onclick = () => filterCardsByClassification(classification);

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

        li.appendChild(classificationText);
        li.appendChild(actionsContainer);

        classificationList.appendChild(li);
    });
}



// Função para filtrar os cards por classificação
function filterCardsByClassification(classification) {
    const filteredCards = Object.values(cards).filter(card => {
        return card.classifications && card.classifications.includes(classification);
    });
    renderCardsList(filteredCards);
}

// Função para deletar a classificação com opção de excluir os cards
function deleteClassification(classification) {
    // Primeira confirmação para excluir a classificação
    const confirmation = confirm(`Tem certeza de que deseja excluir a classificação "${classification}"?`);

    if (!confirmation) {
        return;
    }

    // Pergunta se o usuário deseja excluir os cards que possuem apenas essa classificação
    const deleteCardsConfirmation = confirm(`Deseja também excluir todos os cards que possuem unicamente a classificação "${classification}"?\n\nSe escolher "Cancelar", os cards serão mantidos sem essa classificação.`);

    // Filtrar os cards que possuem a classificação
    const cardsToDelete = [];
    const cardsToUpdate = [];

    Object.values(cards).forEach(card => {
        const index = card.classifications.indexOf(classification);
        if (index !== -1) {
            card.classifications.splice(index, 1); // Remove a classificação do card

            if (card.classifications.length === 0) {
                // Se o card não tem mais classificações
                if (deleteCardsConfirmation) {
                    // Se o usuário optou por deletar os cards sem classificações
                    cardsToDelete.push(card);
                } else {
                    // Se o usuário optou por manter os cards sem classificações
                    cardsToUpdate.push(card);
                }
            } else {
                // Se o card ainda tem outras classificações, apenas atualiza
                cardsToUpdate.push(card);
            }
        }
    });

    // Excluir os cards que devem ser deletados
    const deletePromises = cardsToDelete.map(card => {
        return fetch(`${apiBaseUrl}/cards/${card.id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao deletar card com ID ${card.id}`);
            }

            // Remove o card do objeto cards
            delete cards[card.id];
        })
        .catch(error => console.error('Erro ao excluir card:', error));
    });

    // Atualizar os cards que tiveram a classificação removida
    const updatePromises = cardsToUpdate.map(card => {
        return fetch(`${apiBaseUrl}/cards/${card.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(card)
        })
        .catch(error => console.error('Erro ao atualizar card:', error));
    });

    // Após todas as operações, atualizar a interface
    Promise.all([...deletePromises, ...updatePromises])
        .then(() => {
            // Atualizar a interface
            renderCardsList();
            renderClassificationList();
        })
        .catch(error => console.error('Erro ao processar a exclusão da classificação:', error));
}


// Função para abrir o modal de edição
function openEditModal(cardId) {
    const card = cards[cardId];

    if (!card) {
        alert('Card não encontrado');
        return;
    }

    // Preenche o modal com as informações do card
    document.getElementById("edit-title").value = card.title;
    document.getElementById("edit-content").value = card.content;
    selectedCardId = cardId;

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
        renderCardsList();
        renderClassificationList();
    })
    .catch(error => console.error('Erro ao salvar edições do card:', error));
}

// Função para deletar um card
function deleteCard(cardId) {
    const confirmation = confirm("Tem certeza de que deseja excluir este card? Esta ação não pode ser desfeita.");

    if (!confirmation) {
        return;
    }

    // Envia a requisição DELETE para o servidor
    fetch(`${apiBaseUrl}/cards/${cardId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao deletar card');
        }

        // Remove o card do objeto cards
        delete cards[cardId];

        // Atualiza a interface
        closeEditModal();
        renderCardsList();
        renderClassificationList();
    })
    .catch(error => console.error('Erro ao excluir card:', error));
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

// Função para fechar o modal de edição
function closeEditModal() {
    document.getElementById("edit-modal").style.display = "none";
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


function enableClassificationEditing(classificationTextElement) {
    // Armazena o nome antigo para referência
    const originalText = classificationTextElement.textContent;

    // Obter o nome da classificação a partir do data attribute
    const classificationName = classificationTextElement.dataset.classificationName;

    // Encontrar o elemento do ícone de edição relacionado
    const editIcon = classificationTextElement.parentElement.querySelector('.fa-edit');

    // Desabilitar o ícone de edição
    if (editIcon) {
        editIcon.style.pointerEvents = 'none'; // Desabilita o clique
        editIcon.style.opacity = '0.5'; // Visualmente indica que está desabilitado
    }

    // Torna o elemento editável e define o texto apenas com o nome da classificação
    classificationTextElement.textContent = classificationName;
    classificationTextElement.contentEditable = "true";
    classificationTextElement.focus();
    classificationTextElement.style.borderBottom = '1px dashed #007bff';

    // Seleciona todo o texto
    document.execCommand('selectAll', false, null);

    // Flag para evitar múltiplas execuções
    let isSaving = false;

    // Função para salvar as alterações
    function saveChanges() {
        if (isSaving) return;
        isSaving = true;

        const newClassificationName = classificationTextElement.textContent.trim();

        // Remove o estilo de edição
        classificationTextElement.contentEditable = "false";
        classificationTextElement.style.borderBottom = '';

        // Reabilitar o ícone de edição
        if (editIcon) {
            editIcon.style.pointerEvents = 'auto';
            editIcon.style.opacity = '1';
        }

        // Se o nome não mudou ou está vazio, restaura o original
        if (newClassificationName === classificationName || newClassificationName === '') {
            classificationTextElement.textContent = originalText;
            isSaving = false;
            return;
        }

        // Verifica se já existe uma classificação com o novo nome
        const existingClassifications = getAllClassifications();
        if (existingClassifications.includes(newClassificationName)) {
            alert('Já existe uma classificação com esse nome.');
            classificationTextElement.textContent = originalText;
            isSaving = false;
            return;
        }

        // Atualiza todos os cards que possuem a classificação antiga
        const cardsToUpdate = Object.values(cards).filter(card => {
            return card.classifications.includes(classificationName);
        });

        cardsToUpdate.forEach(card => {
            // Substitui a classificação antiga pela nova
            const index = card.classifications.indexOf(classificationName);
            if (index !== -1) {
                card.classifications[index] = newClassificationName;
            }
        });

        // Envia as atualizações para o servidor
        const updatePromises = cardsToUpdate.map(card => {
            return fetch(`${apiBaseUrl}/cards/${card.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(card)
            })
            .catch(error => console.error('Erro ao atualizar card:', error));
        });

        // Atualiza a interface após todas as atualizações
        Promise.all(updatePromises)
            .then(() => {
                // Atualizar o data attribute com o novo nome
                classificationTextElement.dataset.classificationName = newClassificationName;
                // Atualizar o texto com o novo nome e a contagem
                const count = cardsToUpdate.length;
                classificationTextElement.textContent = `${newClassificationName} (${count})`;
                // Atualizar a lista de classificações
                renderCardsList();
                renderClassificationList();
                isSaving = false;
            })
            .catch(error => {
                console.error('Erro ao atualizar classificações:', error);
                isSaving = false;
            });
    }

    // Eventos para salvar as alterações
    classificationTextElement.addEventListener('blur', saveChanges);

    classificationTextElement.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            classificationTextElement.blur();
        } else if (event.key === 'Escape') {
            // Se o usuário pressionar Esc, cancela a edição
            classificationTextElement.textContent = originalText;
            classificationTextElement.contentEditable = "false";
            classificationTextElement.style.borderBottom = '';

            // Reabilitar o ícone de edição
            if (editIcon) {
                editIcon.style.pointerEvents = 'auto';
                editIcon.style.opacity = '1';
            }

            isSaving = false;
        }
    });
}


