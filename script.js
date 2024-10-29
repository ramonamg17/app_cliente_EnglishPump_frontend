// Inicializa os dados dos cards e datas
let cards = {};
let dates = {};

// URL base do servidor JSON (comando para ligar o servidor de desenvolcimento: json-server --watch db.json --port 3000)
const apiBaseUrl = 'http://localhost:3000';

let selectedDate = null;
let selectedCardId = null;

// Função para exibir a seção selecionada
function showSection(section) {
    console.log("Selected section:", section); // Apenas para teste
}

// Função para carregar todos os cards do servidor
function loadAllCards() {
    
    fetch(`${apiBaseUrl}/cards`)
        .then(response => response.json())
        .then(data => {
            // Limpa o conteúdo atual de cards e dates
            cards = {};
            dates = {};

            // Preenche cards e dates com os dados do servidor
            data.forEach(card => {
                cards[card.id] = {
                    id: card.id,
                    title: card.title,
                    content: card.content,
                    dates: card.dates
                };

                // Popula as datas com os IDs dos cards relacionados
                card.dates.forEach(date => {
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
}

// Função para fechar o modal
function closeModal() {
    document.getElementById("modal").style.display = "none";
}

function addCard(event) {
    if (event) event.preventDefault();

    const title = document.getElementById("card-title").value.trim();
    const content = document.getElementById("card-content").value.trim();

    if (!title || !content) {
        alert("Por favor, preencha todos os campos");
        return;
    }

    const newCard = {
        title: title,
        content: content,
        dates: [
            selectedDate,
            getNextDate(selectedDate, 1),
            getNextDate(selectedDate, 2)
        ]
    };

    fetch(`${apiBaseUrl}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCard),
        mode: 'cors', // Ensure CORS is enabled
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

        document.getElementById("card-title").value = "";
        document.getElementById("card-content").value = "";
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

    // Percorre cada dia no calendário e aplica as marcações corretas
    calendarGrid.querySelectorAll('.day').forEach(dayDiv => {
        const day = parseInt(dayDiv.textContent);
        if (isNaN(day)) return; // Ignora os espaços vazios

        const formattedDate = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));

        // Verifica se o dia tem cards e aplica a classe 'has-card' se necessário
        if (dates[formattedDate] && dates[formattedDate].length > 0) {
            dayDiv.classList.add("has-card");
        } else {
            dayDiv.classList.remove("has-card");
        }

        // Atualiza a classe 'today' para o dia atual
        dayDiv.classList.toggle("today", formattedDate === todayFormatted);

        // Atualiza a classe 'selected' para o dia selecionado
        dayDiv.classList.toggle("selected", formattedDate === selectedDate);
    });
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
        cardEl.className = "card";
        cardEl.innerHTML = `<h3>${card.title}</h3><p>${card.content}</p>`;
        
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

    if (!newTitle || !newContent) {
        alert("Por favor, preencha todos os campos");
        return;
    }

    // Atualiza os dados do card localmente
    cards[selectedCardId].title = newTitle;
    cards[selectedCardId].content = newContent;

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

// Carrega todos os cards ao iniciar
document.addEventListener("DOMContentLoaded", function() {
    loadAllCards();
});


window.addEventListener('error', function(event) {
    console.error('Erro não capturado:', event.error);
});





