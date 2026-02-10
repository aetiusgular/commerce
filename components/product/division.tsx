function Division({ height }: { height: string }) {
  const h = `h-${height}`;
  return <div className={`w-full ${h}`} />;
}

export { Division };
