import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { useExternalProducts } from '@/hooks/useExternalProducts';
import { groupProductsByName } from '@/utils/groupProducts';

const EXCLUDE_KEYS = new Set(['id', 'name', 'SKU', 'image_url', 'image', 'variants']);

const PropertiesGrid = ({ variant }: { variant: Record<string, any> }) => {
  const entries = useMemo(
    () =>
      Object.entries(variant ?? {}).filter(
        ([key]) => !EXCLUDE_KEYS.has(key) && variant[key] !== undefined && variant[key] !== null && variant[key] !== ''
      ),
    [variant]
  );

  if (!entries.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-lg border px-4 py-3 bg-muted/30">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{key.replace(/_/g, ' ')}</p>
          <p className="mt-1 text-sm font-semibold">{String(value)}</p>
        </div>
      ))}
    </div>
  );
};

const ProductDetailPage = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const decodedName = name ? decodeURIComponent(name) : '';
  const [selectedSKU, setSelectedSKU] = useState<string | undefined>(undefined);

  const { data } = useExternalProducts({ size: 100, page: 1 });
  const grouped = useMemo(() => groupProductsByName(data?.data ?? []), [data]);
  const group = useMemo(
    () => grouped.find((entry) => entry.name === decodedName) ?? (location.state as any)?.group,
    [grouped, decodedName, location.state]
  );

  useEffect(() => {
    if (group && !selectedSKU) {
      setSelectedSKU(group.variants[0]?.SKU);
    }
  }, [group, selectedSKU]);

  const selectedVariant = useMemo(
    () => group?.variants.find((variant) => variant.SKU === selectedSKU) ?? group?.variants[0],
    [group, selectedSKU]
  );

  if (!group) {
    return (
      <div className="p-8">
        <PageHeader title="Product not found" description="Return to the list to pick another product." />
        <Button onClick={() => navigate('/products')}>Back to Product List</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-8 py-8">
      <PageHeader title={group.name} description={`${group.variantCount} variant${group.variantCount > 1 ? 's' : ''}`} />
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Select Variant</p>
            <select
              value={selectedSKU}
              onChange={(event) => setSelectedSKU(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 bg-background outline-none"
            >
              {group.variants.map((variant) => (
                <option key={variant.SKU || variant.id} value={variant.SKU}>
                  {variant.name ? `${variant.name} (${variant.SKU || variant.id})` : variant.SKU || variant.id}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-start gap-2">
            <Button variant="outline" className="h-12 px-4" onClick={() => navigate(-1)}>
              Back
            </Button>
            {selectedVariant?.image_url && (
              <img src={selectedVariant.image_url} alt={group.name} className="h-24 w-24 rounded-lg object-cover" />
            )}
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Status</p>
          <Badge variant={selectedVariant?.status === 'available' ? 'secondary' : 'outline'}>
            {selectedVariant?.status || 'Unknown'}
          </Badge>
        </div>
        <PropertiesGrid variant={selectedVariant ?? {}} />
      </div>
    </div>
  );
};

export default ProductDetailPage;

