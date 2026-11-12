/**
 * Product data for the Google Merchant Center feed (app/feeds/google.xml).
 * Runs on a newer Storefront API version than the rest of the site because
 * `Product.category` (Shopify Standard Product Taxonomy) does not exist in
 * 2023-01. Paginated so the feed never silently truncates at 100 products.
 */
export const FEED_API_VERSION = "2026-10";

export const getFeedProductsQuery = /* GraphQL */ `
  query getFeedProducts($cursor: String, $country: CountryCode)
  @inContext(country: $country) {
    products(first: 100, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        title
        description
        vendor
        tags
        category {
          name
          ancestors {
            name
          }
        }
        images(first: 11) {
          nodes {
            url
          }
        }
        variants(first: 100) {
          nodes {
            id
            availableForSale
            selectedOptions {
              name
              value
            }
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            image {
              url
            }
          }
        }
      }
    }
  }
`;
