// app/page.js
import DataList from "../app/components/DataList";

export default function Home() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Next.js Offline Cache Example</h1>
      <DataList />
    </main>
  );
}
