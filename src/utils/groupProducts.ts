export interface ProductVariant {

  [key: string]: any;

  id?: number | string;

  name?: string;

  SKU?: string;

}


export interface ProductGroup {

  name: string;

  variants: ProductVariant[];

  variantCount: number;

}


export const groupProductsByName = (products: ProductVariant[]): ProductGroup[] => {

  const groups = new Map<string, ProductVariant[]>();


  products.forEach((product) => {

    const name = product.name?.trim() || 'Untitled Product';

    if (!groups.has(name)) {

      groups.set(name, []);

    }

    groups.get(name)!.push(product);

  });


  return Array.from(groups.entries()).map(([name, variants]) => ({

    name,

    variants,

    variantCount: variants.length,

  }));

};

