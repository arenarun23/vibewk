import NewProjectForm from "@/components/NewProjectForm";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-lg font-bold text-gray-900">신규 프로젝트</h1>
      <p className="mb-4 text-sm text-gray-500">
        다른 생성형 AI로 만든 코드를 가져오면, 이후 GitHub 저장소 생성·push·배포를 자동으로 진행합니다.
      </p>
      <NewProjectForm />
    </div>
  );
}
