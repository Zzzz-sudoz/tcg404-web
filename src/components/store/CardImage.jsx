import { useState } from 'react'
import Icon from '../common/Icon'

export default function CardImage({ src, name, eager = false }) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (!src || failed) {
    return (
      <div
        className="artwork-placeholder"
        role="img"
        aria-label={`${name}: artwork unavailable`}
      >
        <Icon name="cards" />
        <span>Artwork preview</span>
        <small>Image coming soon</small>
      </div>
    )
  }

  return (
    <div className={`card-image ${loaded ? 'is-loaded' : ''}`}>
      {!loaded && (
        <span className="image-loading" role="status">
          Loading artwork
        </span>
      )}
      <img
        src={src}
        alt={`${name} trading card`}
        loading={eager ? 'eager' : 'lazy'}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  )
}
