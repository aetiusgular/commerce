export default function Loading() {
  return (
    <>
      <div className="shop-layout">
        <aside className="frail left" />
        <div className="shop-center">
          <div className="slist">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="scard">
                  <div className="scard-img" />
                </div>
              ))}
          </div>
        </div>
        <aside className="frail right" />
      </div>
    </>
  );
}
