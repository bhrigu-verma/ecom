import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import './product.css';
import { addCart } from "../redux/action";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const Products = () => {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState([]);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    let isMounted = true;
    const getProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch("https://fakestoreapi.com/products/");
        const products = await response.json();
        if (isMounted) {
          const enhanced = products.map(item => ({
            ...item,
            inStock: Math.random() > 0.2,
            basePrice: item.price, // Store original price as base price
            variants: {
              sizes: ['XS', 'S', 'M', 'L', 'XL'],
              colors: ['Black', 'White', 'Navy', 'Gray']
            }
          }));
          setData(enhanced);
          setFilter(enhanced);
          setLoading(false);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setLoading(false);
      }
    };
    getProducts();
    return () => { isMounted = false; };
  }, []);

  const handleAdd = (product, variant, setQty) => {
    dispatch(addCart({ ...product, selectedVariant: variant }));
    toast.success("Added to cart");
    setQty(prev => prev + 1);
  };

  const filterProduct = category => {
    setFilter(category === 'all' ? data : data.filter(p => p.category === category));
  };

  // Calculate price based on variant selection
  const calculatePrice = (basePrice, size, color) => {
    let price = basePrice;
    
    // Size pricing logic (10% increments/decrements)
    const sizeMultipliers = {
      'XS': 0.9,   // -10%
      'S': 0.95,   // -5%
      'M': 1.0,    // Base price
      'L': 1.1,    // +10%
      'XL': 1.2    // +20%
    };
    
    // Color pricing logic (5% increments)
    const colorMultipliers = {
      'Black': 1.0,     // Base price
      'White': 1.05,    // +5%
      'Navy': 1.1,      // +10%
      'Gray': 1.08      // +8%
    };
    
    price = price * sizeMultipliers[size] * colorMultipliers[color];
    return Math.round(price * 100) / 100; // Round to 2 decimal places
  };

  const Loading = () => (
    <div className="products-grid">
      {[...Array(6)].map((_, i) => <Skeleton key={i} height={400} />)}
    </div>
  );

  const ProductCard = ({ product }) => {
    const [size, setSize] = useState(product.variants.sizes[2]); // Default to 'M'
    const [color, setColor] = useState(product.variants.colors[0]); // Default to 'Black'
    const [quantity, setQuantity] = useState(0);
    const isInStock = product.inStock;
    const variant = { size, color };
    
    // Calculate current price based on selected variants
    const currentPrice = calculatePrice(product.basePrice, size, color);
    const isDiscounted = currentPrice < product.basePrice;
    const isUpcharged = currentPrice > product.basePrice;

    const handleSizeChange = (newSize) => {
      setSize(newSize);
    };

    const handleColorChange = (newColor) => {
      setColor(newColor);
    };

    return (
      <div className="modern-product-card">
        <div className="product-image-container">
          <img src={product.image} alt={product.title} className="product-image" />
          {!isInStock && (
            <div className="out-of-stock-overlay"><span className="out-of-stock-badge">Out of Stock</span></div>
          )}
        </div>
        <div className="product-content">
          <h3 className="product-title" title={product.title}>
            {product.title.length > 50 ? `${product.title.slice(0,50)}...` : product.title}
          </h3>
          <p className="product-description">{product.description.slice(0,100)}...</p>
          <div className="price-section">
            <span className={`current-price ${isDiscounted ? 'discounted' : isUpcharged ? 'upcharged' : ''}`}>
              ${currentPrice}
            </span>
            {(isDiscounted || isUpcharged) && (
              <span className="original-price">${product.basePrice}</span>
            )}
            {isDiscounted && <span className="price-badge discount">Save ${(product.basePrice - currentPrice).toFixed(2)}</span>}
            {isUpcharged && <span className="price-badge upcharge">+${(currentPrice - product.basePrice).toFixed(2)}</span>}
          </div>
          <div className="variants-section">
            <div className="variant-group">
              <label className="variant-label">Size:</label>
              <select 
                className="variant-select" 
                value={size} 
                onChange={e => handleSizeChange(e.target.value)} 
                disabled={!isInStock}
              >
                {product.variants.sizes.map(s => (
                  <option key={s} value={s}>
                    {s} {s === 'XS' ? '(-10%)' : s === 'S' ? '(-5%)' : s === 'M' ? '(Base)' : s === 'L' ? '(+10%)' : '(+20%)'}
                  </option>
                ))}
              </select>
            </div>
            <div className="variant-group">
              <label className="variant-label">Color:</label>
              <select 
                className="variant-select" 
                value={color} 
                onChange={e => handleColorChange(e.target.value)} 
                disabled={!isInStock}
              >
                {product.variants.colors.map(c => (
                  <option key={c} value={c}>
                    {c} {c === 'Black' ? '(Base)' : c === 'White' ? '(+5%)' : c === 'Navy' ? '(+10%)' : '(+8%)'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="action-buttons">
            <Link to={`/product/${product.id}`} className="btn btn-view-details">View Details</Link>
            {isInStock ? (
              quantity > 0 ? (
                <div className="qty-control">
                  <button className="qty-btn" onClick={() => setQuantity(q => Math.max(q-1,0))}>-</button>
                  <span className="qty-num">{quantity}</span>
                  <button className="qty-btn" onClick={() => handleAdd({...product, price: currentPrice}, variant, setQuantity)}>+</button>
                </div>
              ) : (
                <button className="btn btn-add-to-cart" onClick={() => handleAdd({...product, price: currentPrice}, variant, setQuantity)}>
                  Add to Cart
                </button>
              )
            ) : (
              <button className="btn btn-add-to-cart disabled" disabled>
                Out of Stock
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="products-container">
      <div className="products-header">
        <h2 className="products-title">Featured Products</h2>
        <p className="products-subtitle">Discover our handpicked selection of premium items</p>
      </div>
      <div className="filter-buttons">
        {['all',"men's clothing","women's clothing",'jewelery','electronics'].map(cat => (
          <button 
            key={cat} 
            className={`filter-btn ${filter === data && cat==='all' || filter[0]?.category === cat ? 'active':''}`} 
            onClick={() => filterProduct(cat)}
          >
            {cat==='all'?'All Products':cat.charAt(0).toUpperCase()+cat.slice(1)}
          </button>
        ))}
      </div>
      {loading ? <Loading /> : <div className="products-grid">{filter.map(p => <ProductCard key={p.id} product={p} />)}</div>}
    </div>
  );
};

export default Products;