import {
  getArticles,
  getCollections,
  getPages,
  getProducts,
} from "lib/shopify";
import { baseUrl, productPath, validateEnvironmentVariables } from "lib/utils";
import { MetadataRoute } from "next";

type Route = {
  url: string;
  lastModified: string;
};

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  validateEnvironmentVariables();

  const routesMap = [""].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
  }));

  const collectionsPromise = getCollections().then((collections) =>
    collections.map((collection) => ({
      url: `${baseUrl}${collection.path}`,
      lastModified: collection.updatedAt,
    })),
  );

  const productsPromise = getProducts({}).then((products) =>
    products.map((product) => ({
      url: `${baseUrl}${productPath(product)}`,
      lastModified: product.updatedAt,
    })),
  );

  const pagesPromise = getPages().then((pages) =>
    pages.map((page) => ({
      url: `${baseUrl}/${page.handle}`,
      lastModified: page.updatedAt,
    })),
  );

  const articlesPromise = getArticles().then((articles) =>
    articles.map((article) => ({
      url: `${baseUrl}/installations/${article.handle}`,
      lastModified: article.publishedAt,
    })),
  );

  // The editorial index itself.
  const staticRoutes: Route[] = [
    { url: `${baseUrl}/shop`, lastModified: new Date().toISOString() },
    { url: `${baseUrl}/installations`, lastModified: new Date().toISOString() },
  ];

  let fetchedRoutes: Route[] = [];

  try {
    fetchedRoutes = (
      await Promise.all([
        collectionsPromise,
        productsPromise,
        pagesPromise,
        articlesPromise,
      ])
    ).flat();
  } catch (error) {
    throw JSON.stringify(error, null, 2);
  }

  fetchedRoutes = [...staticRoutes, ...fetchedRoutes];

  return [...routesMap, ...fetchedRoutes];
}
