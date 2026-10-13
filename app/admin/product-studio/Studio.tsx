'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { getCatalogThumbnailUrl } from '@/lib/catalog/thumbnail';
import { parseProductExcel } from '@/lib/admin/excel-product-import';
import './studio.css';

type Item = { handle: string; title: string; image?: string; imageFolder?: string; partNumber?: string; vendor?: string; collection?: string; variantCount?: number; price?: number };
type ExportScope = 'selected' | 'all';

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
  const [scope, setScope] = useState<ExportScope>('selected');

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

  async function exportExcel(exportScope: ExportScope) {
    if (exportScope === 'selected' && selected.length === 0) { setError('Select at least one product.'); return; }
    setShowExport(false); setTransferring(true); setError('');
    setTransferNotice(exportScope === 'all' ? 'Preparing full catalogue Excel export…' : `Preparing ${selected.length} selected products…`);
    try {
      const endpoint = exportScope === 'selected'
        ? '/api/admin/export?handles=' + encodeURIComponent(selected.join(','))
        : '/api/admin/export';
      const response = await fetch(endpoint);
      const data = await response.json();
      if (!response.ok || !data.success) throw Error(data.error || 'Export failed');
      if (!Array.isArray(data.rows) || !data.rows.length) throw Error('No products to export');
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.rows), 'Products');
      XLSX.writeFile(workbook, exportScope === 'all' ? 'sparesco-all-products.xlsx' : 'sparesco-selected-products.xlsx');
      setTransferNotice(`Exported ${data.productCount ?? 'selected'} products (${data.rows.length} Excel rows).`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Export failed'); setTransferNotice(''); }
    finally { setTransferring(false); }
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
        <button type="button" className="studio-secondary" disabled={transferring} onClick={() => { setScope(selected.length ? 'selected' : 'all'); setShowExport(true); }}>Export Excel</button>
        <Link className="studio-primary" href="/admin/product-studio/new">+ Add product</Link>
      </div>
    </header>
    <section className="studio-panel">
      {transferNotice && <div className="studio-notice" role="status">{transferNotice}</div>}
      <form className="studio-search" onSubmit={search}><input aria-label="Search products" value={q} onChange={e => setQ(e.target.value)} placeholder="Search by product name, SKU or part number" /><button disabled={loading}>{loading ? 'Searching…' : 'Search'}</button></form>
      {error && <div className="studio-error" role="alert">{error}</div>}
      {selected.length > 0 && <div className="studio-notice" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <strong>{selected.length} selected</strong>
        <button type="button" className="studio-secondary" disabled={transferring} onClick={() => { setScope('selected'); setShowExport(true); }}>Export selected</button>
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
    {showExport && <div role="presentation" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'grid', placeItems: 'center', padding: 16 }}>
      <div role="dialog" aria-modal="true" aria-label="Export products" className="studio-panel" style={{ width: '100%', maxWidth: 430, padding: 24 }}>
        <h2>Export products</h2><p>Download an Excel (.xlsx) file.</p>
        <label style={{ display: 'block', margin: '16px 0' }}><input type="radio" name="export-scope" checked={scope === 'selected'} disabled={!selected.length} onChange={() => setScope('selected')} /> Selected products ({selected.length})</label>
        <label style={{ display: 'block', margin: '16px 0' }}><input type="radio" name="export-scope" checked={scope === 'all'} onChange={() => setScope('all')} /> All products in catalogue</label>
        <p style={{ fontSize: 12 }}>Full catalogue exports may time out on large catalogues with the current API.</p>
        <div className="studio-actions" style={{ justifyContent: 'flex-end' }}><button type="button" className="studio-secondary" onClick={() => setShowExport(false)}>Cancel</button><button type="button" className="studio-primary" onClick={() => void exportExcel(scope)}>Export Excel</button></div>
      </div>
    </div>}
  </main>;
}
