window.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('#top-nav ul li');
  const views = document.querySelectorAll('.view');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const viewId = item.getAttribute('data-view');
      views.forEach(view => {
        view.classList.toggle('active', view.id === viewId);
      });
    });
  });

  // --- Globals ---
  let allTransactions: Transaction[] = [];

  // --- DOM Elemente ---
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const importButton = document.getElementById('import-btn') as HTMLButtonElement;
  const tableBody = document.querySelector('#transactions-table tbody') as HTMLTableSectionElement;
  const yearSelect = document.getElementById('year-select') as HTMLSelectElement;

  // --- Helper Funktionen ---
  function getTaxYears(transactions: Transaction[]): number[] {
    const yearsSet = new Set<number>();
    for (const t of transactions) {
      yearsSet.add(t.year);
    }
    return Array.from(yearsSet).sort((a, b) => a - b);
  }

  function populateYearSelect(years: number[]) {
    for (let i = yearSelect.options.length - 1; i >= 1; i--) {
      yearSelect.remove(i);
    }
    for (const year of years) {
      const option = document.createElement('option');
      option.value = year.toString();
      option.textContent = year.toString();
      yearSelect.appendChild(option);
    }
  }

  function renderTransactions(transactions: Transaction[]) {
    tableBody.innerHTML = '';

    const sortedTransactions = [...transactions].sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    const formatter = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    });

    for (const t of sortedTransactions) {
      const tr = document.createElement('tr');
      const assetToShow = t.type.toLowerCase() === 'deposit' ? '' : t.asset;
      const priceToShow = t.type.toLowerCase() === 'deposit' ? '0.00' : t.price.toFixed(2);
      const totalValue = t.type.toLowerCase() === 'deposit' ? t.amount : t.amount * t.price;

      tr.innerHTML = `
        <td>${t.date ? new Date(t.date).toLocaleDateString('de-DE') : ''}</td>
        <td>${t.type}</td>
        <td>${assetToShow}</td>
        <td>${t.amount.toFixed(8)}</td>
        <td>${priceToShow}</td>
        <td>${formatter.format(totalValue)}</td>
      `;
      tableBody.appendChild(tr);
    }
  }

  function updateDashboard(transactions: Transaction[]) {
    const totalBuy = transactions
      .filter(t => t.type.toLowerCase() === 'buy')
      .reduce((sum, t) => sum + t.amount * t.price, 0);

    const totalSell = transactions
      .filter(t => t.type.toLowerCase() === 'sell')
      .reduce((sum, t) => sum + t.amount * t.price, 0);

    const realizedProfit = totalSell - totalBuy;

    const assetSet = new Set(
      transactions
        .filter(t => t.type.toLowerCase() === 'buy' || t.type.toLowerCase() === 'sell')
        .map(t => t.asset)
    );

    const format = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

    const stats = {
      buy: document.querySelector('#dashboard .stat-box:nth-child(1) p'),
      sell: document.querySelector('#dashboard .stat-box:nth-child(2) p'),
      profit: document.querySelector('#dashboard .stat-box:nth-child(3) p'),
      coins: document.querySelector('#dashboard .stat-box:nth-child(4) p'),
    };

    if (stats.buy) stats.buy.textContent = format.format(totalBuy);
    if (stats.sell) stats.sell.textContent = format.format(totalSell);
    if (stats.profit) {
      stats.profit.textContent = `${realizedProfit >= 0 ? '+' : ''}${format.format(realizedProfit)}`;
      (stats.profit as HTMLElement).style.color = realizedProfit >= 0 ? 'green' : 'red';
    }
    if (stats.coins) stats.coins.textContent = assetSet.size.toString();
  }

  function generateReport(transactions: Transaction[]): Map<number, Map<string, number>> {
    const report = new Map<number, Map<string, number>>();

    transactions
      .filter(t => t.type.toLowerCase() === 'buy' || t.type.toLowerCase() === 'sell')
      .forEach(t => {
        const year = t.year;
        const coin = t.asset;
        const value = t.amount * t.price * (t.type.toLowerCase() === 'sell' ? 1 : -1);

        if (!report.has(year)) {
          report.set(year, new Map());
        }

        const coinMap = report.get(year)!;
        coinMap.set(coin, (coinMap.get(coin) || 0) + value);
      });

    return report;
  }

  function renderReport(transactions: Transaction[]) {
    const container = document.querySelector('#reports') as HTMLElement;
    container.innerHTML = '<h2>Berichte</h2>';

    const report = generateReport(transactions);
    const formatter = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    });

    report.forEach((coinMap, year) => {
      const table = document.createElement('table');
      table.style.marginBottom = '30px';
      table.innerHTML = `
        <thead>
          <tr><th colspan="3">Steuerjahr ${year}</th></tr>
          <tr>
            <th>Coin</th>
            <th>Gewinn/Verlust</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;

      const tbody = table.querySelector('tbody')!;
      coinMap.forEach((value, coin) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${coin}</td>
          <td style="color:${value >= 0 ? 'green' : 'red'}">${formatter.format(value)}</td>
          <td>${value >= 0 ? 'Gewinn' : 'Verlust'}</td>
        `;
        tbody.appendChild(tr);
      });

      container.appendChild(table);
    });
  }

  // --- Event: Filter Dropdown ---
  yearSelect.addEventListener('change', () => {
    const selectedYear = yearSelect.value;
    if (selectedYear === 'all') {
      renderTransactions(allTransactions);
    } else {
      const filtered = allTransactions.filter(t => t.year === Number(selectedYear));
      renderTransactions(filtered);
    }
  });

  // --- CSV Import ---
  importButton.addEventListener('click', () => {
    const file = fileInput.files?.[0];
    if (!file) return alert('Bitte wähle eine CSV-Datei aus.');

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.trim().split('\n');

      tableBody.innerHTML = '';
      const transactionsToSave: Transaction[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(';').map(c => c.trim());

        const typ = cols[0] || '';
        const währung = cols[1] || '';
        const assetRaw = cols[2] || '';
        const eurAmount = parseFloat(cols[3].replace(',', '.')) || 0;
        const assetAmount = parseFloat(cols[4].replace(',', '.')) || 0;
        const preisRaw = cols[5].replace(',', '.') || '0';
        const preis = parseFloat(preisRaw) || 0;
        const datumRaw = cols[7] || '';

        let datum = '';
        let year = 0;
        if (datumRaw) {
          const d = new Date(datumRaw);
          if (!isNaN(d.getTime())) {
            datum = d.toISOString();
            year = d.getFullYear();
          }
        }

        let assetValue = '';
        let amountValue = 0;
        let priceValue = 0;

        if (typ.toLowerCase() === 'deposit') {
          assetValue = '';
          amountValue = eurAmount;
          priceValue = 0;
        } else if (typ.toLowerCase() === 'buy' || typ.toLowerCase() === 'sell') {
          assetValue = assetRaw || währung;
          amountValue = assetAmount;
          priceValue = preis;
        } else {
          assetValue = assetRaw || währung;
          amountValue = assetAmount || eurAmount;
          priceValue = preis;
        }

        transactionsToSave.push({
          date: datum,
          type: typ,
          asset: assetValue,
          currency: währung,
          amount: amountValue,
          price: priceValue,
          year
        });
      }

      allTransactions = transactionsToSave;
      const years = getTaxYears(allTransactions);
      populateYearSelect(years);
      renderTransactions(allTransactions);
      updateDashboard(allTransactions);
      renderReport(allTransactions);
      window.electronAPI.saveTransactions(transactionsToSave);

      document.querySelector('[data-view="transactions"]')?.dispatchEvent(new Event('click'));
    };

    reader.onerror = () => {
      alert('Fehler beim Lesen der Datei.');
    };

    reader.readAsText(file);
  });

  // --- Transaktionen vom Main Prozess laden ---
  window.electronAPI.loadTransactions();

  window.electronAPI.onTransactionsLoaded((transactions) => {
    allTransactions = transactions;
    const years = getTaxYears(allTransactions);
    populateYearSelect(years);
    renderTransactions(allTransactions);
    updateDashboard(allTransactions);
    renderReport(allTransactions);
  });

  window.electronAPI.onError((message) => {
    alert(`Fehler: ${message}`);
  });
});
