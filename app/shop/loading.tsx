export default function Loading() {
  return (
    <div className="lay-rail">
      <aside className="rail" aria-hidden="true" />
      <div className="lay-main">
        <div className="sgrid">
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="pc">
                <div className="pc-img" />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
