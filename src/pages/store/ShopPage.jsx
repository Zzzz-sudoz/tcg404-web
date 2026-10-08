import LoadingLayout from '../../components/common/LoadingLayout'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { usePrototype } from '../../hooks/usePrototype'
import { games } from '../../data/store'
import { useApiQuery } from '../../hooks/useApiQuery'
import ProductCard from '../../components/store/ProductCard'
import Pagination from '../../components/common/Pagination'
import Dialog from '../../components/common/Dialog'

export default function ShopPage() {
  const { rememberProducts } = usePrototype()
  const [params, setParams] = useSearchParams()
  const [mobileFilters, setMobileFilters] = useState(false)
  const [revision, setRevision] = useState(0)
  const response = useApiQuery('/products', params.toString(), revision)
  const result = {
    items: response.data,
    total: response.meta.total || 0,
    page: response.meta.page || 1,
    pages: response.meta.totalPages || 1,
    error: response.error,
  }
  useEffect(() => {
    if (!response.loading && !response.error) rememberProducts(response.data)
  }, [response.data, response.loading, response.error, rememberProducts])
  const update = (key, value) => {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    if (key !== 'page') next.delete('page')
    if (key === 'game') next.delete('set')
    setParams(next)
  }
  const options = (field) =>
    response.meta.facets?.[
      { setName: 'sets', rarity: 'rarities', condition: 'conditions' }[field]
    ] || []
  const filterContent = (
    <div className="filter-content">
      <div className="row-between">
        <h2>Refine your hunt</h2>
        <button className="text-link" onClick={() => setParams({})}>
          Reset
        </button>
      </div>
      <label>
        Search
        <input
          type="search"
          value={params.get('search') || ''}
          onChange={(e) => update('search', e.target.value)}
          placeholder="Name, set, or number"
        />
      </label>
      <label>
        Game
        <select
          value={params.get('game') || ''}
          onChange={(e) => update('game', e.target.value)}
        >
          <option value="">All games</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </select>
      </label>
      {[
        ['set', 'setName', 'Set'],
        ['rarity', 'rarity', 'Rarity'],
        ['condition', 'condition', 'Condition'],
      ].map(([key, field, label]) => (
        <label key={key}>
          {label}
          <select
            value={params.get(key) || ''}
            onChange={(e) => update(key, e.target.value)}
          >
            <option value="">Any {label.toLowerCase()}</option>
            {options(field).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      ))}
      <div className="form-pair">
        {['minPrice', 'maxPrice'].map((key) => (
          <label key={key}>
            {key === 'minPrice' ? 'Min PHP' : 'Max PHP'}
            <input
              type="number"
              min="0"
              value={params.get(key) || ''}
              onChange={(e) => update(key, e.target.value)}
            />
          </label>
        ))}
      </div>
      {[
        ['inStock', 'In stock only'],
        ['featured', 'Featured singles'],
      ].map(([key, label]) => (
        <label className="check-label" key={key}>
          <input
            type="checkbox"
            checked={params.get(key) === 'true'}
            onChange={(e) => update(key, e.target.checked ? 'true' : '')}
          />
          {label}
        </label>
      ))}
    </div>
  )
  return (
    <div className="page-width workshop-page">
      <header className="page-intro catalog-intro">
        <div>
          <p className="eyebrow">THE CARD ROOM / SINGLES</p>
          <h1>Find your next obsession.</h1>
          <p>Artwork worth a second look. A card for your next deck.</p>
        </div>
        <span className="edition-stamp">
          404
          <br />
          <small>COLLECTOR’S EDITION</small>
        </span>
      </header>
      <div className="catalog-layout">
        <aside className="filter-panel">
          <button
            className="button filter-toggle"
            aria-haspopup="dialog"
            onClick={() => setMobileFilters(true)}
          >
            Filters
          </button>
          <div className="desktop-filters">{filterContent}</div>
          <Dialog
            open={mobileFilters}
            onClose={() => setMobileFilters(false)}
            labelledBy="mobile-filter-heading"
          >
            <h2 id="mobile-filter-heading">Refine your hunt</h2>
            {mobileFilters && filterContent}
            <button
              className="button button-primary"
              onClick={() => setMobileFilters(false)}
            >
              Show results
            </button>
          </Dialog>
        </aside>
        <section aria-label="Catalog results">
          <div className="catalog-toolbar">
            <p role="status">
              {response.loading
                ? 'Loading inventory...'
                : `${result.total} singles`}
            </p>
            <label>
              Sort
              <select
                value={params.get('sort') || ''}
                onChange={(e) => update('sort', e.target.value)}
              >
                <option value="">Featured order</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="newest">Newest first</option>
                <option value="name-asc">Name A–Z</option>
              </select>
            </label>
          </div>
          {result.error ? (
            <div className="empty-panel" role="alert">
              {result.error}
              <button
                className="button"
                onClick={() => setRevision((v) => v + 1)}
              >
                Try again
              </button>
            </div>
          ) : response.loading ? (
            <LoadingLayout />
          ) : !result.items.length ? (
            <div className="empty-panel">
              <h2>No cards in this view.</h2>
              <p>Try another game or clear your filters.</p>
              <button className="button" onClick={() => setParams({})}>
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="product-grid catalog-grid">
                {result.items.map((product) => (
                  <ProductCard key={product.id} product={product} quickAdd />
                ))}
              </div>
              <Pagination
                page={result.page}
                pages={result.pages}
                onChange={(page) => update('page', String(page))}
              />
            </>
          )}
        </section>
      </div>
    </div>
  )
}
