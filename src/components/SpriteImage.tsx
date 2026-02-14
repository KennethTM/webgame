import { useState } from 'react';
import { getSprite, getArtwork } from '../lib/pokemon';
import PokeBall from './PokeBall';

interface SpriteImageProps {
  pokemonId: number;
  variant?: 'sprite' | 'artwork';
  size?: number;
  className?: string;
  alt?: string;
}

const SpriteImage = ({ pokemonId, variant = 'artwork', size = 96, className = '', alt }: SpriteImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const src = variant === 'sprite' ? getSprite(pokemonId) : getArtwork(pokemonId);

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <PokeBall size={size * 0.6} />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <PokeBall size={size * 0.4} spinning />
        </div>
      )}
      <img
        src={src}
        alt={alt ?? `Pokemon #${pokemonId}`}
        width={size}
        height={size}
        className={`${variant === 'sprite' ? '[image-rendering:pixelated]' : ''} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        draggable={false}
      />
    </div>
  );
};

export default SpriteImage;
