export type Maybe<T> = T | null;

export type Connection<T> = {
  edges: Array<Edge<T>>;
};

export type Edge<T> = {
  node: T;
};

export type Cart = Omit<ShopifyCart, "lines"> & {
  lines: CartItem[];
};

export type CartProduct = {
  id: string;
  handle: string;
  title: string;
  featuredImage: Image;
  // Also fetched via the full product fragment on cart lines.
  vendor?: string;
  tags?: string[];
};

export type CartItem = {
  id: string | undefined;
  quantity: number;
  cost: {
    totalAmount: Money;
  };
  merchandise: {
    id: string;
    title: string;
    selectedOptions: {
      name: string;
      value: string;
    }[];
    product: CartProduct;
  };
};

export type Collection = ShopifyCollection & {
  path: string;
};

export type Image = {
  url: string;
  altText: string;
  width: number;
  height: number;
};

export type Menu = {
  title: string;
  path: string;
};

export type Money = {
  amount: string;
  currencyCode: string;
};

export type Page = {
  id: string;
  title: string;
  handle: string;
  body: string;
  bodySummary: string;
  seo?: SEO;
  createdAt: string;
  updatedAt: string;
};

export type Product = Omit<
  ShopifyProduct,
  "variants" | "images" | "collections"
> & {
  variants: ProductVariant[];
  images: Image[];
  collections: { handle: string; title: string }[];
};

export type ProductOption = {
  id: string;
  name: string;
  values: string[];
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  selectedOptions: {
    name: string;
    value: string;
  }[];
  price: Money;
  /** Shopify "Compare-at price". Present (and higher than `price`) when on sale. */
  compareAtPrice: Money | null;
  /** Inventory remaining for the variant, when the store exposes it. */
  quantityAvailable?: number | null;
};

/** Raw Shopify metafield as returned by the Storefront API. */
export type ShopifyMetafield = {
  value: string;
  type: string;
} | null;

export type SEO = {
  title: string;
  description: string;
};

export type ShopifyCart = {
  id: string | undefined;
  checkoutUrl: string;
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
    totalTaxAmount: Money;
  };
  lines: Connection<CartItem>;
  totalQuantity: number;
};

export type ShopifyCollection = {
  handle: string;
  title: string;
  description: string;
  seo: SEO;
  updatedAt: string;
};

export type ShopifyProduct = {
  id: string;
  handle: string;
  availableForSale: boolean;
  title: string;
  description: string;
  descriptionHtml: string;
  options: ProductOption[];
  vendor: string;
  productType: string;
  collections: Connection<{ handle: string; title: string }>;
  priceRange: {
    maxVariantPrice: Money;
    minVariantPrice: Money;
  };
  /**
   * Shopify "Compare-at price" range. Amounts are "0.0" when the product is not
   * on sale, so always compare against `priceRange` before rendering a discount.
   */
  compareAtPriceRange: {
    maxVariantPrice: Money;
    minVariantPrice: Money;
  };
  /** Per-product `custom.measurements` metafield. Null when unset. */
  measurements: ShopifyMetafield;
  /** `custom.details` — JSON label→value pairs for the Description spec table. */
  details: ShopifyMetafield;
  /** `custom.size_fit` — text/HTML for the Size & Fit accordion. */
  sizeFit: ShopifyMetafield;
  /** `custom.materials` — JSON or text for the Materials & Care accordion. */
  materials: ShopifyMetafield;
  variants: Connection<ProductVariant>;
  featuredImage: Image;
  images: Connection<Image>;
  seo: SEO;
  tags: string[];
  updatedAt: string;
};

export type ShopifyCartOperation = {
  data: {
    cart: ShopifyCart;
  };
  variables: {
    cartId: string;
  };
};

export type ShopifyCreateCartOperation = {
  data: { cartCreate: { cart: ShopifyCart } };
};

export type ShopifyAddToCartOperation = {
  data: {
    cartLinesAdd: {
      cart: ShopifyCart;
    };
  };
  variables: {
    cartId: string;
    lines: {
      merchandiseId: string;
      quantity: number;
    }[];
  };
};

