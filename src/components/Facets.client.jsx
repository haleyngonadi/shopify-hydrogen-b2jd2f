import {Fragment, useEffect, useMemo, useState} from 'react';
import {Link, useNavigate, useUrl} from '@shopify/hydrogen';
import {Menu, Transition} from '@headlessui/react';

import {useDebounce} from 'react-use';

export default function Facets({
  filters = [],
  activeFilters = [],
  productCount,
}) {
  const location = useUrl();
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location],
  );
  const [filterClass, setFilterClass] = useState('hidden');

  const handleOpen = () => {
    const transitionIn = 'flex';
    const transitionOut = 'hidden';
    setFilterClass(filterClass === transitionIn ? transitionOut : transitionIn);
  };

  const filterMarkup = (filter, option) => {
    switch (filter.type) {
      case 'PRICE_RANGE':
        const min =
          params.has('minPrice') && !isNaN(Number(params.get('minPrice')))
            ? Number(params.get('minPrice'))
            : undefined;

        const max =
          params.has('maxPrice') && !isNaN(Number(params.get('maxPrice')))
            ? Number(params.get('maxPrice'))
            : undefined;

        return <PriceRangeFilter min={min} max={max} />;

      default:
        const to = getFilterLink(filter, option.input, params, location);
        const isActive = getActiveStatus(option.input, params);

        return (
          <Link
            className={`pr-6 py-3 flex grow relative text-xs break-words  ${
              isActive ? 'font-bold' : ''
            }`}
            prefetch="intent"
            to={to}
          >
            {option.label}
          </Link>
        );
    }
  };
  return (
    <>
      <nav className="flex lg:flex-row flex-col items-center lg:justify-start justify-between flex-1 lg:space-x-3">
        <span className="lg:block hidden"> Filter: </span>
        <div className="lg:hidden items-center flex justify-between w-full">
          <button className="flex items-center space-x-3" onClick={handleOpen}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
              />
            </svg>
            <span>Filter Products </span>
          </button>

          <div className="text-sm text-gray-500">
            {productCount} {productCount > 1 ? 'products' : 'product'}
          </div>
        </div>

        {activeFilters.length > 0 ? (
          <div className="pt-4 lg:hidden self-start">
            <ActiveFilters filters={activeFilters} />
          </div>
        ) : null}

        <div
          className={`lg:space-x-3 lg:space-y-0 space-y-3 lg:my-0 my-3 lg:flex flex-col lg:flex-row flex-1 w-full lg:w-auto ${filterClass}`}
        >
          {filters.map(
            (filter) =>
              filter.values.length > 0 && (
                <Menu
                  as="div"
                  className="relative inline-block text-left lg:w-auto w-full"
                >
                  {({close}) => (
                    <>
                      <Menu.Button className="inline-flex w-full justify-between lg:justify-center lg:rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 lg:shadow-sm hover:lg:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100">
                        {filter.label}
                        <svg
                          className="-mr-1 ml-2 h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Menu.Button>

                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="lg:absolute relative left-0 mt-2 w-full lg:w-72 origin-top-left border border-gray-300 lg:border-slate-100 bg-white lg:ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div
                            className={`${
                              filter.label == 'Price'
                                ? 'lg:flex hidden'
                                : 'flex'
                            } items-center p-4 border-b border-b-slate-100`}
                          >
                            <SelectedFilters
                              filters={activeFilters}
                              filter={filter}
                              close={close}
                            />
                          </div>
                          <ul
                            key={filter.id}
                            className="divide-y divide-gray-100 px-4 py-2"
                          >
                            {filter.values?.map((option) => {
                              return (
                                <li
                                  key={option.id}
                                  className="flex items-center"
                                >
                                  {filterMarkup(filter, option)}
                                </li>
                              );
                            })}
                          </ul>
                        </Menu.Items>
                      </Transition>
                    </>
                  )}
                </Menu>
              ),
          )}
        </div>
        <div className="text-sm text-gray-500 lg:block hidden">
          {productCount} {productCount > 1 ? 'products' : 'product'}
        </div>
      </nav>
    </>
  );
}

function SelectedFilters({filters = [], filter, close}) {
  const location = useUrl();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  let to = null;
  let relatedFilters;

  if (filter.label == 'Price') {
    relatedFilters = filters.filter((r) =>
      ['minPrice', 'maxPrice'].includes(r.urlParam.key),
    );
    if (relatedFilters.length > 0) {
      to = getPriceResetLink(params, location);
    }
  } else {
    relatedFilters = filters.filter(
      (r) => r.name.toLowerCase() === filter.label.toLowerCase(),
    );
    if (relatedFilters.length > 0) {
      to = getResetFilterLink(relatedFilters[0], params, location);
    }
  }

  return (
    <>
      <div className="flex w-full justify-between items-center">
        {filter.label == 'Price' ? (
          <span className="text-xs  text-gray-900">Price</span>
        ) : (
          <span className="text-xs text-gray-900">
            {relatedFilters.length ?? 0} selected
          </span>
        )}

        {to ? (
          <button
            onClick={() => {
              close();
              navigate(to);
            }}
            className="flex text-xs px-2 underline gap"
          >
            <span className="flex-grow">Reset</span>
          </button>
        ) : null}
      </div>
    </>
  );
}

