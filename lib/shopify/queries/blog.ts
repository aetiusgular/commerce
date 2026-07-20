export const getBlogsQuery = /* GraphQL */ `
  query getBlogs {
    blogs(first: 10) {
      edges {
        node {
          id
          handle
          title
        }
      }
    }
  }
`;

// Fetches all articles from a single blog (no contentHtml — used for listing).
// Article carries its own blog context so the flat array is self-contained.
export const getBlogArticlesQuery = /* GraphQL */ `
  query getBlogArticles($blogHandle: String!) {
    blog(handle: $blogHandle) {
      articles(first: 50, sortKey: PUBLISHED_AT, reverse: true) {
        edges {
          node {
            id
            title
            handle
            publishedAt
            excerpt
            contentHtml
            image {
              url
              altText
              width
              height
            }
            authorV2 {
              name
            }
            tags
            category: metafield(namespace: "custom", key: "category") {
              value
            }
            readTime: metafield(namespace: "custom", key: "read_time") {
              value
            }
            blog {
              handle
              title
            }
          }
        }
      }
    }
  }
`;

// Fetches a single article by handle within a known blog, with full contentHtml.
export const getArticleQuery = /* GraphQL */ `
  query getArticle($blogHandle: String!, $articleHandle: String!) {
    blog(handle: $blogHandle) {
      articleByHandle(handle: $articleHandle) {
        id
        title
        handle
        publishedAt
        excerpt
        contentHtml
        image {
          url
          altText
          width
          height
        }
        authorV2 {
          name
        }
        tags
        category: metafield(namespace: "custom", key: "category") {
          value
        }
        authorRole: metafield(namespace: "custom", key: "author_role") {
          value
        }
        photography: metafield(namespace: "custom", key: "photography") {
          value
        }
        readTime: metafield(namespace: "custom", key: "read_time") {
          value
        }
        gallery: metafield(namespace: "custom", key: "gallery") {
          references(first: 16) {
            nodes {
              ... on MediaImage {
                image {
                  url
                  altText
                  width
                  height
                }
              }
            }
          }
        }
        blog {
          handle
          title
        }
      }
    }
  }
`;
