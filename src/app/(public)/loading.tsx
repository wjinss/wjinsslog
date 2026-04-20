import { PageContainer } from "@/components/layout/page-container";
import { LoaderCircle } from "lucide-react";

export default function PublicLoading() {
  return (
    <PageContainer>
      <div className="flex h-screen flex-col items-center justify-center">
        <div className="itmes-center mb-15 flex gap-4 animate-spin">
          <LoaderCircle />
        </div>
      </div>
    </PageContainer>
  );
}
