// src/components/PropertyFilters.js
import { useState, useEffect } from 'react';

export default function PropertyFilters({ initial = {}, onApply }) {
  const [city, setCity] = useState(initial.city || '');
  const [minRent, setMinRent] = useState(initial.minRent || '');
  const [maxRent, setMaxRent] = useState(initial.maxRent || '');

  useEffect(() => {
    // keep in sync if parent changes initial (rare, but safe)
    setCity(initial.city || '');
    setMinRent(initial.minRent || '');
    setMaxRent(initial.maxRent || '');
  }, [initial.city, initial.minRent, initial.maxRent]);

  const apply = (e) => {
    e?.preventDefault();
    onApply({
      city: city.trim() || undefined,
      minRent: minRent !== '' ? Number(minRent) : undefined,
      maxRent: maxRent !== '' ? Number(maxRent) : undefined,
    });
  };

  const clear = () => {
    setCity('');
    setMinRent('');
    setMaxRent('');
    onApply({}); // load all
  };

  return (
    <form className="grid" style={{gridTemplateColumns:'1fr 1fr 1fr auto auto', gap:10}} onSubmit={apply}>
      <input
        className="input"
        placeholder="City (e.g., Dhaka)"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />
      <input
        className="input"
        type="number"
        placeholder="Min rent"
        value={minRent}
        onChange={(e) => setMinRent(e.target.value)}
        min="0"
      />
      <input
        className="input"
        type="number"
        placeholder="Max rent"
        value={maxRent}
        onChange={(e) => setMaxRent(e.target.value)}
        min="0"
      />
      <button className="btn" type="submit">Search</button>
      <button className="btn secondary" type="button" onClick={clear}>Clear</button>
    </form>
  );
}
