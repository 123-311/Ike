"use client";

export default function FilterBar({
  q,
  categoryId,
  countyId,
  sort,
  categories,
  counties,
}: {
  q: string;
  categoryId: string;
  countyId: string;
  sort: string;
  categories: { id: string; name: string }[];
  counties: { id: string; name: string }[];
}) {
  return (
    <form action="/deals" method="GET" className="grid grid-cols-3 gap-2 mb-5 text-sm">
      {q && <input type="hidden" name="q" value={q} />}
      <select
        name="category"
        defaultValue={categoryId}
        className="rounded-lg border border-border bg-surface px-2 py-2"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        name="county"
        defaultValue={countyId}
        className="rounded-lg border border-border bg-surface px-2 py-2"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="">All counties</option>
        {counties.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        name="sort"
        defaultValue={sort}
        className="rounded-lg border border-border bg-surface px-2 py-2"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="latest">Latest</option>
        <option value="discount">Biggest discount</option>
        <option value="expiring">Expiring soon</option>
      </select>
    </form>
  );
}