export type ShopifyRemoveFromCartOperation = {
  data: {
    cartLinesRemove: {
      cart: ShopifyCart;
    };
  };
  variables: {
    cartId: string;
    lineIds: string[];
  };
};

export type ShopifyUpdateCartOperation = {
  data: {
    cartLinesUpdate: {
      cart: ShopifyCart;
    };
  };
  variables: {
    cartId: string;
    lines: {
      id: string;
      merchandiseId: string;
      quantity: number;
    }[];
  };
};

export type ShopifyCollectionOperation = {
  data: {
    collection: ShopifyCollection;
  };
  variables: {
    handle: string;
  };
};

export type ShopifyCollectionProductsOperation = {
  data: {
    collection: {
      products: Connection<ShopifyProduct>;
    };
  };
  variables: {
    handle: string;
    reverse?: boolean;
    sortKey?: string;
  };
};

export type ShopifyCollectionsOperation = {
  data: {
    collections: Connection<ShopifyCollection>;
  };
};

export type ShopifyMenuOperation = {
  data: {
    menu?: {
      items: {
        title: string;
        url: string;
      }[];
    };
  };
  variables: {
    handle: string;
  };
};

export type ShopifyPageOperation = {
  data: { pageByHandle: Page };
  variables: { handle: string };
};

export type ShopifyPagesOperation = {
  data: {
    pages: Connection<Page>;
  };
};

export type ShopifyProductOperation = {
  data: { product: ShopifyProduct };
  variables: {
    handle: string;
  };
};

export type ShopifyProductRecommendationsOperation = {
  data: {
    productRecommendations: ShopifyProduct[];
  };
  variables: {
    productId: string;
  };
};

export type ShopifyProductsOperation = {
  data: {
    products: Connection<ShopifyProduct>;
  };
  variables: {
    query?: string;
    reverse?: boolean;
    sortKey?: string;
  };
};

export type Article = {
  id: string;
  title: string;
  handle: string;
  publishedAt: string;
  excerpt: string;
  contentHtml: string;
  image: Image | null;
  author: { name: string; role: string | null };
  /** Editorial kicker, e.g. "Interview" / "Essay". From metafield or first tag. */
  category: string | null;
  /** Photography credit, e.g. "Studio AGMNT". */
  photography: string | null;
  /** Read-time label, e.g. "12 min read". */
  readTime: string | null;
  /** Extra images beyond the hero, for the reference two-up / breakout layout. */
  gallery: Image[];
  tags: string[];
  blog: { handle: string; title: string };
};

export type Blog = {
  id: string;
  handle: string;
  title: string;
};

type ShopifyMetafieldValue = { value: string } | null;

export type ShopifyArticle = {
  id: string;
  title: string;
  handle: string;
  publishedAt: string;
  excerpt: string;
  contentHtml: string;
  image: Image | null;
  authorV2: { name: string };
  tags: string[];
  category?: ShopifyMetafieldValue;
  authorRole?: ShopifyMetafieldValue;
  photography?: ShopifyMetafieldValue;
  readTime?: ShopifyMetafieldValue;
  gallery?: {
    references?: { nodes: Array<{ image?: Image | null }> };
  } | null;
  blog: { handle: string; title: string };
};

export type ShopifyBlog = {
  id: string;
  handle: string;
  title: string;
};

export type ShopifyBlogArticlesOperation = {
  data: {
    blog: {
      articles: Connection<ShopifyArticle>;
    } | null;
  };
  variables: {
    blogHandle: string;
  };
};

export type ShopifyArticleOperation = {
  data: {
    blog: {
      articleByHandle: ShopifyArticle | null;
    } | null;
  };
  variables: {
    blogHandle: string;
    articleHandle: string;
  };
};

export type ShopifyBlogsOperation = {
  data: {
    blogs: Connection<ShopifyBlog>;
  };
};

export type ShopMetafield = {
  value: string;
  type: string;
};

export type ShopMetafieldsOperation = {
  data: {
    shop: {
      metafield: ShopMetafield | null;
    };
  };
  variables: {
    namespace: string;
    key: string;
  };
};
