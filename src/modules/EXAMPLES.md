# 💡 أمثلة عملية

## أمثلة واقعية لاستخدام النظام الجديد

---

## 1️⃣ صفحة Dashboard كاملة

```typescript
// src/app/admin/dashboard/page.tsx
"use client";

import { DashboardView } from "@/modules/dashboard";

export default function DashboardPage() {
  return <DashboardView />;
}
```

**النتيجة:**
- ✅ إحصائيات شاملة
- ✅ قائمة أفضل السائقين
- ✅ آخر الرحلات
- ✅ تصميم احترافي
- ✅ Loading states
- ✅ Error handling

---

## 2️⃣ صفحة مع Filters وSearch

```typescript
// src/app/admin/products/page.tsx
"use client";

import { useState } from "react";
import {
  PageHeader,
  DataTable,
  LoadingPage,
} from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Search, Plus } from "lucide-react";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      key: "name",
      label: "Product",
      render: (product) => (
        <div>
          <p className="font-medium">{product.name}</p>
          <p className="text-sm text-muted-foreground">{product.sku}</p>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
    },
    {
      key: "price",
      label: "Price",
      render: (product) => (
        <span className="font-semibold">${product.price}</span>
      ),
    },
    {
      key: "stock",
      label: "Stock",
      render: (product) => (
        <span className={product.stock > 0 ? "text-green-600" : "text-red-600"}>
          {product.stock}
        </span>
      ),
    },
  ];

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product inventory"
        action={{
          label: "Add Product",
          onClick: () => console.log("add"),
          icon: Plus,
        }}
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="clothing">Clothing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <DataTable
        data={products}
        columns={columns}
        loading={loading}
        emptyMessage="No products found"
      />
    </div>
  );
}
```

---

## 3️⃣ صفحة مع Modal للإضافة/التعديل

```typescript
// src/app/admin/categories/page.tsx
"use client";

import { useState } from "react";
import { PageHeader, DataTable } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const handleSubmit = () => {
    if (editingId) {
      // Update
      console.log("Update", editingId, formData);
    } else {
      // Create
      console.log("Create", formData);
    }
    setOpen(false);
    setFormData({ name: "", description: "" });
    setEditingId(null);
  };

  const handleEdit = (category: any) => {
    setEditingId(category.id);
    setFormData({ name: category.name, description: category.description });
    setOpen(true);
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (cat) => <span className="font-medium">{cat.name}</span>,
    },
    {
      key: "description",
      label: "Description",
    },
    {
      key: "actions",
      label: "Actions",
      render: (cat) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log("delete", cat.id)}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Manage product categories"
        action={{
          label: "Add Category",
          onClick: () => setOpen(true),
          icon: Plus,
        }}
      />

      <DataTable data={categories} columns={columns} />

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## 4️⃣ صفحة مع Tabs

```typescript
// src/app/admin/settings/page.tsx
"use client";

import { PageHeader } from "@/components/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your application settings"
      />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="app-name">Application Name</Label>
                <Input id="app-name" defaultValue="My App" />
              </div>
              <div>
                <Label htmlFor="app-url">Application URL</Label>
                <Input id="app-url" defaultValue="https://example.com" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Notification settings */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Security settings */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## 5️⃣ صفحة مع Stats Cards

```typescript
// src/app/admin/analytics/page.tsx
"use client";

import { PageHeader, StatCard } from "@/components/shared";
import { Users, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="View your business analytics"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="$45,231"
          icon={DollarSign}
          variant="success"
          trend={{ value: 20.1, label: "from last month" }}
        />
        <StatCard
          title="Total Orders"
          value="2,350"
          icon={ShoppingCart}
          variant="primary"
          trend={{ value: 15.3, label: "from last month" }}
        />
        <StatCard
          title="Total Customers"
          value="1,234"
          icon={Users}
          variant="default"
          trend={{ value: 8.2, label: "from last month" }}
        />
        <StatCard
          title="Growth Rate"
          value="23.5%"
          icon={TrendingUp}
          variant="warning"
          trend={{ value: 5.4, label: "from last month" }}
        />
      </div>

      {/* Charts would go here */}
    </div>
  );
}
```

---

## 6️⃣ Custom Hook مع Error Handling

```typescript
// src/modules/products/hooks/useProducts.ts
"use client";

import { useState, useEffect } from "react";
import { Product } from "../types";
import { ProductsService } from "../services/products.service";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ProductsService.getProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (data: Partial<Product>) => {
    try {
      await ProductsService.createProduct(data);
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
      throw err;
    }
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    try {
      await ProductsService.updateProduct(id, data);
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product");
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await ProductsService.deleteProduct(id);
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
      throw err;
    }
  };

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
```

---

## 7️⃣ Service مع Authentication

```typescript
// src/modules/products/services/products.service.ts
import { Product } from "../types";

export class ProductsService {
  private static getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  static async getProducts(): Promise<Product[]> {
    const response = await fetch("/api/products", {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }

    return response.json();
  }

  static async getProduct(id: string): Promise<Product> {
    const response = await fetch(`/api/products/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch product");
    }

    return response.json();
  }

  static async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create product");
    }

    return response.json();
  }

  static async updateProduct(
    id: string,
    data: Partial<Product>
  ): Promise<Product> {
    const response = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update product");
    }

    return response.json();
  }

  static async deleteProduct(id: string): Promise<void> {
    const response = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to delete product");
    }
  }
}
```

---

## 8️⃣ Component مع Loading وError States

```typescript
// src/modules/products/components/ProductsView.tsx
"use client";

import { useProducts } from "../hooks/useProducts";
import {
  PageHeader,
  DataTable,
  LoadingPage,
  ErrorAlert,
} from "@/components/shared";
import { Plus } from "lucide-react";

export function ProductsView() {
  const { products, loading, error, refetch } = useProducts();

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Products" />
        <ErrorAlert
          message={error}
          onRetry={refetch}
        />
      </div>
    );
  }

  const columns = [
    {
      key: "name",
      label: "Product",
      render: (product) => (
        <div>
          <p className="font-medium">{product.name}</p>
          <p className="text-sm text-muted-foreground">{product.sku}</p>
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (product) => (
        <span className="font-semibold">${product.price}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your products"
        action={{
          label: "Add Product",
          onClick: () => console.log("add"),
          icon: Plus,
        }}
      />

      <DataTable
        data={products}
        columns={columns}
        emptyMessage="No products found"
      />
    </div>
  );
}
```

---

## 🎯 الخلاصة

هذه الأمثلة توضح:
- ✅ كيفية بناء صفحات كاملة
- ✅ استخدام Shared Components
- ✅ إنشاء Custom Hooks
- ✅ كتابة Services
- ✅ Error Handling
- ✅ Loading States
- ✅ Forms وDialogs
- ✅ Filters وSearch
- ✅ Stats وAnalytics

استخدم هذه الأمثلة كنقطة انطلاق لبناء features جديدة! 🚀
