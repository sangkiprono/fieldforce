import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  unit_cost: number | null;
  total_quantity: number;
}

interface Technician {
  id: string;
  name: string;
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const navigate = useNavigate();

  const [showNewItem, setShowNewItem] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("pcs");
  const [newQty, setNewQty] = useState("");

  const [allocItem, setAllocItem] = useState("");
  const [allocTech, setAllocTech] = useState("");
  const [allocQty, setAllocQty] = useState("");
  const [allocating, setAllocating] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = async () => {
    const [itemsRes, techsRes] = await Promise.all([
      client.get("/inventory/items"),
      client.get("/auth/technicians"),
    ]);
    setItems(itemsRes.data);
    setTechnicians(techsRes.data);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreateItem = async () => {
    if (!newName || !newQty) return;
    await client.post("/inventory/items", {
      name: newName,
      unit: newUnit,
      total_quantity: parseInt(newQty),
    });
    setNewName("");
    setNewUnit("pcs");
    setNewQty("");
    setShowNewItem(false);
    await fetchAll();
  };

  const handleAllocate = async () => {
    if (!allocItem || !allocTech || !allocQty) return;
    setError("");
    setAllocating(true);
    try {
      await client.post("/inventory/allocate", {
        technician_id: allocTech,
        item_id: allocItem,
        quantity: parseInt(allocQty),
      });
      setAllocItem("");
      setAllocTech("");
      setAllocQty("");
      await fetchAll();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to allocate stock");
    } finally {
      setAllocating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Inventory</h1>
          <p className="text-sm text-slate-500">Warehouse stock & technician allocations</p>
        </div>
        <button
          onClick={() => navigate("/manager")}
          className="border border-slate-300 text-slate-600 px-4 py-2 rounded hover:bg-slate-100 transition"
        >
          ← Back to Dashboard
        </button>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-slate-800">Warehouse Stock</h2>
            <button
              onClick={() => setShowNewItem(!showNewItem)}
              className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
            >
              + New Item
            </button>
          </div>

          {showNewItem && (
            <div className="border border-slate-200 rounded p-3 mb-4 bg-slate-50 flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">Item name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Router (TP-Link)"
                  className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs text-slate-500 mb-1">Unit</label>
                <input
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div className="w-24">
                <label className="block text-xs text-slate-500 mb-1">Quantity</label>
                <input
                  type="number"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <button
                onClick={handleCreateItem}
                className="bg-slate-800 text-white px-3 py-1.5 rounded text-sm hover:bg-slate-900"
              >
                Add
              </button>
            </div>
          )}

          {items.length === 0 ? (
            <p className="text-sm text-slate-400">No inventory items yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-2">Item</th>
                  <th className="py-2">Unit</th>
                  <th className="py-2">Warehouse Qty</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50">
                    <td className="py-2 font-medium text-slate-800">{item.name}</td>
                    <td className="py-2 text-slate-500">{item.unit}</td>
                    <td className="py-2">{item.total_quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Allocate Stock to Technician</h2>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">Item</label>
              <select
                value={allocItem}
                onChange={(e) => setAllocItem(e.target.value)}
                className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
              >
                <option value="">Select item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} ({item.total_quantity} in stock)</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">Technician</label>
              <select
                value={allocTech}
                onChange={(e) => setAllocTech(e.target.value)}
                className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
              >
                <option value="">Select technician</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-xs text-slate-500 mb-1">Quantity</label>
              <input
                type="number"
                value={allocQty}
                onChange={(e) => setAllocQty(e.target.value)}
                className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
              />
            </div>
            <button
              onClick={handleAllocate}
              disabled={allocating}
              className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {allocating ? "Allocating..." : "Allocate"}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      </main>
    </div>
  );
}
