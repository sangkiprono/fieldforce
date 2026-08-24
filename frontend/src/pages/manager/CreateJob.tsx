import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
}

const issueTypes = ["no_connectivity", "slow_speed", "new_installation", "router_swap", "other"];
const priorities = ["low", "medium", "high"];

export default function CreateJob() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [issueType, setIssueType] = useState("no_connectivity");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const navigate = useNavigate();

  const fetchCustomers = async () => {
    const res = await client.get("/customers");
    setCustomers(res.data);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async () => {
    if (!newName || !newPhone || !newAddress) return;
    const res = await client.post("/customers", { name: newName, phone: newPhone, address: newAddress });
    setCustomers([res.data, ...customers]);
    setCustomerId(res.data.id);
    setShowNewCustomer(false);
    setNewName("");
    setNewPhone("");
    setNewAddress("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!customerId) {
      setError("Please select or add a customer");
      return;
    }
    setSubmitting(true);
    try {
      await client.post("/jobs", {
        customer_id: customerId,
        issue_type: issueType,
        priority,
        description,
      });
      navigate("/manager");
    } catch (err) {
      setError("Failed to create job. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate("/manager")} className="text-sm text-slate-500 hover:text-slate-700 mb-4">
          ← Back to Dashboard
        </button>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h1 className="text-xl font-bold text-slate-800 mb-6">Create New Job</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
              {!showNewCustomer ? (
                <div className="flex gap-2">
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="flex-1 border border-slate-300 rounded px-3 py-2"
                  >
                    <option value="">Select a customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.phone}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomer(true)}
                    className="border border-slate-300 px-3 py-2 rounded text-sm text-slate-600 hover:bg-slate-100"
                  >
                    + New
                  </button>
                </div>
              ) : (
                <div className="border border-slate-200 rounded p-3 space-y-2 bg-slate-50">
                  <input
                    placeholder="Customer name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Phone number"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Address"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddCustomer}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
                    >
                      Save Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewCustomer(false)}
                      className="text-slate-500 text-sm px-3 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Issue Type</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2"
              >
                {issueTypes.map((t) => (
                  <option key={t} value={t}>{t.replace("_", " ")}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2"
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-slate-300 rounded px-3 py-2"
                placeholder="Describe the issue..."
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Job"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
