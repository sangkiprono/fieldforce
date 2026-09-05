import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import { useAuth } from "../../context/AuthContext";

interface StockEntry {
  id: string;
  item: { id: string; name: string; unit: string };
  quantity: number;
}

export default function MyStock() {
  const [stock, setStock] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    client.get("/inventory/my-stock").then((res) => {
      setStock(res.data);
      setLoading(false);
    });
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">My Stock</h1>
          <p className="text-sm text-slate-500">{user?.name}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/technician")}
            className="border border-slate-300 text-slate-600 px-4 py-2 rounded hover:bg-slate-100 transition"
          >
            My Jobs
          </button>
          <button
            onClick={handleLogout}
            className="border border-slate-300 text-slate-600 px-4 py-2 rounded hover:bg-slate-100 transition"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="p-6 max-w-xl mx-auto">
        {loading ? (
          <p className="text-slate-500">Loading stock...</p>
        ) : stock.length === 0 ? (
          <p className="text-slate-500">No stock currently allocated to you.</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600 text-left">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{s.item.name}</td>
                    <td className="px-4 py-3">{s.quantity} {s.item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
