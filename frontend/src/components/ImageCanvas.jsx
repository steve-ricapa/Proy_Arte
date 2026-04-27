function ImageCanvas({ imageBase64 }) {
  return (
    <section className="image-canvas">
      {imageBase64 ? (
        <img
          src={`data:image/png;base64,${imageBase64}`}
          alt="Generative representation"
        />
      ) : (
        <div className="image-placeholder">La imagen aparecerá en tiempo real.</div>
      )}
    </section>
  );
}

export default ImageCanvas;
