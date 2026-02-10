export const getShopMetafieldsQuery = /* GraphQL */ `
  query getShopMetafields {
    shop {
      metafield(namespace: "custom", key: "homepage_video") {
        value
        type
      }
    }
  }
`;