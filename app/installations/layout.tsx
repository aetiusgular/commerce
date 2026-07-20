import Footer from "components/layout/footer";

export default function InstallationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="agmnt-editorial flex min-h-screen flex-col">
      <div className="ed-wrap flex-1">{children}</div>
      <Footer />
    </div>
  );
}
