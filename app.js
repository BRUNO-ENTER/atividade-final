// Registro do Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js');
    });
}

const STORAGE_KEY = 'techstore_produtos';
let produtos = [];
let deferredPrompt = null;

// Evento de instalação do PWA
window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;

    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.hidden = false;
    }
});

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    
    // Se a lista estiver vazia na primeira inicialização, adiciona dados de demonstração
    if (produtos.length === 0) {
        carregarProdutosIniciaisDemo();
    }
    
    renderizarProdutos();

    const produtoForm = document.getElementById('produtoForm');
    if (produtoForm) {
        produtoForm.addEventListener('submit', adicionarProduto);
    }

    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;

            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            installBtn.hidden = true;
        });
    }
});

// Produtos de Exemplo (TechStore)
function carregarProdutosIniciaisDemo() {
    produtos = [
        {
            id: 1700000000001,
            nome: "Headset Gamer Wireless RGB",
            descricao: "Headset sem fio com som surround 7.1, microfone com cancelamento de ruído e bateria de até 30 horas.",
            preco: 459.90,
            imagem: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
            status: "Em Estoque",
            dataCriacao: new Date().toLocaleString('pt-BR')
        },
        {
            id: 1700000000002,
            nome: "Smartwatch Fitness OLED",
            descricao: "Relógio inteligente com monitor cardíaco, GPS integrado, resistência à água 5ATM e tela Always-On Display.",
            preco: 899.00,
            imagem: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
            status: "Em Estoque",
            dataCriacao: new Date().toLocaleString('pt-BR')
        },
        {
            id: 1700000000003,
            nome: "Teclado Mecânico Custom RGB",
            descricao: "Teclado mecânico compacto 75%, switches hot-swappable, conexão Bluetooth e cabo USB-C trançado.",
            preco: 380.50,
            imagem: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80",
            status: "Sob Encomenda",
            dataCriacao: new Date().toLocaleString('pt-BR')
        }
    ];
    salvarProdutos();
}

// Carregar produtos do localStorage
function carregarProdutos() {
    const dados = localStorage.getItem(STORAGE_KEY);
    produtos = dados ? JSON.parse(dados) : [];
}

// Salvar dados no localStorage
function salvarProdutos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(produtos));
}

// Renderizar produtos na tela
function renderizarProdutos(listaParaExibir = produtos) {
    const lista = document.getElementById('produtoList');

    atualizarEstatisticas();

    if (listaParaExibir.length === 0) {
        lista.innerHTML = '<p class="empty-message">Nenhum produto encontrado.</p>';
        return;
    }

    const placeholderImg = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&q=80';

    lista.innerHTML = listaParaExibir.map(p => `
        <div class="produto-card">
            <div class="produto-image-container">
                <img src="${escapeHtml(p.imagem || placeholderImg)}" 
                     alt="${escapeHtml(p.nome)}" 
                     class="produto-image"
                     onerror="this.onerror=null; this.src='${placeholderImg}';">
                <span class="status-badge ${getStatusClass(p.status)}">${escapeHtml(p.status)}</span>
            </div>
            
            <div class="produto-content">
                <h3 class="produto-title">${escapeHtml(p.nome)}</h3>
                <p class="produto-description">${escapeHtml(p.descricao)}</p>
                
                <div class="produto-footer">
                    <div class="produto-price">
                        <span class="currency">R$</span>
                        <span class="amount">${formatarMoeda(p.preco)}</span>
                    </div>

                    <div class="produto-actions">
                        <button class="btn btn-status ${p.status === 'Em Estoque' ? 'checked' : ''}" 
                                onclick="alternarStatus(${p.id})">
                            ${p.status === 'Em Estoque' ? '✓ Em Estoque' : '⚙ Alterar Status'}
                        </button>  
                        <button class="btn btn-delete" onclick="deletarProduto(${p.id})" title="Remover produto">
                            Remover
                        </button> 
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Atualizar dashboard com estatísticas
function atualizarEstatisticas() {
    const totalProdutosEl = document.getElementById('totalProdutos');
    const totalEstoqueEl = document.getElementById('totalEstoque');
    const totalDisponivelEl = document.getElementById('totalDisponivel');

    if (totalProdutosEl && totalEstoqueEl && totalDisponivelEl) {
        const total = produtos.length;
        const disponiveis = produtos.filter(p => p.status === 'Em Estoque').length;
        const valorTotal = produtos.reduce((acc, p) => acc + Number(p.preco || 0), 0);

        totalProdutosEl.textContent = total;
        totalDisponivelEl.textContent = disponiveis;
        totalEstoqueEl.textContent = `R$ ${formatarMoeda(valorTotal)}`;
    }
}

function getStatusClass(status) {
    if (status === 'Em Estoque') return 'badge-success';
    if (status === 'Esgotado') return 'badge-danger';
    return 'badge-warning';
}

function toggleFormSection() {
    const formSection = document.getElementById('formSection');
    formSection.classList.toggle('visible');

    if (formSection.classList.contains('visible')) {
        document.getElementById('nomeProduto').focus();
        formSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function mostrarNotificacao(mensagem) {
    const el = document.createElement('div');
    el.textContent = mensagem;
    el.className = 'toast';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
}

function adicionarProduto(e) {
    e.preventDefault();

    const nome = document.getElementById('nomeProduto').value.trim();
    const preco = parseFloat(document.getElementById('precoProduto').value);
    const status = document.getElementById('statusProduto').value;
    const imagem = document.getElementById('imagemProduto').value.trim();
    const descricao = document.getElementById('descricaoProduto').value.trim();

    if (!nome || isNaN(preco) || !descricao) {
        alert('Por favor, preencha todos os campos obrigatórios corretamente.');
        return;
    }

    const novoProduto = {
        id: Date.now(),
        nome: nome,
        preco: preco,
        status: status,
        imagem: imagem || '',
        descricao: descricao,
        dataCriacao: new Date().toLocaleString('pt-BR')
    };

    produtos.unshift(novoProduto);
    salvarProdutos();

    document.getElementById('produtoForm').reset();
    toggleFormSection();
    renderizarProdutos();
    mostrarNotificacao('Produto adicionado ao catálogo!');
}

function alternarStatus(id) {
    const produto = produtos.find(p => p.id === id);
    if (produto) {
        if (produto.status === 'Em Estoque') {
            produto.status = 'Esgotado';
        } else if (produto.status === 'Esgotado') {
            produto.status = 'Sob Encomenda';
        } else {
            produto.status = 'Em Estoque';
        }

        salvarProdutos();
        renderizarProdutos();
        mostrarNotificacao(`Status alterado para "${produto.status}"!`);
    }
}

function deletarProduto(id) {
    if (confirm('Tem certeza que deseja remover este produto do catálogo?')) {
        produtos = produtos.filter(p => p.id !== id);
        salvarProdutos();
        renderizarProdutos();
        mostrarNotificacao('Produto removido com sucesso!');
    }
}

function filtrarProdutos() {
    const termo = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!termo) {
        renderizarProdutos(produtos);
        return;
    }

    const filtrados = produtos.filter(p => 
        p.nome.toLowerCase().includes(termo) || 
        p.descricao.toLowerCase().includes(termo)
    );
    renderizarProdutos(filtrados);
}

function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}