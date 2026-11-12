const TINTS = ["#fbeee4", "#e8f1e4", "#e6eef8", "#f6e7ef", "#f4efdc"];

export default function ProductImage({ product, className = "", src, eager = false }) {
  const url = src ?? product.image_url;
  if (url) {
    return (
      <img className={`product-img ${className}`} src={url} alt={product.name}
        loading={eager ? "eager" : "lazy"} decoding="async" />
    );
  }
  const tint = TINTS[(product.id || product.name.length) % TINTS.length];
  return (
    <div className={`product-img placeholder ${className}`} style={{ background: tint }} aria-hidden="true">
      <span>{product.name.charAt(0)}</span>
    </div>
  );
}
