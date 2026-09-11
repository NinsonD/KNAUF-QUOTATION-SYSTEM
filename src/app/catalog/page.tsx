'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import knaufSystemsData from '@/data/knauf-systems.json';
import defaultPricesData from '@/data/default-prices.json';
import {
  Layers,
  Tag,
  PlusCircle,
  Search,
  CheckCircle,
  ShieldCheck,
  ArrowRight,
  Edit2,
  Save,
  Loader2,
} from 'lucide-react';
import { KnaufSystemDefinition } from '@/lib/engine/types';

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState<'SYSTEMS' | 'PRICES'>('SYSTEMS');
  const [systems, setSystems] = useState<KnaufSystemDefinition[]>(
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
    } catch (e) {
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
    } catch (e) {
      alert('Failed to add product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Catalog Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Knauf Systems Catalog & Master Prices
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse official Knauf system consumption factor templates and manage Al Namariq baseline pricing (AED).
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex rounded-xl bg-slate-200 p-1 border border-slate-300 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('SYSTEMS');
              setSearch('');
            }}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'SYSTEMS'
                ? 'bg-[#002060] text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            14 Knauf Systems
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('PRICES');
              setSearch('');
            }}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'PRICES'
                ? 'bg-[#002060] text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Master Price List ({Object.keys(prices).length})
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {saveSuccessMsg}
        </div>
      )}

      {/* Tab 1: Knauf Systems */}
      {activeTab === 'SYSTEMS' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search systems (KW111, D127, Ceiling...)"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002060] bg-slate-50/50"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              {['ALL', 'CEILING', 'PARTITION', 'SHAFT_WALL', 'WALL_LINING'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    categoryFilter === cat
                      ? 'bg-[#002060] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'ALL'
                    ? 'All (14)'
                    : cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Systems Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredSystems.map((sys) => (
              <div
                key={sys.code}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-blue-50 text-[#002060] border border-blue-200">
                      {sys.code}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {sys.category.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1.5">
                    {sys.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    {sys.description}
                  </p>

                  {/* Components summary list */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div className="text-[11px] font-bold uppercase text-slate-600 mb-2 flex items-center justify-between">
                      <span>Base Material Requirements ({sys.baseMaterials.length})</span>
                      <span>Factor / m²</span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-700 font-medium">
                      {sys.baseMaterials.slice(0, 5).map((mat, i) => (
                        <li key={i} className="flex items-center justify-between">
                          <span className="truncate max-w-[280px]">{mat.productName}</span>
                          <span className="font-mono text-slate-500 font-semibold text-[11px]">
                            {mat.factorPerM2} {mat.unit}
                          </span>
                        </li>
                      ))}
                      {sys.baseMaterials.length > 5 && (
                        <li className="text-[11px] text-slate-400 italic pt-1">
                          + {sys.baseMaterials.length - 5} additional fixing & jointing items
                        </li>
                      )}
                    </ul>
                  </div>

                  {sys.supportsDeflection && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Supports Head Deflection movement joints</span>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Standard Knauf Analysis
                  </span>
                  <Link
                    href={`/quotes/new?category=${sys.category}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#002060] hover:underline"
                  >
                    Generate Quotation <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Master Prices Editor */}
      {activeTab === 'PRICES' && (
        <div className="space-y-6">
          {/* Search and Add Form */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Master Material Price List (AED)
                </h3>
                <p className="text-xs text-slate-500">
                  Unit prices configured here automatically populate new quotations for Al Namariq.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter material names..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002060] bg-slate-50/50"
                />
              </div>
            </div>

            {/* Quick Add Product Bar */}
            <form onSubmit={handleAddNewProduct} className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="Add new material name..."
                className="sm:col-span-6 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002060]"
              />
              <select
                value={newProductUnit}
                onChange={(e) => setNewProductUnit(e.target.value)}
                className="sm:col-span-2 px-2 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="pcs">pcs</option>
                <option value="m²">m²</option>
                <option value="m">m</option>
                <option value="kg">kg</option>
                <option value="bags">bags</option>
              </select>
              <input
                type="number"
                step="0.001"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(parseFloat(e.target.value) || 0)}
                placeholder="AED Price"
                className="sm:col-span-2 px-3 py-2 text-xs font-mono rounded-lg border border-slate-300"
              />
              <button
                type="submit"
                className="sm:col-span-2 px-4 py-2 bg-[#002060] text-white text-xs font-bold rounded-lg hover:bg-[#002060]/90 transition-colors"
              >
                Add Material
              </button>
            </form>
          </div>

          {/* Prices Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Material Specification / Product Name</th>
                  <th className="py-3 px-4 w-40 text-right">Standard Price (AED)</th>
                  <th className="py-3 px-4 w-32 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPrices.map(([productName, price], idx) => {
                  const isEditing = editingProduct === productName;
                  return (
                    <tr key={productName} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 text-center font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {productName}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.001"
                            value={editPriceVal}
                            onChange={(e) => setEditPriceVal(parseFloat(e.target.value) || 0)}
                            className="w-28 px-2 py-1 text-right font-mono text-xs font-bold rounded border border-[#002060] bg-blue-50 focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <span className="font-mono font-bold text-slate-900">
                            AED {price.toFixed(3)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSavePrice(productName)}
                              disabled={isSavingPrice}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1"
                            >
                              {isSavingPrice ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingProduct(null)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(productName, price)}
                            className="px-2.5 py-1 text-xs font-semibold rounded hover:bg-slate-100 text-slate-600 hover:text-[#002060] flex items-center gap-1 mx-auto transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

