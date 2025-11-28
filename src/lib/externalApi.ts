// External Product API Service
// Fetches products from staging API and maps to InventoryItem structure

interface ExternalProduct {
  id: number;
  name: string;
  SKU: string | null;
  supplier_name: string | null;
  pm_category: string;
  type: string;
  description: string | null;
  uom: string;
  supply_price: number;
  install_price: number;
  color: string | null;
  material: string | null;
  width: string | null;
  height: string | null;
  depth: string | null;
  status: string;
  attachments: string | null;
}

interface ExternalApiResponse {
  page: number;
  pageCount: number;
  sortField: string;
  sortOrder: string;
  totalCount: number;
  data: ExternalProduct[];
}

interface MappedInventoryItem {
  id: string;
  master_product_id: string | null;
  product_name: string;
  sku: string;
  in_stock: number;
  allocated: number;
  consumed_30d: number;
  on_order_local_14d: number;
  on_order_shipment_a_60d: number;
  on_order_shipment_b_60d: number;
  signed_quotations: number;
  projected_stock: number;
  safety_stock: number;
  unit_cost: number;
  supply_price: number; // Keep API field name
  install_price: number; // Keep API field name
  supplier_name: string | null; // Keep API field name
  pm_category: string; // Keep API field name
  type: string; // Keep API field name
  description: string | null; // Keep API field name
  uom: string; // Keep API field name
  color: string | null; // Keep API field name
  material: string | null; // Keep API field name
  width: string | null; // Keep API field name
  height: string | null; // Keep API field name
  depth: string | null; // Keep API field name
  status: string; // Keep API field name
  attachments: string | null; // Keep API field name
  created_at: string;
  updated_at: string;
  master_product?: any;
  product_vendors?: any[];
}

/**
 * Fetch all products from external API (all pages)
 */
export async function fetchAllExternalProducts(): Promise<MappedInventoryItem[]> {
  const apiUrl = import.meta.env.VITE_EXTERNAL_PRODUCTS_API_URL || '';
  const apiToken = import.meta.env.VITE_EXTERNAL_PRODUCTS_API_TOKEN || '';

  if (!apiUrl || !apiToken) {
    throw new Error('External Products API URL or Token not configured. Please check your .env file.');
  }

  const allProducts: MappedInventoryItem[] = [];
  let currentPage = 1;
  let totalPages = 1;
  let hasMorePages = true;

  // Fetch all pages
  while (hasMorePages) {
    // Construct URL with query parameters
    const url = `${apiUrl}?size=10&page=${currentPage}&search=`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
    }

    const data: ExternalApiResponse = await response.json();
    
    // Map products from this page
    const mappedProducts = data.data.map((product) => mapExternalProductToInventoryItem(product));
    allProducts.push(...mappedProducts);

    // Update pagination info
    totalPages = data.pageCount;
    currentPage++;
    
    // Check if we've fetched all pages
    if (currentPage > totalPages) {
      hasMorePages = false;
    }
  }

  return allProducts;
}

/**
 * Map external API product to InventoryItem structure
 */
function mapExternalProductToInventoryItem(product: ExternalProduct): MappedInventoryItem {
  const now = new Date().toISOString();
  
  return {
    // Map required fields
    id: product.id.toString(),
    master_product_id: null,
    product_name: product.name,
    sku: product.SKU || `EXT-${product.id}`, // Use SKU or generate one if null
    // Hardcode missing stock fields to 0
    in_stock: 0,
    allocated: 0,
    consumed_30d: 0,
    on_order_local_14d: 0,
    on_order_shipment_a_60d: 0,
    on_order_shipment_b_60d: 0,
    signed_quotations: 0,
    projected_stock: 0,
    safety_stock: 0,
    // Map price fields (keep API field names)
    unit_cost: product.supply_price, // Map to unit_cost for compatibility
    supply_price: product.supply_price, // Keep original API field
    install_price: product.install_price, // Keep original API field
    // Keep all other API fields as-is
    supplier_name: product.supplier_name,
    pm_category: product.pm_category,
    type: product.type,
    description: product.description,
    uom: product.uom,
    color: product.color,
    material: product.material,
    width: product.width,
    height: product.height,
    depth: product.depth,
    status: product.status,
    attachments: product.attachments,
    // Timestamps
    created_at: now,
    updated_at: now,
    // Optional fields
    master_product: undefined,
    product_vendors: [],
  };
}

