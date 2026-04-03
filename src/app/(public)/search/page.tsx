import { PageContainer } from "@/components/layout/page-container";

interface SearchPageProps {
  searchParams: Promise<{ searchQuery?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { searchQuery } = await searchParams;

  return (
    <PageContainer>
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">검색</h1>
        <div className="rounded-xl border p-4 text-sm">
          <p>
            검색어: <span className="font-medium">{searchQuery ?? " "}</span>
          </p>
        </div>
      </section>
    </PageContainer>
  );
}
