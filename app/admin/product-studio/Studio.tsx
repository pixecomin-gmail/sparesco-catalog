'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { getCatalogThumbnailUrl } from '@/lib/catalog/thumbnail';
import { parseProductExcel } from '@/lib/admin/excel-product-import';
import './studio.css';
import './export-popup.css';
type Item = { handle: string; title: string; image?: string; imageFolder?: string; partNumber?: string; vendor?: string; collection?: string; variantCount?: number; price?: number };
export default function Studio() {
  const importRef = useRef<HTMLInputElement>(null);
  const [transferring, setTransferring] = useState(false);
  const [transferNotice, setTransferNotice] = useState('');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [showExport, setShowExport] = useState(false);
  const [exportScope, setExportScope] = useState<'selected' | 'search'>('selected');
  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 2) { setError('Enter at least 2 characters.'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/search?q=' + encodeURIComponent(q.trim()));
      if (!r.ok) throw Error('Search failed');
      const data: unknown = await r.json();
      if (!Array.isArray(data)) throw Error('Unexpected search response');
      setRows(data as Item[]); setPage(1); setSearched(true); setSelected([]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Search failed'); }
    finally { setLoading(false); }
  }
  async function exportExcel(scope: 'selected' | 'search') {
    const handlesToExport = [...new Set(scope === 'search' ? searchHandles : selected)];
    setShowExport(false);
    if (!handlesToExport.length) { setError('No products available for this export option.'); return; }
    setTransferring(true);
    setError('');
    setTransferNotice(`Preparing ${handlesToExport.length} products…`);
    try {
      const allRows: Record<string, string | number>[] = [];
      const failures: string[] = [];
      let productCount = 0;
      const batchSize = 25;
      for (let i = 0; i < handlesToExport.length; i += batchSize) {
        const batch = handlesToExport.slice(i, i + batchSize);
        const response = await fetch('/api/admin/export?limit=25&handles=' + encodeURIComponent(batch.join(',')), { cache: 'no-store' });
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.toLowerCase().includes('application/json')) {
          throw Error(`Export server returned HTTP ${response.status} (${contentType || 'unknown content type'}), not JSON.`);
        }
        const data = await response.json();
        if (!response.ok || !data.success) throw Error(data.error || `Export failed (HTTP ${response.status})`);
        if (!Array.isArray(data.rows) || !Array.isArray(data.failedHandles)) throw Error('Unexpected export response.');
        allRows.push(...data.rows);
        failures.push(...data.failedHandles);
        productCount += data.productCount;
        setTransferNotice(`Exporting products: ${Math.min(i + batch.length, handlesToExport.length)} / ${handlesToExport.length} processed…`);
      }
      if (failures.length) throw Error(`${failures.length} products could not be read. No incomplete file was saved. Examples: ${failures.slice(0, 5).join(', ')}`);
      if (!allRows.length) throw Error('No products available to export.');
      if (allRows.length > 1048575) throw Error('Export exceeds the Excel worksheet row limit.');
      setTransferNotice(`Creating Excel file (${allRows.length.toLocaleString('en-IN')} rows)…`);
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(allRows), 'Products');
      XLSX.writeFile(workbook, scope === 'search' ? 'sparesco-search-results.xlsx' : 'sparesco-selected-products.xlsx');
      setTransferNotice(`Exported ${productCount.toLocaleString('en-IN')} products (${allRows.length.toLocaleString('en-IN')} Excel rows).`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
      setTransferNotice('');
    } finally { setTransferring(false); }
  }
  async function importExcel(file?: File) {
    if (!file) return;
    setTransferring(true); setError(''); setTransferNotice('Reading Excel file…');
    try {
      const XLSX = await import('xlsx');
      Object.assign(window, { XLSX });
      const products = await parseProductExcel(file);
      if (!products.length) throw Error('No valid products in this file');
      setTransferNotice(`${products.length} products ready to import.`);
      if (!window.confirm(`Import ${products.length} products into the LIVE catalogue? Existing matching products may be updated. Continue?`)) return;
      const response = await fetch('/api/admin/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ products }) });
      const data = await response.json();
      if (!response.ok || data.success === false) throw Error(data.error || 'Import failed');
      const created = data.created?.length || 0, updated = data.updated?.length || 0, errors = data.errors?.length || 0;
      setTransferNotice(`Import finished: ${created} created, ${updated} updated, ${errors} errors.`);
      if (errors) setError(JSON.stringify(data.errors).slice(0, 1200));
    } catch (e) { setError(e instanceof Error ? e.message : 'Import failed'); }
    finally { setTransferring(false); if (importRef.current) importRef.current.value = ''; }
  }
  const visible = rows.slice((page - 1) * 25, page * 25);
  const pages = Math.max(1, Math.ceil(rows.length / 25));
  const visibleHandles = visible.map(p => p.handle);
  const allPageSelected = visibleHandles.length > 0 && visibleHandles.every(h => selected.includes(h));
  const searchHandles = [...new Set(rows.map(p => p.handle).filter(Boolean))];
  const allSearchSelected = searchHandles.length > 0 && searchHandles.every(h => selected.includes(h));
  function togglePage() {
    setSelected(old => allPageSelected ? old.filter(h => !visibleHandles.includes(h)) : [...new Set([...old, ...visibleHandles])]);
  }
  function toggleHandle(handle: string) {
    setSelected(old => old.includes(handle) ? old.filter(h => h !== handle) : [...old, handle]);
  }
  return <main className="studio">
    <header className="studio-head">
      <div><div className="studio-eyebrow">SPARESCO / CATALOGUE</div><h1>Product Studio</h1><p>A separate workspace for catalogue management.</p></div>
      <div className="studio-actions">
        <input ref={importRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => void importExcel(e.target.files?.[0])} />
        <button type="button" className="studio-secondary" disabled={transferring} onClick={() => importRef.current?.click()}>Import Excel</button>
        <button type="button" className="studio-secondary" disabled={transferring || (!selected.length && !searchHandles.length)} onClick={() => { setExportScope(selected.length ? 'selected' : 'search'); setShowExport(true); }}>Export Excel</button>
        <Link className="studio-primary" href="/admin/product-studio/new">+ Add product</Link>
      </div>
    </header>
    <section className="studio-panel">
      {transferNotice && <div className="studio-transfer-status" role="status">{transferNotice}</div>}
      <form className="studio-search" onSubmit={search}><input aria-label="Search products" value={q} onChange={e => setQ(e.target.value)} placeholder="Search by product name, SKU or part number" /><button disabled={loading}>{loading ? 'Searching…' : 'Search'}</button></form>
      {error && <div className="studio-error" role="alert">{error}</div>}
      {selected.length > 0 && <div className="studio-selection-bar">
        <strong>{selected.length} selected</strong>
        <button type="button" className="studio-secondary" disabled={transferring} onClick={() => { setExportScope('selected'); setShowExport(true); }}>Export selected</button>
        <button type="button" className="studio-secondary" onClick={() => setSelected([])}>Clear selection</button>
      </div>}
      <div className="studio-tablewrap"><table className="studio-table"><thead><tr>
        <th><input type="checkbox" aria-label="Select all products on this page" checked={allPageSelected} onChange={togglePage} disabled={!visible.length} /></th>
        <th>Product</th><th>Part number</th><th>Vendor</th><th>Collection</th><th>Variants</th><th>Price</th>
      </tr></thead><tbody>{visible.map(p => <tr key={p.handle}>
        <td><input type="checkbox" aria-label={'Select ' + p.title} checked={selected.includes(p.handle)} onChange={() => toggleHandle(p.handle)} /></td>
        <td><Link className="studio-product" href={'/admin/product-studio/' + encodeURIComponent(p.handle)}>{p.image ? <img src={getCatalogThumbnailUrl({ image: p.image, imageFolder: p.imageFolder, collection: p.collection })} alt="" onError={e => { e.currentTarget.style.display = 'none'; }} /> : <span className="studio-placeholder">▣</span>}<span><strong>{p.title}</strong><small>{p.handle}</small></span></Link></td>
        <td>{p.partNumber || '—'}</td><td>{p.vendor || '—'}</td><td>{p.collection || '—'}</td><td>{p.variantCount ?? '—'}</td><td>{typeof p.price === 'number' ? '₹' + p.price.toLocaleString('en-IN') : '—'}</td>
      </tr>)}</tbody></table></div>
      {!loading && visible.length === 0 && <div className="studio-empty">{searched ? 'No products found. Try another search.' : 'Search the catalogue to find and manage products.'}</div>}
      {rows.length > 25 && <footer className="studio-pager"><span>{rows.length} results · Page {page} of {pages}</span><div><button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button><button disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next</button></div></footer>}
         </section>
     {showExport && <div className="studio-export-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setShowExport(false); }}>
       <div className="studio-export-dialog" role="dialog" aria-modal="true" aria-labelledby="studio-export-title">
         <h2 id="studio-export-title">Export products</h2>
         <p>Download an Excel (.xlsx) file.</p>
         <div className="studio-export-options">
           <label className="studio-export-option"><input type="radio" name="studio-export-scope" checked={exportScope === 'selected'} disabled={!selected.length} onChange={() => setExportScope('selected')} /><span>Selected products ({selected.length})</span></label>
           <label className="studio-export-option"><input type="radio" name="studio-export-scope" checked={exportScope === 'search'} disabled={!searchHandles.length} onChange={() => setExportScope('search')} /><span>All {searchHandles.length} search results</span></label>
         </div>
         <p className="studio-export-help">Search results include only products returned by the current search.</p>
         <div className="studio-actions" style={{justifyContent:'flex-end'}}>
           <button type="button" className="studio-secondary" onClick={() => setShowExport(false)}>Cancel</button>
           <button type="button" className="studio-primary" disabled={transferring || (exportScope === 'selected' ? !selected.length : !searchHandles.length)} onClick={() => void exportExcel(exportScope)}>Export Excel</button>
         </div>
       </div>
     </div>}
   </main>;
}
