// URL base do servidor JSON (comando para ligar o servidor de desenvolvimento: json-server --watch db.json --port 3000)
const apiBaseUrl = 'http://localhost:3000';

// Objetos globais compartilhados
let cards = {}; 
let dates = {};
let selectedDate = null;
let selectedCardId = null;
let currentClassifications = [];
let currentRecallStatus = false;
let currentCardDates = [];
let isClickingSuggestion = false;


// Definir as classificações fixas
const fixedClassifications = ['INBOX', 'grammar', 'listening', 'pronunciation', 'vocabulary'];

// Função para adicionar uma label de classificação
function addClassificationLabel(classification, labelsContainerId) {
    if (!currentClassifications.includes(classification)) {     
        currentClassifications.push(classification);
    }

    const labelsContainer = document.getElementById(labelsContainerId);
    const existingLabels = labelsContainer.querySelectorAll('.classification-label');

    for (let label of existingLabels) {
        if (label.firstChild.textContent === classification) {
            return;
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

function setupClassificationInput(inputId, labelsContainerId, suggestionsContainerId) {
    const input = document.getElementById(inputId);
    if (!input) {
        console.error(`Elemento com ID ${inputId} não encontrado em setupClassificationInput.`);
        return;
    }
    input.setAttribute('data-labels-container-id', labelsContainerId);
    input.setAttribute('data-suggestions-container-id', suggestionsContainerId);

    function addClassificationFromInput() {
        const classificationName = input.value.trim();
        if (classificationName !== '') {
            addClassificationLabel(classificationName, labelsContainerId);
            input.value = '';
        }
    }

    input.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            addClassificationFromInput();
            // Limpar sugestões
            const suggestionsContainer = document.getElementById(suggestionsContainerId);
            suggestionsContainer.innerHTML = '';
        }
    });

    input.addEventListener('blur', function() {
        // Se estiver clicando em uma sugestão, não adiciona a classificação agora
        if (isClickingSuggestion) {
            return;
        }
        addClassificationFromInput();
        // Limpar sugestões
        const suggestionsContainer = document.getElementById(suggestionsContainerId);
        if (suggestionsContainer) {
            suggestionsContainer.innerHTML = '';
        }
    });
}


function setupClassificationAutocomplete(inputId) {
    const input = document.getElementById(inputId);
    if (!input) {
        console.error(`Elemento com ID ${inputId} não encontrado em setupClassificationAutocomplete.`);
        return;
    }

    function showSuggestionsOnEvent() {
        const value = input.value.trim().toLowerCase();
        const existingClassifications = getAllClassifications();

        // Excluir as classificações já associadas ao card atual
        const suggestions = existingClassifications.filter(c => 
            c.toLowerCase().includes(value) && 
            !currentClassifications.includes(c)
        );

        showSuggestions(input, suggestions);
    }

    // Mostrar sugestões quando o input recebe foco ou quando o valor muda
    input.addEventListener("focus", showSuggestionsOnEvent);
    input.addEventListener("input", showSuggestionsOnEvent);
}


function showSuggestions(input, suggestions) {
    const suggestionsContainerId = input.getAttribute('data-suggestions-container-id');
    const suggestionsContainer = document.getElementById(suggestionsContainerId);

    // Remove sugestões anteriores
    suggestionsContainer.innerHTML = '';

    if (suggestions.length === 0) return;

    const suggestionsDiv = document.createElement("div");
    suggestionsDiv.className = "suggestions";

    suggestions.forEach(suggestion => {
        const suggestionDiv = document.createElement("div");
        suggestionDiv.textContent = suggestion;

        // Prevenir que o input perca o foco ao clicar na sugestão
        suggestionDiv.addEventListener('mousedown', function(event) {
            event.preventDefault(); // Previne o comportamento padrão
            isClickingSuggestion = true;
            input.value = suggestion; // Insere o valor da sugestão no input
        });

        // Ao clicar na sugestão
        suggestionDiv.addEventListener('click', function(event) {
            isClickingSuggestion = false;
            input.focus(); // Mantém o foco no input
            // Atualiza as sugestões
            showSuggestions(input, []);
        });

        suggestionsDiv.appendChild(suggestionDiv);
    });

    suggestionsContainer.appendChild(suggestionsDiv);

    // Adicionar event listener para esconder sugestões ao clicar fora
    document.addEventListener('click', function hideSuggestions(event) {
        if (!suggestionsContainer.contains(event.target) && event.target !== input) {
            suggestionsContainer.innerHTML = '';
            document.removeEventListener('click', hideSuggestions);
        }
    });
}



function getNextDate(dateString, days) {
    const [year, month, day] = dateString.split('-').map(Number);
    const currentDate = new Date(year, month - 1, day);
    currentDate.setDate(currentDate.getDate() + days);
    return formatDate(currentDate);
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Função para obter todas as classificações existentes a partir dos cards
function getAllClassifications() {
    const classificationsSet = new Set(fixedClassifications);
    Object.values(cards).forEach(card => {
        if (card.classifications) {
            card.classifications.forEach(classification => {
                classificationsSet.add(classification);
            });
        }
    });
    return Array.from(classificationsSet).sort();
}

function sortClassifications(classifications) {
    // Separa 'INBOX' e ordena as outras classificações
    const inbox = classifications.filter(c => ['INBOX'].includes(c));
    const fixedClassifications_sorted = classifications.filter(c => ['grammar', 'pronunciation', 'vocabulary', 'listening'].includes(c)).sort();

    const others = classifications
    .filter(c => !['INBOX', 'grammar', 'pronunciation', 'vocabulary', 'listening'].includes(c))
    .sort();

    return inbox.concat(fixedClassifications_sorted).concat(others);
}

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

// Adicione a função toggleBlur() se ainda não estiver definida
function toggleBlur() {
    const descriptions = document.querySelectorAll('.card p');
    descriptions.forEach(description => {
        description.classList.toggle('visible');
    });

    // Alterna o ícone do botão
    const eyeIcon = document.querySelector('.eye-toggle i');
    if (eyeIcon) {
        eyeIcon.classList.toggle('fa-eye');
        eyeIcon.classList.toggle('fa-eye-slash');
    }
}


// common.js

// Função para ajustar automaticamente a altura de todas as textareas
function autoResizeTextareas() {
    function adjustHeight(textarea) {
        // Reseta a altura para calcular corretamente o scrollHeight
        textarea.style.height = 'auto';
        // Define a altura para o scrollHeight atual
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    // Seleciona todas as textareas na página
    const textareas = document.querySelectorAll('textarea');

    // Itera sobre cada textarea e configura o evento
    textareas.forEach(textarea => {
        // Ajusta a altura inicialmente
        adjustHeight(textarea);

        // Adiciona um listener para ajustar a altura ao digitar
        textarea.addEventListener('input', () => adjustHeight(textarea));
    });
}

// Chama a função quando o conteúdo do DOM for carregado
document.addEventListener('DOMContentLoaded', autoResizeTextareas);
