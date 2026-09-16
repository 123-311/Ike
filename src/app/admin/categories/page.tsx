import { prisma } from "@/lib/db";
import SimpleCreateForm from "@/components/admin/SimpleCreateForm";
import ToggleButton from "@/components/admin/ToggleButton";
import { createCategoryAction, toggleCategoryActiveAction } from "@/app/admin/catalog/actions";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Categories</h1>
      <SimpleCreateForm
        action={createCategoryAction}
        fields={[
          { name: "name", placeholder: "Category name", required: true },
          { name: "icon", placeholder: "Icon (optional)" },
        ]}
        submitLabel="Add category"
      />
      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-surface p-3 flex items-center justify-between">
            <span className={c.active ? "" : "text-muted line-through"}>{c.name}</span>
            <ToggleButton active={c.active} onToggle={toggleCategoryActiveAction.bind(null, c.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}