function ActiveFilters({filters = [], close}) {
  const location = useUrl();
  const params = new URLSearchParams(location.search);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          return (
            <Link
              to={getActiveFilterLink(filter, params, location)}
              className="flex px-2 border rounded-full gap items-center"
              key={`${filter.label}-${filter.urlParam}`}
            >
              <span className="flex-grow mr-1  text-sm">{filter.label}</span>
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

const PRICE_RANGE_FILTER_DEBOUNCE = 500;

function PriceRangeFilter({max, min}) {
  const location = useUrl();
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location],
  );

  const navigate = useNavigate();

  const [minPrice, setMinPrice] = useState(min ? String(min) : '');
  const [maxPrice, setMaxPrice] = useState(max ? String(max) : '');

  useDebounce(
    () => {
      if (
        (minPrice === '' || minPrice === String(min)) &&
        (maxPrice === '' || maxPrice === String(max))
      )
        return;

      const price = {};
      if (minPrice !== '') price.min = minPrice;
      if (maxPrice !== '') price.max = maxPrice;

      const newParams = filterInputToParams('PRICE_RANGE', {price}, params);
      navigate(`${location.pathname}?${newParams.toString()}`);
    },
    PRICE_RANGE_FILTER_DEBOUNCE,
    [minPrice, maxPrice],
  );

  const onChangeMax = (event) => {
    const newMaxPrice = event.target.value;
    setMaxPrice(newMaxPrice);
  };

  const onChangeMin = (event) => {
    const newMinPrice = event.target.value;
    setMinPrice(newMinPrice);
  };

  return (
    <div className="flex items-center lg:w-auto w-full justify-center py-3">
      <label className="inline-flex items-center">
        <span className="mr-2">$</span>
        <input
          name="maxPrice"
          className="text-black border-slate-300 border w-24 py-2 px-2 text-sm"
          type="text"
          defaultValue={min}
          onChange={onChangeMin}
          placeholder="From"
        />
      </label>
      <label className="inline-flex items-center">
        <span className="ml-3 mr-2">$</span>

        <input
          name="minPrice"
          className="text-black border-slate-300 border py-2 w-24 px-2 text-sm"
          type="number"
          defaultValue={max}
          onChange={onChangeMax}
          placeholder="To"
        />
      </label>
    </div>
  );
}

function getFilterLink(filter, rawInput, params, location) {
  const paramsClone = new URLSearchParams(params);
  const newParams = filterInputToParams(filter.type, rawInput, paramsClone);
  return `${location.pathname}?${newParams.toString()}`;
}

function getActiveFilterLink(filter, params, location) {
  const paramsClone = new URLSearchParams(params);
  if (filter.urlParam.key === 'variantOption') {
    const variantOptions = paramsClone.getAll('variantOption');
    const filteredVariantOptions = variantOptions.filter(
      (options) => !options.includes(filter.urlParam.value),
    );
    paramsClone.delete(filter.urlParam.key);
    for (const filteredVariantOption of filteredVariantOptions) {
      paramsClone.append(filter.urlParam.key, filteredVariantOption);
    }
  } else {
    paramsClone.delete(filter.urlParam.key);
  }
  return `${location.pathname}?${paramsClone.toString()}`;
}

function filterInputToParams(type, rawInput, params) {
  const input = typeof rawInput === 'string' ? JSON.parse(rawInput) : rawInput;
  switch (type) {
    case 'PRICE_RANGE':
      if (input.price.min) params.set('minPrice', input.price.min);
      if (input.price.max) params.set('maxPrice', input.price.max);
      break;
    case 'LIST':
      Object.entries(input).forEach(([key, value]) => {
        if (typeof value === 'string') {
          params.set(key, value);
        } else if (typeof value === 'boolean') {
          params.set(key, value.toString());
        } else {
          const {name, value: val} = value;
          const allVariants = params.getAll(`variantOption`);
          const newVariant = `${name}:${val}`;
          if (!allVariants.includes(newVariant)) {
            params.append('variantOption', newVariant);
          } else {
            const filteredVariants = allVariants.filter(
              (options) => !options.includes(newVariant),
            );
            params.delete('variantOption');
            for (const filteredVariant of filteredVariants) {
              params.append('variantOption', filteredVariant);
            }
          }
        }
      });
      break;
  }

  return params;
}
function getResetFilterLink(filter, params, location) {
  const paramsClone = new URLSearchParams(params);

  if (filter.urlParam.key === 'variantOption') {
    const variantOptions = paramsClone.getAll('variantOption');

    const unfilteredVariantOptions = variantOptions.filter((options) =>
      options.includes(filter.name),
    );
    const filteredVariantOptions = variantOptions.filter(
      (options) => !options.includes(filter.name),
    );
    for (const unfilteredVariantOption of unfilteredVariantOptions) {
      paramsClone.delete(filter.urlParam.key, unfilteredVariantOption);
    }
    for (const filteredVariantOption of filteredVariantOptions) {
      paramsClone.append(filter.urlParam.key, filteredVariantOption);
    }
  } else {
    paramsClone.delete(filter.urlParam.key);
  }

  return `${location.pathname}?${paramsClone.toString()}`;
}

function getPriceResetLink(params, location) {
  const paramsClone = new URLSearchParams(params);
  ['minPrice', 'maxPrice'].forEach((key) => paramsClone.delete(key));
  return `${location.pathname}?${paramsClone.toString()}`;
}
function getActiveStatus(rawInput, params) {
  const paramsClone = new URLSearchParams(params);
  const input = typeof rawInput === 'string' ? JSON.parse(rawInput) : rawInput;
  let isIncluded;
  Object.entries(input).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const activeFilters = paramsClone.get(key);
      isIncluded = activeFilters?.includes(value);
    } else if (typeof value === 'boolean') {
      const activeFilters = paramsClone.get(key);

      isIncluded = activeFilters?.includes(value.toString());
    } else {
      const {name, value: val} = value;
      const allVariants = paramsClone.getAll(`variantOption`);
      const newVariant = `${name}:${val}`;
      isIncluded = allVariants.includes(newVariant);
    }
  });
  return isIncluded;
}
