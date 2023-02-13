import {Link, gql, useShop, useShopQuery} from '@shopify/hydrogen';

import Facets from './Facets.client';
import ProductCard from '../components/ProductCard';
import {useState} from 'react';

const PAGINATION_SIZE = 24;

/**
 * A shared component that defines a single featured collection to display on a storefront
 */
export default function FeaturedCollection({country}) {
  const {languageCode} = useShop();
  const filters = [];
  const activeFilters = [];

  const {data} = useShopQuery({
    query: QUERY,
    variables: {
      country,
      language: languageCode,
      filters,
      pageBy: PAGINATION_SIZE,
    },
    preload: true,
  });

  const collections = data ? data.collections.nodes : [];
  const featuredProductsCollection = collections[0];
  const featuredProducts = featuredProductsCollection
    ? featuredProductsCollection.products.nodes
    : null;

  return (
    <div className="bg-white p-12 shadow-xl rounded-xl mb-10">
      {featuredProductsCollection ? (
        <>
          <div className="flex justify-between items-center mb-8 text-md font-medium">
            <span className="text-black uppercase">
              {featuredProductsCollection.title}
            </span>
            <span className="hidden md:inline-flex">
              <Link
                to={`/collections/${featuredProductsCollection.handle}`}
                className="text-blue-600 hover:underline"
              >
                Shop all
              </Link>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {featuredProducts.map((product) => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
          <div className="md:hidden text-center">
            <Link
              to={`/collections/${featuredProductsCollection.handle}`}
              className="text-blue-600"
            >
              Shop all
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}

const QUERY = gql`
  query indexContent(
    $country: CountryCode
    $language: LanguageCode
    $pageBy: Int!
    $filters: [ProductFilter!]
  ) @inContext(country: $country, language: $language) {
    collections(first: 2) {
      nodes {
        handle
        id
        title
        image {
          id
          url
          altText
          width
          height
        }
        products(first: $pageBy, filters: $filters) {
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
            handle
            id
            title
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
        }
      }
    }
  }
`;
