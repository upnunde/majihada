import BuilderPageClient from "../builder-page-client";

type PageProps = {
  params: Promise<Record<string, string>> | Record<string, string>;
  searchParams: Promise<Record<string, string | string[]>> | Record<string, string | string[]>;
};

export default async function EditorPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <BuilderPageClient
      initialParams={resolvedParams}
      initialSearchParams={resolvedSearchParams}
    />
  );
}
