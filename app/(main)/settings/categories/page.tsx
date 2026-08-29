import CategoryManager from "@/components/CategoryManager";

export default function CategorySettingsPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-lg font-bold text-gray-900">카테고리 설정</h1>
      <p className="mb-4 text-sm text-gray-500">
        거래 등록 폼에서 사용할 카테고리를 관리합니다.
      </p>
      <CategoryManager />
    </div>
  );
}
