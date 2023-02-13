import {
  Seo,
  ShopifyAnalyticsConstants,
  gql,
  useServerAnalytics,
  useSession,
  useShop,
  useShopQuery,
  useUrl,
} from '@shopify/hydrogen';

import Facets from '../../components/Facets.client';
import Layout from '../../components/Layout.server';
import LoadMoreProducts from '../../components/LoadMoreProducts.client';
import NotFound from '../../components/NotFound.server';
import ProductCard from '../../components/ProductCard';

export default function Collection({collectionProductCount = 24, params}) {
  const {languageCode} = useShop();
  const {countryCode = 'US'} = useSession();

  const filters = [];
  const activeFilters = [];

  const location = useUrl();
  const searchParams = new URLSearchParams(location.search);
  const knownFilters = ['productVendor', 'productType'];
  const variantOption = 'variantOption';
  for (const [key, value] of searchParams.entries()) {
    if (knownFilters.includes(key)) {
      filters.push({[key]: value});
      const name = key === 'productVendor' ? 'Vendor' : 'Product type';
      activeFilters.push({label: value, name, urlParam: {key, value}});
    } else if (key.includes(variantOption)) {
      const [name, val] = value.split(':');
      filters.push({variantOption: {name, value: val}});
      activeFilters.push({label: val, name, urlParam: {key, value}});
    }
  }

  if (searchParams.has('minPrice') || searchParams.has('maxPrice')) {
    const price = {};
    if (searchParams.has('minPrice')) {
      price.min = Number(searchParams.get('minPrice')) || 0;
      activeFilters.push({
        label: `Min: $${price.min}`,
        name: 'minPrice',
        urlParam: {key: 'minPrice', value: searchParams.get('minPrice')},
      });
    }
    if (searchParams.has('maxPrice')) {
      price.max = Number(searchParams.get('maxPrice')) || 0;
      activeFilters.push({
        label: `Max: $${price.max}`,
        name: 'maxPrice',
        urlParam: {key: 'maxPrice', value: searchParams.get('maxPrice')},
      });
    }
    filters.push({
      price,
    });
  }

  const {handle} = params;
  const {data} = useShopQuery({
    query: QUERY,
    variables: {
      handle,
      country: countryCode,
      language: languageCode,
      numProducts: collectionProductCount,
      filters,
    },
    preload: true,
  });

  useServerAnalytics(
    data?.collection
      ? {
          shopify: {
            pageType: ShopifyAnalyticsConstants.pageType.collection,
            resourceId: data.collection.id,
          },
        }
      : null,
  );

  if (data?.collection == null) {
    return <NotFound />;
  }

  const collection = data.collection;
  const products = collection.products.nodes;
  const hasNextPage = data.collection.products.pageInfo.hasNextPage;
  const productFilters = data.collection.products.filters.filter((filter) =>
    ['Price', 'Product type', 'Color'].includes(filter.label),
  );

  return (
    <Layout>
      {/* the seo object will be expose in API version 2022-04 or later */}
      <Seo type="collection" data={collection} />
      <h1 className="font-bold text-4xl md:text-5xl text-gray-900 mb-6 mt-6">
        {collection.title}
      </h1>
      <div
        dangerouslySetInnerHTML={{__html: collection.descriptionHtml}}
        className="text-lg"
      />
      <div className="flex justify-between items-center w-full mt-5 mb-5 z-10 relative">
        <Facets
          filters={productFilters}
          activeFilters={activeFilters}
          productCount={products.length}
        />
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
      {hasNextPage && (
        <LoadMoreProducts startingCount={collectionProductCount} />
      )}
    </Layout>
  );
}

const QUERY = gql`
  query CollectionDetails(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $numProducts: Int!
    $filters: [ProductFilter!]
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      title
      descriptionHtml
      description
      seo {
        description
        title
      }
      image {
        id
        url
        width
        height
        altText
      }
      products(first: $numProducts, filters: $filters) {
        filters {
          id
          label
          type
          values {
            id
            label
            count
            input
          }
        }
        nodes {
          id
          title
          vendor
          handle
          descriptionHtml
          compareAtPriceRange {
            maxVariantPrice {
              currencyCode
              amount
            }
            minVariantPrice {
              currencyCode
              amount
            }
          }
          variants(first: 1) {
            nodes {
              id
              title
              availableForSale
              image {
                id
                url
                altText
                width
                height
              }
              priceV2 {
                currencyCode
                amount
              }
              compareAtPriceV2 {
                currencyCode
                amount
              }
            }
          }
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  }
`;
