'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import knaufSystemsData from '@/data/knauf-systems.json';
import defaultPricesData from '@/data/default-prices.json';
import { CheckCircle, Save, Loader2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { KnaufSystemDefinition } from '@/lib/engine/types';
import { useAuth } from '@/lib/auth/AuthContext';


export default function CatalogPage() {
  const { permissions } = useAuth();
  const [activeTab, setActiveTab] = useState<'SYSTEMS' | 'PRICES'>('SYSTEMS');
  const [systems] = useState<KnaufSystemDefinition[]>(
    knaufSystemsData as unknown as KnaufSystemDefinition[]
  );
  const [prices, setPrices] = useState<Record<string, number>>(defaultPricesData);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Editing state for prices
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editPriceVal, setEditPriceVal] = useState<number>(0);
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // New product form
  const [newProductName, setNewProductName] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('pcs');
  const [newProductPrice, setNewProductPrice] = useState<number>(10);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch('/api/catalog');
        if (res.ok) {
          const data = await res.json();
          if (data.prices) setPrices(data.prices);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadCatalog();
  }, []);

  const filteredSystems = systems.filter((s) => {
    const matchesCat = categoryFilter === 'ALL' || s.category === categoryFilter;
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const filteredPrices = Object.entries(prices).filter(([name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartEdit = (name: string, price: number) => {
    setEditingProduct(name);
    setEditPriceVal(price);
  };

  const handleSavePrice = async (name: string) => {
    setIsSavingPrice(true);
    try {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: name, priceAed: editPriceVal }),
      });
      if (res.ok) {
        setPrices((prev) => ({ ...prev, [name]: editPriceVal }));
        setEditingProduct(null);
        setSaveSuccessMsg(`Updated ${name} to AED ${editPriceVal.toFixed(3)}`);
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } catch {
      alert('Failed to update price');
    } finally {
      setIsSavingPrice(false);
    }
  };

  const handleAddNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName) return;
    try {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: newProductName,
          unit: newProductUnit,
          priceAed: newProductPrice,
        }),
      });
      if (res.ok) {
        setPrices((prev) => ({ ...prev, [newProductName]: newProductPrice }));
        setNewProductName('');
        setSaveSuccessMsg(`Added new product ${newProductName}`);
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } catch {
      alert('Failed to add product');
    }
  };

  return <div><PageHeader title="Systems and Item Prices" />
    {saveSuccessMsg && <p role="status" className="mb-4 flex items-center gap-2 rounded bg-green-50 p-3 text-sm text-green-800"><CheckCircle size={15} />{saveSuccessMsg}</p>}
    <div className="quote-panel overflow-hidden"><div className="desk-tabs" role="tablist" aria-label="Catalog"><button role="tab" id="systems-tab" aria-controls="catalog-panel" aria-selected={activeTab === 'SYSTEMS'} onClick={() => { setActiveTab('SYSTEMS'); setSearch(''); }}>Knauf Systems</button><button role="tab" id="prices-tab" aria-controls="catalog-panel" aria-selected={activeTab === 'PRICES'} onClick={() => { setActiveTab('PRICES'); setSearch(''); }}>Item Prices</button></div>
    <div className="desk-list-toolbar"><div className="w-full sm:w-72"><label htmlFor="catalog-search" className="quote-label">{activeTab === 'SYSTEMS' ? 'System' : 'Item name'}</label><input id="catalog-search" className="quote-input" value={search} onChange={event => setSearch(event.target.value)} placeholder={activeTab === 'SYSTEMS' ? 'Search by code or description' : 'Search items'} /></div>{activeTab === 'SYSTEMS' && <div className="w-48"><label htmlFor="system-category" className="quote-label">Category</label><select id="system-category" className="quote-input" value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}>{['ALL','CEILING','PARTITION','SHAFT_WALL','WALL_LINING'].map(category => <option key={category} value={category}>{category === 'ALL' ? 'All categories' : category.replaceAll('_',' ').toLowerCase()}</option>)}</select></div>}</div>
    <div id="catalog-panel" role="tabpanel" aria-labelledby={activeTab === 'SYSTEMS' ? 'systems-tab' : 'prices-tab'} className="desk-table-scroll">
      {activeTab === 'SYSTEMS' ? <table className="desk-table"><thead><tr><th>System Code</th><th>Description</th><th>Category</th><th><span className="sr-only">Action</span></th></tr></thead><tbody>{filteredSystems.map(system => <tr key={system.code}><td className="align-top font-medium">{system.code}</td><td className="min-w-64"><p>{system.name.replace(/^KNAUF SYSTEM\s*/i,'')}</p><p className="mt-1 text-xs leading-5 text-slate-500">{system.description}</p><details className="mt-2"><summary className="cursor-pointer text-xs text-slate-500">View {system.baseMaterials.length} items</summary><ul className="mt-3 space-y-2 text-xs text-slate-500">{system.baseMaterials.map((item,index) => <li key={index}>{item.productName} · {item.factorPerM2} {item.unit}/m²</li>)}</ul>{system.supportsDeflection && <p className="mt-3 text-xs text-slate-500">Head deflection available</p>}</details></td><td className="align-top whitespace-nowrap capitalize text-slate-500">{system.category.replaceAll('_',' ').toLowerCase()}</td><td className="align-top">{permissions?.canCreateQuote !== false && <Link href={`/quotes/new?systemCode=${system.code}`} className="quote-button-secondary whitespace-nowrap">Create Quotation</Link>}</td></tr>)}{filteredSystems.length === 0 && <tr><td colSpan={4} className="text-center text-slate-500">No systems match your search.</td></tr>}</tbody></table> : <table className="desk-table"><thead><tr><th>Item Name</th><th className="text-right">Rate (AED)</th>{permissions?.canManagePrices && <th><span className="sr-only">Actions</span></th>}</tr></thead><tbody>{filteredPrices.map(([name,price]) => <tr key={name}><td className="min-w-64">{name}</td><td className="text-right tabular-nums">{editingProduct === name ? <input aria-label={`Rate for ${name}`} className="quote-input max-w-32 text-right" type="number" min="0" step="0.001" value={editPriceVal} onChange={event => setEditPriceVal(Number(event.target.value))} /> : price.toFixed(3)}</td>{permissions?.canManagePrices && <td className="text-right">{editingProduct === name ? <div className="flex justify-end gap-2"><button className="quote-button-primary" disabled={isSavingPrice} onClick={() => void handleSavePrice(name)}>{isSavingPrice ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save</button><button className="quote-button-secondary" onClick={() => setEditingProduct(null)}>Cancel</button></div> : <button className="quote-button-secondary" onClick={() => handleStartEdit(name,price)}>Edit</button>}</td>}</tr>)}{filteredPrices.length === 0 && <tr><td colSpan={3} className="text-center text-slate-500">No items match your search.</td></tr>}</tbody></table>}
    </div><p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">{activeTab === 'SYSTEMS' ? `${filteredSystems.length} systems` : `${filteredPrices.length} item prices`}</p></div>
    {activeTab === 'PRICES' && permissions?.canManagePrices && <details className="quote-panel desk-form-details mt-5"><summary className="cursor-pointer">Add Item Price</summary><form className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-3" onSubmit={handleAddNewProduct}><div><label className="quote-label" htmlFor="new-item">Item Name</label><input id="new-item" className="quote-input" required value={newProductName} onChange={event => setNewProductName(event.target.value)} /></div><div><label className="quote-label" htmlFor="new-unit">Unit</label><select id="new-unit" className="quote-input" value={newProductUnit} onChange={event => setNewProductUnit(event.target.value)}>{['pcs','m²','m','kg','bags','buckets'].map(unit => <option key={unit}>{unit}</option>)}</select></div><div><label className="quote-label" htmlFor="new-rate">Rate (AED)</label><input id="new-rate" className="quote-input" required type="number" min="0" step="0.001" value={newProductPrice} onChange={event => setNewProductPrice(Number(event.target.value))} /></div><button className="quote-button-primary justify-self-start" type="submit">Add Item Price</button></form></details>}
  </div>;
}