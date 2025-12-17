"use client";

import LayoutShell from "@/components/LayoutShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import { useEffect, useMemo, useState } from "react";
import { api_listItems, api_patchItem } from "@/lib/mockDb";
import { formatDate } from "@/lib/utils";
import type { Item } from "@/lib/types";
import Link from "next/link";
import { getCategoryImage } from "@/lib/categoryImages";

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"in_fridge" | "removed">("in_fridge");

  async function load() {
    const it = await api_listItems(status);
    setItems(it);
  }

  useEffect(() => { load(); }, [status]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter(i =>
      !s || i.label.toLowerCase().includes(s) || i.category.toLowerCase().includes(s)
    );
  }, [items, q]);

  async function editExpiry(item: Item) {
    const val = prompt("Enter expiration date (YYYY-MM-DD) or ISO string:", item.expiresAt ?? "");
    if (!val) return;
    const d = new Date(val);
    if (isNaN(d.getTime())) return alert("Invalid date");
    await api_patchItem(item.id, { expiresAt: d.toISOString() });
    load();
  }

  async function markRemoved(item: Item) {
    await api_patchItem(item.id, { status: "removed" });
    load();
  }

  return (
    <LayoutShell>
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Inventory</h1>
            <p className="text-sm text-gray-600">Search, edit expiration, and manage items.</p>
          </div>
          <Button variant="secondary" onClick={load}>Refresh</Button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="w-64"><Input placeholder="Search items…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="in_fridge">In fridge</option>
            <option value="removed">Removed</option>
          </Select>
          <Badge>{filtered.length} shown</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((i) => (
            <Card key={i.id} className="p-3">
            <Link href={`/inventory/${i.id}`} className="block">
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded bg-gray-100 overflow-hidden border flex items-center justify-center">
                  {getCategoryImage(i.label) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getCategoryImage(i.label)!}
                      alt={i.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-gray-500 text-center px-1">
                      No class image
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{i.label}</div>
                  <div className="text-xs text-gray-600">{i.category} • conf {Math.round(i.confidence * 100)}%</div>
                  <div className="text-xs text-gray-600 mt-1">Added: {formatDate(i.createdAt)}</div>
                  <div className="text-sm mt-1">Exp: {formatDate(i.expiresAt)}</div>
                </div>
              </div>
              </Link>

              <div className="mt-3 flex gap-2">
                <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => editExpiry(i)}>
                  Edit expiry
                </Button>
                {status === "in_fridge" && (
                  <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => markRemoved(i)}>
                    Mark removed
                  </Button>
                )}
              </div>
            </Card>
          ))}

          {filtered.length === 0 && (
            <Card className="p-4 text-sm text-gray-600">
              No items match. Try running <b>Scan In</b>.
            </Card>
          )}
        </div>
      </div>
    </LayoutShell>
  );
}
