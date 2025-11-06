// src/products/product.model.ts

import { Product, MOCK_PRODUCTS } from "../types/product";

/**
 * Simulates fetching all products with filtering, sorting, and pagination.
 * This mimics real database logic using the shared product type.
 */
export const getFilteredProducts = async (query: any) => {
  // Simulate a small delay to represent DB latency
  await new Promise((resolve) => setTimeout(resolve, 300));

  let results = MOCK_PRODUCTS;

  // --- 1. Filtering Logic ---
  if (query.category) {
    const categoryFilter = Array.isArray(query.category)
      ? query.category
      : [query.category];
    results = results.filter((p) => categoryFilter.includes(p.category));
  }

  if (query.brand) {
    const brandFilter = Array.isArray(query.brand)
      ? query.brand
      : [query.brand];
    results = results.filter((p) => brandFilter.includes(p.brand));
  }

  if (query.minPrice) {
    results = results.filter((p) => p.price >= parseFloat(query.minPrice));
  }

  if (query.maxPrice) {
    results = results.filter((p) => p.price <= parseFloat(query.maxPrice));
  }

  const totalCount = results.length;

  // --- 2. Sorting Logic ---
  if (query.sort) {
    switch (query.sort) {
      case "price-asc":
        results.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        results.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        results.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }
  }

  // --- 3. Pagination Logic ---
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || results.length;
  const startIndex = (page - 1) * limit;
  const paginatedResults = results.slice(startIndex, startIndex + limit);

  return { products: paginatedResults, totalCount };
};

/**
 * Retrieves a single product by its ID.
 */
export const getProductById = async (
  id: number
): Promise<Product | undefined> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_PRODUCTS.find((p) => p.id === id);
};
