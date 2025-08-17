import { useEffect, useState } from 'react';
import { fetchPropertyById } from '../services/propertyService';
import { useParams, Link } from 'react-router-dom';

export default function PropertyDetails() {
  const { id } = useParams();
  const [prop, setProp] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPropertyById(id);
        setProp(data);
      } catch (err) {
        setMsg('Failed to load property');
      }
    })();
  }, [id]);

  if (!prop) return <div className="container">Loading... {msg}</div>;

  return (
    <div className="container">
      <h2>{prop.title}</h2>
      {prop.image && <img src={prop.image} alt={prop.title} style={{maxWidth:'600px', width:'100%', borderRadius:'12px'}} />}
      <p><b>Location:</b> {prop.location}</p>
      <p><b>Rent:</b> {prop.rent} BDT</p>
      <p><b>Bedrooms:</b> {prop.bedrooms}</p>
      <p>{prop.description}</p>
      <Link to={`/edit/${prop._id}`} className="btn">Edit</Link>
      <Link to="/" className="btn" style={{marginLeft: '8px'}}>Back</Link>
    </div>
  );
}
