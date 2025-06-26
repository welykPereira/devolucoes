document.addEventListener('DOMContentLoaded', () => {

    const DISTRIBUIDORAS = ['LER', 'SMOLKA', 'FG'];
    const COMISSAO_PERCENTUAL = 0.25;
    let records = JSON.parse(localStorage.getItem('dailyRecords')) || [];

    const form = document.getElementById('daily-form');
    const historyList = document.getElementById('history-list');
    const totalVendidoEl = document.getElementById('total-vendido');
    const totalAPagarEl = document.getElementById('total-a-pagar');
    const ganhoRealEl = document.getElementById('ganho-real');
    const carretoInput = document.getElementById('carreto-input');
    const lucroRevistasEl = document.getElementById('lucro-revistas');
    const submitButton = document.getElementById('submit-button'); // NOVO
    const modal = document.getElementById('report-modal');
    const reportTextContentEl = document.getElementById('report-text-content');
    const closeModalButton = document.getElementById('close-modal-button');
    const copyButton = document.getElementById('copy-button');

    const formatCurrency = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const createFormFields = () => {
        let formHTML = '';
        DISTRIBUIDORAS.forEach(dist => {
            formHTML += `
                <div class="dist-group">
                    <h3>${dist}</h3>
                    <div class="input-row">
                        <div>
                            <label for="encalhe-${dist}">Nº do Encalhe</label>
                            <input type="number" id="encalhe-${dist}" placeholder="0">
                        </div>
                        <div>
                            <label for="vendido-${dist}">Valor Vendido (R$)</label>
                            <input type="number" id="vendido-${dist}" placeholder="0.00" step="0.01">
                        </div>
                    </div>
                    <div class="calc-result" id="calc-${dist}"></div>
                </div>`;
        });
        form.innerHTML = formHTML;
    };

    const updateTotals = () => {
        let totalVendido = 0;
        DISTRIBUIDORAS.forEach(dist => {
            const vendido = parseFloat(document.getElementById(`vendido-${dist}`).value) || 0;
            totalVendido += vendido;
            const aPagar = vendido * (1 - COMISSAO_PERCENTUAL);
            const ganho = vendido * COMISSAO_PERCENTUAL;
            const calcResultEl = document.getElementById(`calc-${dist}`);
            if (vendido > 0) {
                calcResultEl.innerHTML = `<span>A Pagar: <strong class="valor-pagar">${formatCurrency(aPagar)}</strong></span><br><span>Ganho: <strong class="ganho-real">${formatCurrency(ganho)}</strong></span>`;
            } else {
                calcResultEl.innerHTML = '';
            }
        });
        
        const totalAPagar = totalVendido * (1 - COMISSAO_PERCENTUAL);
        const ganhoReal = totalVendido * COMISSAO_PERCENTUAL;
        const carreto = parseFloat(carretoInput.value) || 0;
        const lucroFinal = ganhoReal - carreto;

        totalVendidoEl.textContent = formatCurrency(totalVendido);
        totalAPagarEl.textContent = formatCurrency(totalAPagar);
        ganhoRealEl.textContent = formatCurrency(ganhoReal);
        lucroRevistasEl.textContent = formatCurrency(lucroFinal);

        // ATUALIZADO: Habilita ou desabilita o botão
        submitButton.disabled = totalVendido <= 0;
    };
    
    const renderHistory = () => {
        historyList.innerHTML = '';
        if (records.length === 0) {
            historyList.innerHTML = '<li>Nenhum registro encontrado.</li>';
            return;
        }
        records.forEach(record => {
            const li = document.createElement('li');
            li.className = 'history-item';
            const date = new Date(record.data + 'T12:00:00').toLocaleDateString();
            let detailsHTML = '';
            let totalGanhoDia = 0;

            Object.entries(record.registros).forEach(([dist, values]) => {
                const ganho = values.vendido * COMISSAO_PERCENTUAL;
                totalGanhoDia += ganho;
                detailsHTML += `<div><strong>${dist}:</strong> Venda ${formatCurrency(values.vendido)} | Ganho ${formatCurrency(ganho)}</div>`;
            });

            const carretoDia = record.carreto || 0;
            const lucroDia = totalGanhoDia - carretoDia;
            
            li.innerHTML = `
                <div class="date">${date}</div>
                <div class="details">${detailsHTML}</div>
                <div class="day-total-gain">
                    <span>Ganho Bruto: ${formatCurrency(totalGanhoDia)}</span><br>
                    <span>Carreto: - ${formatCurrency(carretoDia)}</span><br>
                    <strong style="color: var(--final-profit-color);">Lucro da Semana: ${formatCurrency(lucroDia)}</strong>
                </div>`;
            historyList.appendChild(li);
        });
    };

    // FUNÇÃO DE RELATÓRIO ATUALIZADA
    const generateTextReport = (data) => {
        const date = new Date(data.data + 'T12:00:00').toLocaleDateString('pt-BR');
        let text = `*📊 DEVOLUCAO DA SEMANA: ${date}*\n`;
        text += `═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═ ═\n\n`;
        let totalGeral = { vendido: 0, aPagar: 0, ganho: 0 };

        Object.entries(data.registros).forEach(([dist, values]) => {
            const ganho = values.vendido * COMISSAO_PERCENTUAL;
            const aPagar = values.vendido - ganho;
            totalGeral.vendido += values.vendido;
            totalGeral.ganho += ganho;
            totalGeral.aPagar += aPagar;
            
            text += `*🏦 DISTRIBUIDORA: ${dist}*\n`;
            text += `   📦 Encalhe: ${values.encalhe}\n`;
            text += `   💵 Vendido: ${formatCurrency(values.vendido)}\n`;
            text += `   🧾 A Pagar: ${formatCurrency(aPagar)}\n`;
            text += `   ✅ Ganho Real: ${formatCurrency(ganho)}\n\n`;
        });
        
        const lucroFinal = totalGeral.ganho - data.carreto;
        let emoji = '😐';
        if (lucroFinal > 0) emoji = '💰';
        if (lucroFinal < 0) emoji = '📉';
        
        text += `*RESUMO GERAL DO DIA*\n`;
        text += `──────────────────\n`;
        text += `   💵 Total Vendido: ${formatCurrency(totalGeral.vendido)}\n`;
        text += `   🧾 Total a Pagar: ${formatCurrency(totalGeral.aPagar)}\n`;
        text += `   ✅ Ganho Bruto: ${formatCurrency(totalGeral.ganho)}\n`;
        text += `   🚚 Carreto: - ${formatCurrency(data.carreto)}\n`;
        text += `──────────────────\n`;
        text += `*${emoji} LUCRO LÍQUIDO: ${formatCurrency(lucroFinal)}*`;

        return text;
    };

    const handleSaveAndReport = (event) => {
        event.preventDefault();
        const today = new Date().toISOString().split('T')[0];
        const carreto = parseFloat(carretoInput.value) || 0;
        const newRecord = { data: today, registros: {}, carreto: carreto };
        
        DISTRIBUIDORAS.forEach(dist => {
            newRecord.registros[dist] = {
                encalhe: parseFloat(document.getElementById(`encalhe-${dist}`).value) || 0,
                vendido: parseFloat(document.getElementById(`vendido-${dist}`).value) || 0,
            };
        });

        const recordIndex = records.findIndex(r => r.data === today);
        if (recordIndex > -1) records[recordIndex] = newRecord;
        else records.unshift(newRecord);
        localStorage.setItem('dailyRecords', JSON.stringify(records));

        renderHistory();
        
        const reportText = generateTextReport(newRecord);
        reportTextContentEl.textContent = reportText;
        modal.style.display = 'flex';

        form.reset();
        carretoInput.value = '';
        updateTotals();
    };

    // --- EVENT LISTENERS ---
    form.addEventListener('submit', handleSaveAndReport);
    form.addEventListener('input', updateTotals); // Delegação de eventos
    closeModalButton.addEventListener('click', () => modal.style.display = 'none');
    
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(reportTextContentEl.textContent)
            .then(() => {
                const originalText = copyButton.textContent;
                copyButton.style.backgroundColor = 'var(--gain-color)';
                copyButton.textContent = 'Copiado!';
                setTimeout(() => {
                    copyButton.textContent = originalText;
                    copyButton.style.backgroundColor = 'var(--primary-color)';
                }, 2000);
            })
            .catch(err => alert('Não foi possível copiar o texto.'));
    });

    // --- INICIALIZAÇÃO ---
    createFormFields();
    renderHistory();
    updateTotals(); // Chama uma vez para setar o estado inicial do botão
});