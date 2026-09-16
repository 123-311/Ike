import { prisma } from "@/lib/db";
import SimpleCreateForm from "@/components/admin/SimpleCreateForm";
import ToggleButton from "@/components/admin/ToggleButton";
import { createCountyAction, toggleCountyActiveAction } from "@/app/admin/catalog/actions";

export default async function AdminCountiesPage() {
  const counties = await prisma.county.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Counties</h1>
      <p className="text-sm text-muted mb-4">{counties.length} counties configured.</p>
      <SimpleCreateForm
        action={createCountyAction}
        fields={[
          { name: "name", placeholder: "County name", required: true },
          { name: "code", placeholder: "Code", required: true },
        ]}
        submitLabel="Add county"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {counties.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-surface p-3 flex items-center justify-between">
            <span className={c.active ? "" : "text-muted line-through"}>
              {c.code} · {c.name}
            </span>
            <ToggleButton active={c.active} onToggle={toggleCountyActiveAction.bind(null, c.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}
