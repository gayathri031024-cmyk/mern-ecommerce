import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { productService } from '@/services/productService';
import { useCategories } from '@/hooks/useCategories';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/contexts/ToastContext';
import { ROUTES } from '@/utils/constants';
import { ProductFormValues } from '@/types';

const emptyForm: ProductFormValues = {
  title: '',
  description: '',
  price: 0,
  compareAtPrice: undefined,
  stock: 0,
  sku: '',
  brand: '',
  categoryId: '',
  tags: '',
  images: [],
};

export function AdminProductFormPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: categories } = useCategories();

  const [form, setForm] = useState<ProductFormValues>(emptyForm);

  const { data: existingProduct } = useQuery({
    queryKey: queryKeys.products.detail(id ?? ''),
    queryFn: () => productService.getById(id as string),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (existingProduct) {
      setForm({
        title: existingProduct.title,
        description: existingProduct.description,
        price: existingProduct.price,
        compareAtPrice: existingProduct.compareAtPrice,
        stock: existingProduct.stock,
        sku: existingProduct.sku,
        brand: existingProduct.brand ?? '',
        categoryId: existingProduct.category.id,
        tags: existingProduct.tags.join(', '),
        images: existingProduct.images.map((image) => image.url),
      });
    }
  }, [existingProduct]);

  const saveMutation = useMutation({
    mutationFn: () =>
      isEditMode ? productService.update(id as string, form) : productService.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      showToast({ title: isEditMode ? 'Product updated' : 'Product created', variant: 'success' });
      navigate(ROUTES.ADMIN_PRODUCTS);
    },
    onError: () => showToast({ title: 'Save failed', variant: 'error' }),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    saveMutation.mutate();
  }

  function updateField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">{isEditMode ? 'Edit product' : 'New product'}</h1>
      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Title"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              required
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={(event) => updateField('price', Number(event.target.value))}
                required
              />
              <Input
                label="Compare-at price"
                type="number"
                step="0.01"
                value={form.compareAtPrice ?? ''}
                onChange={(event) =>
                  updateField('compareAtPrice', event.target.value ? Number(event.target.value) : undefined)
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Stock"
                type="number"
                value={form.stock}
                onChange={(event) => updateField('stock', Number(event.target.value))}
                required
              />
              <Input
                label="SKU"
                value={form.sku}
                onChange={(event) => updateField('sku', event.target.value)}
                required
              />
            </div>
            <Select
              label="Category"
              placeholder="Select a category"
              value={form.categoryId}
              onChange={(event) => updateField('categoryId', event.target.value)}
              options={(categories ?? []).map((category) => ({ label: category.name, value: category.id }))}
              required
            />
            <Input
              label="Tags"
              hint="Comma-separated"
              value={form.tags}
              onChange={(event) => updateField('tags', event.target.value)}
            />
            <Button type="submit" isLoading={saveMutation.isPending} className="self-start">
              {isEditMode ? 'Save changes' : 'Create product'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
